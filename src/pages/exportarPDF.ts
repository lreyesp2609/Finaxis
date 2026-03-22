/**
 * exportarPDF.ts  -  Finaxis - Estado Financiero
 * Reescritura completa:
 *   - Sin caracteres UTF-8 problematicos (flechas, tildes en simbolos) -> ASCII seguro
 *   - Catalogo refleja la jerarquia real (contenedores + hojas)
 *   - Analisis Vertical con modo auto y modo configurado correctos
 *   - Analisis Horizontal con toda la jerarquia
 *   - Logica de roots corregida para catálogos mixtos
 */

import { supabase } from '../lib/supabaseClient';

/* --- Types ---------------------------------------------------------------- */
interface Empresa { id: number; nombre: string; tipo_nombre: string; }
interface EstadoCuenta { id: number; nombre: string; idcatalogo: number; }
interface Anio { id: number; valor: string; }
interface ItemCat {
    id: number; nombre: string; codigo: string | null;
    contenedor: boolean; iditempadre: number | null; depth?: number;
}
interface ItemEstado { iditemcat: number; idanio: number; valor: number; }
interface Riesgo {
    id: number; categoria: string; descripcion: string;
    probabilidad: number; impacto: number; frecuencia_actual: number;
}
interface FToken { type: 'item' | 'operator' | 'number' | 'paren'; value: string; itemId?: number; }
interface Formula {
    id: number; nombre: string; descripcion: string | null;
    codigo: { tokens: FToken[] }; source: 'catalogo' | 'personal';
}
export interface VerticalConfig {
    mode: 'auto' | 'config';
    selectedRoots: number[];
}

/* --- Palette -------------------------------------------------------------- */
type RGB = [number, number, number];
const C = {
    navy: [12, 35, 80] as RGB,
    blue: [24, 95, 165] as RGB,
    blueD: [16, 68, 120] as RGB,
    blueL: [230, 241, 251] as RGB,
    purple: [109, 40, 217] as RGB,
    green: [22, 163, 74] as RGB,
    amber: [180, 100, 6] as RGB,
    red: [185, 28, 28] as RGB,
    dark: [15, 23, 42] as RGB,
    gray: [100, 116, 139] as RGB,
    light: [241, 245, 249] as RGB,
    silver: [226, 232, 240] as RGB,
    white: [255, 255, 255] as RGB,
};

/* --- Helpers --------------------------------------------------------------- */

// Formatear numero sin caracteres especiales
function fmtN(v: number): string {
    if (!v && v !== 0) return '-';
    if (v === 0) return '-';
    return new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(v);
}

// Limpiar texto de caracteres no soportados por jsPDF helvetica
function safe(text: string): string {
    return text
        .replace(/→/g, '->')
        .replace(/←/g, '<-')
        .replace(/↑/g, '^')
        .replace(/↓/g, 'v')
        .replace(/▲/g, '+')
        .replace(/▼/g, '-')
        .replace(/▶/g, '>')
        .replace(/•/g, '*')
        .replace(/–/g, '-')
        .replace(/—/g, '-')
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        .replace(/…/g, '...')
        .replace(/[^\x00-\xFF]/g, '?');
}

function getNivel(p: number, i: number): string {
    const s = p * i;
    return s >= 16 ? 'CRITICO' : s >= 9 ? 'ALTO' : s >= 4 ? 'MODERADO' : 'BAJO';
}

// Construir arbol aplanado con depth
function flattenTree(items: ItemCat[], parentId: number | null = null, depth = 0): ItemCat[] {
    const out: ItemCat[] = [];
    for (const item of items) {
        if (item.iditempadre === parentId) {
            out.push({ ...item, depth });
            out.push(...flattenTree(items, item.id, depth + 1));
        }
    }
    return out;
}

function buildValMap(vals: ItemEstado[]): Record<number, Record<number, number>> {
    const m: Record<number, Record<number, number>> = {};
    for (const v of vals) {
        if (!m[v.iditemcat]) m[v.iditemcat] = {};
        m[v.iditemcat][v.idanio] = v.valor;
    }
    return m;
}

// Sumar recursivamente todos los descendientes hoja de un nodo
function sumLeafs(
    itemId: number,
    anioId: number,
    allItems: ItemCat[],
    valMap: Record<number, Record<number, number>>,
): number {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return 0;
    if (!item.contenedor) return valMap[itemId]?.[anioId] ?? 0;
    return allItems
        .filter(i => i.iditempadre === itemId)
        .reduce((s, child) => s + sumLeafs(child.id, anioId, allItems, valMap), 0);
}

function evalFormula(tokens: FToken[], fm: Record<number, number>): number | null {
    let expr = '';
    for (const t of tokens) {
        if (t.type === 'item') { if (t.itemId === undefined) return null; expr += fm[t.itemId] ?? 0; }
        else if (t.type === 'operator') {
            const op = t.value === '\u2212' ? '-' : t.value === '\u00d7' ? '*' : t.value === '\u00f7' ? '/' : t.value;
            expr += ` ${op} `;
        } else expr += t.value;
    }
    try {
        // eslint-disable-next-line no-new-func
        const r = new Function(`return (${expr})`)();
        return typeof r === 'number' && isFinite(r) ? Math.round(r * 10000) / 10000 : null;
    } catch { return null; }
}

/* =========================================================================
   FUNCION PRINCIPAL
========================================================================= */
export async function exportarPDF(
    empresa: Empresa,
    estadoSel: EstadoCuenta,
    _userId: string,
    onProgress?: (msg: string) => void,
    verticalConfig?: VerticalConfig,
): Promise<void> {
    const prog = (m: string) => onProgress?.(m);

    prog('Cargando jsPDF...');
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm' as any);

    prog('Cargando datos...');
    const [
        [{ data: rawItems }, { data: rawAnios }, { data: rawVals }],
        [{ data: rData }, { data: fpData }, { data: fecData }],
    ] = await Promise.all([
        Promise.all([
            supabase.from('itemcat').select('id,nombre,codigo,contenedor,iditempadre').eq('idcatalogo', estadoSel.idcatalogo).order('id'),
            supabase.from('anioestado').select('id,valor').eq('idestadocuenta', estadoSel.id).order('valor', { ascending: true }),
            supabase.from('itemestado').select('iditemcat,idanio,valor').eq('idestadocuenta', estadoSel.id),
        ]),
        Promise.all([
            supabase.rpc('get_riesgos_empresa', { p_idempresa: empresa.id }),
            supabase.from('formulapersonal').select('id,nombre,descripcion,codigo').eq('idestadocuenta', estadoSel.id),
            supabase.from('formulaec').select('formula(id,nombre,descripcion,codigo)').eq('idestadocuenta', estadoSel.id),
        ]),
    ]);

    const allItems: ItemCat[] = rawItems ?? [];
    const anios: Anio[] = rawAnios ?? [];
    const valMap = buildValMap(rawVals ?? []);
    // Arbol aplanado en orden jerarquico (igual que la web)
    const flatItems = flattenTree(allItems);
    const riesgos: Riesgo[] = rData ?? [];
    const formulas: Formula[] = [
        ...(fpData ?? []).map((f: any) => ({ ...f, source: 'personal' as const })),
        ...(fecData ?? []).map((f: any) => ({
            id: f.formula.id, nombre: f.formula.nombre,
            descripcion: f.formula.descripcion, codigo: f.formula.codigo,
            source: 'catalogo' as const,
        })),
    ];

    // Nodos raiz (iditempadre === null) — incluye tanto contenedores como hojas
    const rootItems = allItems.filter(i => i.iditempadre === null);
    // Cuentas hoja (no contenedor) para formulas
    const leafItems = allItems.filter(i => !i.contenedor);

    prog('Generando PDF...');

    /* --- Documento --------------------------------------------------------- */
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
    let y = 0;

    const newPage = () => { doc.addPage(); y = 28; };
    const checkY = (needed: number) => { if (y + needed > PH - 16) newPage(); };

    /* --- Primitivas de dibujo --------------------------------------------- */

    const accentBar = (col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, 0, 5, PH, 'F');
    };

    const sectionHeader = (num: string, title: string, sub: string, col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, 0, PW, 22, 'F');
        const darker: RGB = [Math.max(col[0] - 30, 0), Math.max(col[1] - 30, 0), Math.max(col[2] - 30, 0)];
        doc.setFillColor(...darker);
        doc.rect(PW - 50, 0, 50, 22, 'F');
        // Numero seccion
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...C.white);
        doc.text(`SECCION ${num}`, ML + 4, 8);
        // Titulo
        doc.setFontSize(13);
        doc.text(safe(title), ML + 4, 17);
        // Sub titulo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(safe(sub), PW - MR - 2, 13, { align: 'right', maxWidth: 44 });
        y = 28;
    };

    const footer = (pageN: number, total: number, col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, PH - 9, PW, 9, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...C.white);
        doc.text(safe(`${empresa.nombre} - ESTADO FINANCIERO - FINAXIS`), ML + 4, PH - 3.5);
        doc.text(new Date().toLocaleDateString('es-EC'), PW / 2, PH - 3.5, { align: 'center' });
        doc.text(`${pageN} / ${total}`, PW - MR, PH - 3.5, { align: 'right' });
    };

    const pill = (text: string, bg: RGB, fg: RGB) => {
        checkY(9);
        doc.setFillColor(...bg);
        doc.roundedRect(ML, y, CW, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...fg);
        doc.text(safe(text), ML + 4, y + 4.8, { maxWidth: CW - 8 });
        y += 9.5;
    };

    const sectionTitle = (text: string, col: RGB) => {
        checkY(12);
        doc.setFillColor(...col);
        doc.rect(ML, y, 3.5, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.dark);
        doc.text(safe(text), ML + 6, y + 5.5);
        y += 11;
    };

    /**
     * Tabla generica
     * headers: array de strings
     * rows: array de arrays de strings
     * colWidths: array de anchos (debe sumar CW)
     * opts.hBg: color de cabecera
     * opts.aRight: indices de columnas alineadas a la derecha
     * opts.boldRows: indices de filas en negrita (para contenedores)
     * opts.rowColors: mapa index->RGB para colorear filas especificas
     */
    const drawTable = (
        headers: string[],
        rows: string[][],
        colWidths: number[],
        opts: {
            hBg?: RGB;
            aRight?: number[];
            boldRows?: number[];
            rowBg?: Record<number, RGB>;
            rowFg?: Record<number, RGB>;
            compact?: boolean;
        } = {},
    ) => {
        const {
            hBg = C.blue,
            aRight = [],
            boldRows = [],
            rowBg = {},
            rowFg = {},
            compact = false,
        } = opts;
        const rH = compact ? 5.5 : 6.5;

        checkY(rH + 2);

        // Cabecera
        doc.setFillColor(...hBg);
        doc.rect(ML, y, CW, rH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...C.white);
        let cx = ML;
        headers.forEach((h, i) => {
            if (aRight.includes(i)) doc.text(safe(h), cx + colWidths[i] - 2, y + rH - 1.5, { align: 'right' });
            else doc.text(safe(h), cx + 2.5, y + rH - 1.5);
            cx += colWidths[i];
        });
        y += rH;

        if (!rows.length) {
            doc.setFillColor(...C.light);
            doc.rect(ML, y, CW, rH, 'F');
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6);
            doc.setTextColor(...C.gray);
            doc.text('Sin datos disponibles', PW / 2, y + rH - 1.8, { align: 'center' });
            y += rH + 3;
            return;
        }

        rows.forEach((row, ri) => {
            checkY(rH);
            const bg: RGB = rowBg[ri] ?? (ri % 2 === 0 ? [248, 250, 252] : [255, 255, 255]);
            const fg: RGB = rowFg[ri] ?? C.dark;
            const isBold = boldRows.includes(ri);

            doc.setFillColor(...bg);
            doc.rect(ML, y, CW, rH, 'F');
            doc.setDrawColor(...C.silver);
            doc.line(ML, y + rH, ML + CW, y + rH);

            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(isBold ? 6 : 5.8);
            doc.setTextColor(...fg);

            cx = ML;
            row.forEach((cell, ci) => {
                const txt = safe(String(cell ?? '-'));
                if (aRight.includes(ci)) {
                    doc.text(txt, cx + colWidths[ci] - 2, y + rH - 1.8, { align: 'right' });
                } else {
                    // Truncar si es muy largo — jsPDF no hace word-wrap en tablas
                    const maxChars = Math.floor(colWidths[ci] / 1.55);
                    const display = txt.length > maxChars ? txt.slice(0, maxChars - 1) + '.' : txt;
                    doc.text(display, cx + 2.5, y + rH - 1.8);
                }
                cx += colWidths[ci];
            });
            y += rH;
        });
        y += 4;
    };

    /* =========================================================================
       PORTADA
    ========================================================================= */
    // Fondo navy full page
    doc.setFillColor(...C.navy);
    doc.rect(0, 0, PW, PH, 'F');

    // Banda azul principal hasta y=235
    doc.setFillColor(...C.blue);
    doc.rect(0, 0, PW, 235, 'F');

    // Panel derecho oscuro
    doc.setFillColor(...C.blueD);
    doc.rect(PW - 50, 0, 50, 235, 'F');

    // Franja blanca superior
    doc.setFillColor(...C.white);
    doc.rect(0, 0, PW, 3.5, 'F');

    // Logo triangulo
    doc.setFillColor(...C.white);
    doc.triangle(ML, 28, ML + 10, 14, ML + 20, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.text('FINAXIS', ML + 24, 25);

    // Titulo principal
    doc.setFontSize(32);
    doc.text('ESTADO', ML, 55);
    doc.text('FINANCIERO', ML, 69);

    // Linea divisora
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, 74, CW - 52, 0.5, 'F');

    // Datos empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...C.white);
    doc.text(safe(empresa.nombre), ML, 84);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(179, 210, 240);
    doc.text(`Tipo: ${safe(empresa.tipo_nombre)}`, ML, 92);
    doc.text(`Estado: ${safe(estadoSel.nombre)}`, ML, 99);
    doc.text(safe(
        `Generado el ${new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
    ), ML, 106);

    // KPI cards
    const kpiData = [
        { label: 'PERIODOS', val: anios.length.toString(), sub: anios.map(a => a.valor).join(', ') },
        { label: 'CUENTAS', val: leafItems.length.toString(), sub: 'en catalogo activo' },
        { label: 'RIESGOS', val: riesgos.length.toString(), sub: `${riesgos.filter(r => ['ALTO', 'CRITICO'].includes(getNivel(r.probabilidad, r.impacto))).length} alto/critico` },
        { label: 'FORMULAS', val: formulas.length.toString(), sub: `${formulas.filter(f => f.source === 'personal').length} personales` },
    ];
    const kw = CW / 4;
    kpiData.forEach((k, i) => {
        const kx = ML + i * kw;
        doc.setFillColor(...C.blueD);
        doc.roundedRect(kx, 116, kw - 3, 27, 3, 3, 'F');
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(255, 255, 255);
        doc.roundedRect(kx, 116, kw - 3, 27, 3, 3, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(21);
        doc.setTextColor(...C.white);
        doc.text(k.val, kx + (kw - 3) / 2, 129, { align: 'center' });
        doc.setFontSize(6);
        doc.text(k.label, kx + (kw - 3) / 2, 135, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(179, 210, 240);
        doc.text(safe(k.sub), kx + (kw - 3) / 2, 139, { align: 'center' });
    });

    // Divisor
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, 151, CW - 52, 0.4, 'F');

    // Tabla de contenido
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(179, 210, 240);
    doc.text('CONTENIDO DEL INFORME', ML, 157);

    const toc = [
        { n: '01', t: 'Catalogo de Cuentas', d: 'Estructura jerarquica completa con valores por periodo' },
        { n: '02', t: 'Analisis Vertical', d: verticalConfig?.mode === 'config' ? `Base configurada: ${verticalConfig.selectedRoots.length} grupo(s)` : 'Cada grupo = su propio 100%' },
        { n: '03', t: 'Analisis Horizontal', d: `Variacion entre periodos: ${anios.map(a => a.valor).join(' -> ')}` },
        { n: '04', t: 'Ratios Financieros', d: `${formulas.length} formula(s) calculadas automaticamente` },
        { n: '05', t: 'Riesgo Operacional', d: `${riesgos.length} riesgo(s) registrados este mes` },
    ];
    let ty = 163;
    toc.forEach(c => {
        doc.setFillColor(...C.blueD);
        doc.roundedRect(ML, ty, CW - 52, 9, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.white);
        doc.text(c.n, ML + 3, ty + 6);
        doc.text(c.t, ML + 12, ty + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(179, 210, 240);
        doc.text(safe(c.d), ML + 65, ty + 6, { maxWidth: CW - 52 - 65 - 4 });
        ty += 11;
    });

    // Zona navy inferior
    doc.setFillColor(...C.navy);
    doc.rect(0, 235, PW, PH - 235, 'F');
    doc.setFillColor(...C.blue);
    doc.rect(0, 235, 5, PH - 235, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text('Generado automaticamente por Finaxis - Sistema de Analisis Financiero', ML + 6, 245);
    doc.text(safe(`Empresa: ${empresa.nombre}  -  Periodo: ${anios.map(a => a.valor).join(' - ')}`), ML + 6, 252);

    /* =========================================================================
       S1 - CATALOGO DE CUENTAS
       Reproduce fielmente la jerarquia de la web:
       - Contenedores = fila oscura (como la web)
       - Hojas = fila normal con indentacion
    ========================================================================= */
    newPage();
    accentBar(C.blue);
    sectionHeader('1', 'CATALOGO DE CUENTAS', estadoSel.nombre, C.blue);
    pill(
        `${safe(estadoSel.nombre)}  -  ${flatItems.length} items  -  Periodos: ${anios.map(a => a.valor).join(', ')}`,
        C.blueL, C.blue,
    );

    {
        // Columnas: etiqueta ancha + una por año
        const labelW = anios.length <= 2 ? 105 : 85;
        const colW = (CW - labelW) / Math.max(anios.length, 1);
        const headers = ['Cuenta', ...anios.map(a => a.valor)];
        const widths = [labelW, ...anios.map(() => colW)];

        // Construir filas desde el arbol aplanado
        const rows: string[][] = [];
        const boldRowIdxs: number[] = [];
        const bgMap: Record<number, RGB> = {};
        const fgMap: Record<number, RGB> = {};

        flatItems.forEach((item) => {
            const depth = item.depth ?? 0;
            const indent = '  '.repeat(Math.min(depth, 5));
            const codePart = item.codigo ? `[${item.codigo}] ` : '';
            const label = `${indent}${codePart}${item.nombre}`;

            const rowData = [
                label,
                ...anios.map(a => {
                    if (item.contenedor) {
                        // Para contenedores mostrar la suma de sus hojas
                        const total = sumLeafs(item.id, a.id, allItems, valMap);
                        return total !== 0 ? fmtN(total) : '-';
                    }
                    return fmtN(valMap[item.id]?.[a.id] ?? 0);
                }),
            ];

            const ri = rows.length;
            rows.push(rowData);

            if (item.contenedor) {
                boldRowIdxs.push(ri);
                // Degradar el azul oscuro segun profundidad
                const shade = Math.min(depth, 3);
                const base = 30 + shade * 15;
                bgMap[ri] = [base, base + 20, base + 60] as RGB;
                fgMap[ri] = C.white;
            }
        });

        drawTable(headers, rows, widths, {
            hBg: C.blue,
            aRight: anios.map((_, i) => i + 1),
            boldRows: boldRowIdxs,
            rowBg: bgMap,
            rowFg: fgMap,
        });
    }

    /* =========================================================================
       S2 - ANALISIS VERTICAL
    ========================================================================= */
    newPage();
    accentBar(C.purple);

    const isConfigMode =
        verticalConfig?.mode === 'config' &&
        (verticalConfig?.selectedRoots?.length ?? 0) > 0;

    sectionHeader(
        '2',
        'ANALISIS VERTICAL',
        isConfigMode
            ? `Base configurada: ${verticalConfig!.selectedRoots.length} grupo(s)`
            : 'Automatico - cada grupo = su propio 100%',
        C.purple,
    );

    if (isConfigMode) {
        /* --- Modo configurado: reproducir lo que el usuario selecciono --- */
        const cfgIds = verticalConfig!.selectedRoots;
        const cfgItems = allItems.filter(i => cfgIds.includes(i.id));

        // Total de la base por año
        const cfgTotals: Record<number, number> = {};
        for (const a of anios) {
            cfgTotals[a.id] = cfgItems.reduce(
                (s, ci) => s + Math.abs(sumLeafs(ci.id, a.id, allItems, valMap)),
                0,
            );
        }

        pill(
            `BASE = 100%: ${cfgItems.map(r => r.codigo ? `[${r.codigo}]` : r.nombre.slice(0, 12)).join(' + ')}   ${anios.map(a => `${a.valor}: ${fmtN(cfgTotals[a.id])}`).join('  |  ')}`,
            [237, 233, 254], C.purple,
        );

        sectionTitle('Grupos seleccionados como base', C.purple);

        // Tabla resumen de la base
        {
            const lW = 90;
            const cW = (CW - lW) / Math.max(anios.length, 1);
            const hh = ['Grupo (base = 100%)', ...anios.map(a => a.valor)];
            const ww = [lW, ...anios.map(() => cW)];
            const baseRows = cfgItems.map(r => [
                safe(`${r.codigo ? `[${r.codigo}] ` : ''}${r.nombre}`),
                ...anios.map(a => fmtN(Math.abs(sumLeafs(r.id, a.id, allItems, valMap)))),
            ]);
            const totalRow = [
                'TOTAL BASE (100%)',
                ...anios.map(a => fmtN(cfgTotals[a.id])),
            ];
            drawTable(hh, [...baseRows, totalRow], ww, {
                hBg: C.purple,
                aRight: anios.map((_, i) => i + 1),
                boldRows: [baseRows.length],
                rowBg: { [baseRows.length]: [237, 233, 254] as RGB },
                rowFg: { [baseRows.length]: C.purple },
            });
        }

        sectionTitle('Participacion de cada grupo sobre la base', C.purple);

        // Tabla detalle con %
        {
            const lW = anios.length <= 2 ? 80 : 65;
            const cW = (CW - lW) / (anios.length * 2);
            const hh = ['Cuenta', ...anios.flatMap(a => [a.valor, '% base'])];
            const ww = [lW, ...anios.flatMap(() => [cW * 1.5, cW * 0.5])];

            const detailRows: string[][] = [];
            const bRows: number[] = [];

            for (const root of cfgItems) {
                const ri = detailRows.length;
                bRows.push(ri);
                const totLeafs = Math.abs(sumLeafs(root.id, anios[0]?.id ?? 0, allItems, valMap));
                detailRows.push([
                    safe(`> ${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`),
                    ...anios.flatMap(a => {
                        const tot = Math.abs(sumLeafs(root.id, a.id, allItems, valMap));
                        const base = cfgTotals[a.id] ?? 0;
                        const pct = base > 0 ? (tot / base * 100).toFixed(1) + '%' : '-';
                        return [fmtN(tot), pct];
                    }),
                ]);

                // Hijos directos no-contenedor
                allItems
                    .filter(i => i.iditempadre === root.id && !i.contenedor)
                    .forEach(child => {
                        detailRows.push([
                            safe(`  ${child.codigo ? `[${child.codigo}] ` : ''}${child.nombre}`),
                            ...anios.flatMap(a => {
                                const val = valMap[child.id]?.[a.id] ?? 0;
                                const base = cfgTotals[a.id] ?? 0;
                                const pct = base > 0 ? (Math.abs(val) / base * 100).toFixed(1) + '%' : '-';
                                return [fmtN(val), pct];
                            }),
                        ]);
                    });
            }

            drawTable(hh, detailRows, ww, {
                hBg: [130, 80, 210] as RGB,
                aRight: anios.flatMap((_, i) => [i * 2 + 1, i * 2 + 2]),
                boldRows: bRows,
                rowBg: Object.fromEntries(bRows.map(i => [i, [245, 240, 255] as RGB])),
            });
        }

    } else {
        /* --- Modo automatico: cada nodo raiz = su propio 100% --- */
        pill(
            `Modo automatico: cada grupo raiz es su propio 100%. Los % muestran participacion dentro de su bloque.`,
            [237, 233, 254], C.purple,
        );

        sectionTitle('Totales por grupo raiz', C.purple);

        // Tabla de totales de nodos raiz
        {
            const lW = 90;
            const cW = (CW - lW - 20) / Math.max(anios.length, 1);
            const hh = ['Grupo', ...anios.map(a => a.valor), 'Var. %'];
            const ww = [lW, ...anios.map(() => cW), 20];

            const rows = rootItems.map(root => {
                const tots = anios.map(a => sumLeafs(root.id, a.id, allItems, valMap));
                const vp = tots.length >= 2 && tots[0] !== 0
                    ? `${((tots[tots.length - 1] - tots[0]) / Math.abs(tots[0]) * 100).toFixed(1)}%`
                    : '-';
                return [
                    safe(`${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`),
                    ...tots.map(fmtN),
                    vp,
                ];
            }).filter(r => r.slice(1, -1).some(v => v !== '-'));

            const bRows = rows.map((_, i) => i).filter(i => {
                const root = rootItems[i];
                return root?.contenedor;
            });

            drawTable(hh, rows, ww, {
                hBg: C.purple,
                aRight: [...anios.map((_, i) => i + 1), anios.length + 1],
            });
        }

        sectionTitle('Participacion porcentual', C.purple);

        // Una sub-seccion por cada nodo raiz que tiene valor
        for (const root of rootItems) {
            const rootTotal: Record<number, number> = {};
            for (const a of anios) {
                rootTotal[a.id] = Math.abs(sumLeafs(root.id, a.id, allItems, valMap));
            }
            if (anios.every(a => rootTotal[a.id] === 0)) continue;

            checkY(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...C.purple);
            const rootLabel = safe(`${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`) +
                '  ' + anios.map(a => `${a.valor}: ${fmtN(rootTotal[a.id])}`).join(' | ');
            doc.text(rootLabel, ML, y);
            y += 7;

            // Hijos del root (o el root mismo si no tiene hijos)
            const children = allItems.filter(i => i.iditempadre === root.id);
            const items_to_show = children.length > 0 ? children : [root];

            const lW = anios.length <= 2 ? 85 : 65;
            const cW = (CW - lW) / (anios.length * 2);
            const hh = ['Cuenta', ...anios.flatMap(a => [a.valor, '% Part.'])];
            const ww = [lW, ...anios.flatMap(() => [cW * 1.5, cW * 0.5])];

            const rows: string[][] = [];
            const bRows: number[] = [];

            items_to_show.forEach(item => {
                const ri = rows.length;
                if (item.contenedor) bRows.push(ri);

                rows.push([
                    safe(`${item.codigo ? `[${item.codigo}] ` : ''}${item.nombre}`),
                    ...anios.flatMap(a => {
                        const val = item.contenedor
                            ? Math.abs(sumLeafs(item.id, a.id, allItems, valMap))
                            : (valMap[item.id]?.[a.id] ?? 0);
                        const base = rootTotal[a.id] ?? 0;
                        const pct = base > 0 ? (Math.abs(val) / base * 100).toFixed(1) + '%' : '-';
                        return [fmtN(val), pct];
                    }),
                ]);
            });

            if (rows.length > 0) {
                drawTable(hh, rows, ww, {
                    hBg: [130, 80, 210] as RGB,
                    aRight: anios.flatMap((_, i) => [i * 2 + 1, i * 2 + 2]),
                    boldRows: bRows,
                    compact: rows.length > 10,
                });
            }
        }
    }

    /* =========================================================================
       S3 - ANALISIS HORIZONTAL
    ========================================================================= */
    newPage();
    accentBar(C.green);
    sectionHeader('3', 'ANALISIS HORIZONTAL', anios.map(a => a.valor).join(' -> '), C.green);
    pill(
        `Variacion absoluta y relativa entre periodos: ${anios.map(a => a.valor).join(' -> ')}`,
        [240, 253, 244], C.green,
    );

    if (anios.length < 2) {
        pill('Se necesitan al menos 2 periodos para el analisis horizontal.', [254, 249, 195], C.amber);
    } else {
        for (let pi = 0; pi < anios.length - 1; pi++) {
            const aB = anios[pi];
            const aC = anios[pi + 1];
            sectionTitle(`${aB.valor}  ->  ${aC.valor}`, C.green);

            const cS = (CW - 65) / 4;
            const hh = ['Cuenta', aB.valor, aC.valor, 'Var. $', 'Var. %'];
            const ww = [65, cS, cS, cS, cS];

            const rows: string[][] = [];
            const bRows: number[] = [];
            const bgMap: Record<number, RGB> = {};
            const fgMap: Record<number, RGB> = {};

            // Recorrer el arbol aplanado igual que la web
            flatItems.forEach(item => {
                const depth = item.depth ?? 0;
                const indent = '  '.repeat(Math.min(depth, 4));
                const codePart = item.codigo ? `[${item.codigo}] ` : '';

                const vA = item.contenedor
                    ? Math.abs(sumLeafs(item.id, aB.id, allItems, valMap))
                    : (valMap[item.id]?.[aB.id] ?? 0);
                const vC = item.contenedor
                    ? Math.abs(sumLeafs(item.id, aC.id, allItems, valMap))
                    : (valMap[item.id]?.[aC.id] ?? 0);

                if (vA === 0 && vC === 0) return;

                const diff = vC - vA;
                const pct = vA !== 0 ? (diff / Math.abs(vA) * 100).toFixed(1) + '%' : '-';
                const varStr = diff !== 0 ? (diff > 0 ? '+' : '') + fmtN(diff) : '-';

                const ri = rows.length;
                rows.push([
                    safe(`${indent}${codePart}${item.nombre}`),
                    fmtN(vA), fmtN(vC), varStr, pct,
                ]);

                if (item.contenedor) {
                    bRows.push(ri);
                    const d = Math.min(depth, 3);
                    const base = 25 + d * 15;
                    bgMap[ri] = [base, base + 20, base + 55] as RGB;
                    fgMap[ri] = C.white;
                } else if (diff > 0) {
                    // Fila positiva: fondo verde muy suave
                    bgMap[ri] = [240, 253, 244] as RGB;
                } else if (diff < 0) {
                    // Fila negativa: fondo rojo muy suave
                    bgMap[ri] = [254, 242, 242] as RGB;
                }
            });

            drawTable(hh, rows, ww, {
                hBg: C.green,
                aRight: [1, 2, 3, 4],
                boldRows: bRows,
                rowBg: bgMap,
                rowFg: fgMap,
                compact: rows.length > 15,
            });
        }
    }

    /* =========================================================================
       S4 - RATIOS FINANCIEROS
    ========================================================================= */
    newPage();
    accentBar(C.amber);
    sectionHeader('4', 'RATIOS FINANCIEROS', `${formulas.length} formula(s)`, C.amber);

    if (!formulas.length) {
        pill('Sin formulas. Crealas en Mis analisis -> panel de Formulas.', [255, 251, 235], C.amber);
    } else {
        pill(`Calculadas para: ${anios.map(a => a.valor).join(', ')}`, [255, 251, 235], C.amber);
        sectionTitle('Resultados por formula', C.amber);

        const lW = 65;
        const srcW = 22;
        const resW = Math.min(28, (CW - lW - srcW) / Math.max(anios.length, 1));
        const hh = ['Formula', 'Fuente', ...anios.map(a => a.valor)];
        const ww = [lW, srcW, ...anios.map(() => resW)];

        const fRows = formulas.map(f => {
            const ress = anios.map(a => {
                const fm: Record<number, number> = {};
                for (const item of leafItems) fm[item.id] = valMap[item.id]?.[a.id] ?? 0;
                const r = evalFormula(f.codigo.tokens, fm);
                return r === null ? 'Error' : r === 0 ? '-' : r.toFixed(2);
            });
            return [safe(f.nombre), f.source === 'personal' ? 'Personal' : 'Catalogo', ...ress];
        });

        drawTable(hh, fRows, ww, { hBg: C.amber, aRight: anios.map((_, i) => i + 2) });

        // Expresiones
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(133, 77, 14);
        doc.text('Expresiones:', ML, y);
        y += 7;

        formulas.forEach(f => {
            checkY(15);
            doc.setFillColor(255, 249, 195);
            doc.roundedRect(ML, y, CW, 12, 2, 2, 'F');
            doc.setFillColor(...C.amber);
            doc.rect(ML, y, 3.5, 12, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(133, 77, 14);
            doc.text(safe(f.nombre), ML + 6, y + 5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...C.gray);
            const expr = f.codigo.tokens.map(t => safe(t.value)).join(' ');
            doc.text(`= ${expr}`, ML + 6, y + 10, { maxWidth: CW - 10 });
            y += 14;
        });
    }

    /* =========================================================================
       S5 - RIESGO OPERACIONAL
    ========================================================================= */
    newPage();
    accentBar(C.red);
    sectionHeader(
        '5',
        'RIESGO OPERACIONAL',
        new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }),
        C.red,
    );

    // KPI cards de riesgo
    const rKpis = [
        { l: 'CRITICOS', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'CRITICO').length, col: [140, 10, 10] as RGB },
        { l: 'ALTOS', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'ALTO').length, col: C.red },
        { l: 'MODERADOS', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'MODERADO').length, col: C.amber },
        { l: 'BAJOS', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'BAJO').length, col: C.green },
    ];
    const rkw = CW / 4;
    rKpis.forEach((k, i) => {
        const kx = ML + i * rkw;
        doc.setFillColor(...C.light);
        doc.roundedRect(kx, y, rkw - 3, 22, 3, 3, 'F');
        doc.setFillColor(...k.col);
        doc.rect(kx, y, 3.5, 22, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(...k.col);
        doc.text(k.c.toString(), kx + 3.5 + (rkw - 6.5) / 2, y + 13, { align: 'center' });
        doc.setFontSize(6);
        doc.setTextColor(...C.gray);
        doc.text(k.l, kx + 3.5 + (rkw - 6.5) / 2, y + 19, { align: 'center' });
    });
    y += 26;

    if (!riesgos.length) {
        pill('Sin riesgos registrados este mes.', [254, 226, 226], C.red);
    } else {
        const cats = [...new Set(riesgos.map(r => r.categoria))].sort();

        for (const cat of cats) {
            const catR = riesgos.filter(r => r.categoria === cat);
            sectionTitle(`Categoria: ${safe(cat)}`, C.red);

            // Tabla de riesgos con descripcion multilinea
            // Columnas: Descripcion (ancha) | P | I | Nivel | Frec.
            const dW = CW - 10 - 10 - 28 - 18;
            const colW5 = [dW, 10, 10, 28, 18];
            const hdrs5 = ['Descripcion', 'P', 'I', 'Nivel', 'Frec./Mes'];
            const lineH = 4.5; // altura por linea de texto
            const cellPadV = 2.5; // padding vertical por encima y debajo del texto

            // Cabecera de la tabla
            checkY(8);
            doc.setFillColor(...C.red);
            doc.rect(ML, y, CW, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...C.white);
            let hcx = ML;
            hdrs5.forEach((h, i) => {
                if (i > 0) doc.text(h, hcx + colW5[i] / 2, y + 4.8, { align: 'center' });
                else doc.text(h, hcx + 2.5, y + 4.8);
                hcx += colW5[i];
            });
            y += 7;

            catR.forEach((r, ri) => {
                const nivel = getNivel(r.probabilidad, r.impacto);
                const nivelBg: RGB = nivel === 'CRITICO' ? [252, 231, 243] : nivel === 'ALTO' ? [254, 226, 226] : nivel === 'MODERADO' ? [254, 249, 195] : [220, 252, 231];
                const nivelFg: RGB = nivel === 'CRITICO' ? [190, 24, 93] : nivel === 'ALTO' ? [185, 28, 28] : nivel === 'MODERADO' ? [133, 77, 6] : [22, 101, 52];

                // Calcular cuantas lineas necesita la descripcion
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(5.8);
                const descLines: string[] = doc.splitTextToSize(safe(r.descripcion), dW - 5);
                const rowH = Math.max(descLines.length * lineH + cellPadV * 2, 10);

                checkY(rowH);

                // Fondo de la fila
                doc.setFillColor(...(ri % 2 === 0 ? nivelBg : [255, 255, 255] as RGB));
                doc.rect(ML, y, CW, rowH, 'F');
                // Borde nivel para filas pares
                if (ri % 2 === 0) {
                    doc.setFillColor(...nivelBg);
                    doc.rect(ML, y, CW, rowH, 'F');
                }
                doc.setDrawColor(...C.silver);
                doc.line(ML, y + rowH, ML + CW, y + rowH);

                // Descripcion multilinea
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(5.8);
                doc.setTextColor(...C.dark);
                descLines.forEach((line, li) => {
                    doc.text(line, ML + 2.5, y + cellPadV + lineH * li + lineH - 1);
                });

                // P — colores RGB fijos segun valor (jsPDF no acepta HSL)
                const midY = y + rowH / 2 + 2;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                const probCol: RGB = r.probabilidad >= 4 ? [185, 28, 28] : r.probabilidad === 3 ? [180, 100, 6] : [22, 101, 52];
                doc.setTextColor(...probCol);
                doc.text(r.probabilidad.toString(), ML + dW + 10 / 2, midY, { align: 'center' });

                // I
                const impCol: RGB = r.impacto >= 4 ? [185, 28, 28] : r.impacto === 3 ? [133, 77, 6] : [22, 101, 52];
                doc.setTextColor(...impCol);
                doc.text(r.impacto.toString(), ML + dW + 10 + 10 / 2, midY, { align: 'center' });

                // Nivel badge
                doc.setFillColor(...nivelBg);
                doc.roundedRect(ML + dW + 20 + 1, y + rowH / 2 - 3, 26, 6, 1, 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5.5);
                doc.setTextColor(...nivelFg);
                doc.text(nivel, ML + dW + 20 + 14, midY, { align: 'center' });

                // Frec
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                if (r.frecuencia_actual > 0) doc.setTextColor(...C.blue);
                else doc.setTextColor(...C.gray);
                doc.text(
                    r.frecuencia_actual > 0 ? r.frecuencia_actual.toString() : '-',
                    ML + CW - 2,
                    midY,
                    { align: 'right' },
                );

                y += rowH;
            });
            y += 4;
        }

        // Mapa de calor
        checkY(75);
        sectionTitle('Mapa de Calor - Probabilidad x Impacto', C.red);

        const HEAT_COLORS_PDF = ['#bbf7d0', '#fde68a', '#fca5a5', '#f87171', '#dc2626'];
        const h2rgb = (hex: string): RGB => {
            const c = hex.replace('#', '');
            return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
        };

        const cs = 13, offX = 24;
        const hx = ML, hy = y;

        // Etiquetas eje Y
        ['C.seguro', 'Probable', 'Posible', 'Improbable', 'Raro'].forEach((l, pi) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(...C.gray);
            doc.text(l, hx + offX - 2, hy + pi * (cs + 2) + cs / 2 + 2, { align: 'right' });
        });

        // Celdas del mapa
        for (let pi = 0; pi < 5; pi++) {
            for (let ii = 0; ii < 5; ii++) {
                const p = 5 - pi, imp = ii + 1, score = p * imp;
                const ci = score >= 16 ? 4 : score >= 9 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0;
                const cx = hx + offX + ii * (cs + 2);
                const cy = hy + pi * (cs + 2);
                doc.setFillColor(...h2rgb(HEAT_COLORS_PDF[ci]));
                doc.roundedRect(cx, cy, cs, cs, 2, 2, 'F');
                const cnt = riesgos.filter(r => r.probabilidad === p && r.impacto === imp).length;
                if (cnt > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(30, 30, 30);
                    doc.text(cnt.toString(), cx + cs / 2, cy + cs / 2 + 3, { align: 'center' });
                }
            }
        }

        // Eje X
        for (let ii = 0; ii < 5; ii++) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...C.gray);
            doc.text((ii + 1).toString(), hx + offX + ii * (cs + 2) + cs / 2, hy + 5 * (cs + 2) + 5, { align: 'center' });
        }
        doc.text('IMPACTO ->', hx + offX, hy + 5 * (cs + 2) + 9);

        // Leyenda
        const legX = hx + offX + 5 * (cs + 2) + 10;
        [
            { c: '#bbf7d0', l: 'Bajo (1-3)' },
            { c: '#fde68a', l: 'Moderado (4-8)' },
            { c: '#fca5a5', l: 'Alto (9-15)' },
            { c: '#f87171', l: 'Muy alto (16+)' },
            { c: '#dc2626', l: 'Critico (25)' },
        ].forEach((li, idx) => {
            doc.setFillColor(...h2rgb(li.c));
            doc.roundedRect(legX, hy + idx * 11, 9, 6, 1, 1, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...C.gray);
            doc.text(li.l, legX + 12, hy + idx * 11 + 4.5);
        });

        y = hy + 5 * (cs + 2) + 14;

        // Barras de distribucion por categoria
        y += 4;
        checkY(10 + cats.length * 9);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.red);
        doc.text('Distribucion por Categoria:', ML, y);
        y += 7;

        cats.forEach(cat => {
            // Calcular altura de fila segun lineas de texto del nombre de categoria
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            const catMaxW = 52; // mm disponibles antes de la barra
            const catLines: string[] = doc.splitTextToSize(safe(cat), catMaxW);
            const catLineH = 4;
            const catPadV = 2;
            const catRowH = Math.max(catLines.length * catLineH + catPadV * 2, 8);

            checkY(catRowH);
            const catR2 = riesgos.filter(r => r.categoria === cat);
            const pct = riesgos.length > 0 ? catR2.length / riesgos.length : 0;
            const altos = catR2.filter(r => ['ALTO', 'CRITICO'].includes(getNivel(r.probabilidad, r.impacto))).length;

            doc.setFillColor(...C.light);
            doc.rect(ML, y, CW, catRowH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...C.dark);
            catLines.forEach((line, li) => {
                doc.text(line, ML + 2, y + catPadV + catLineH * li + catLineH - 1);
            });

            const midCatY = y + catRowH / 2;
            const bx = ML + 55, bw = CW - 55 - 22;
            doc.setFillColor(...C.silver);
            doc.roundedRect(bx, midCatY - 1.75, bw, 3.5, 1, 1, 'F');
            if (catR2.length > 0) {
                doc.setFillColor(...C.red);
                doc.roundedRect(bx, midCatY - 1.75, bw * pct, 3.5, 1, 1, 'F');
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...C.gray);
            doc.text(`${catR2.length}${altos > 0 ? ` (${altos} alto)` : ''}`, ML + CW - 2, midCatY + 1.5, { align: 'right' });
            y += catRowH;
        });

        // Top frecuencias — descripcion completa con splitTextToSize
        const topFrec = [...riesgos]
            .filter(r => r.frecuencia_actual > 0)
            .sort((a, b) => b.frecuencia_actual - a.frecuencia_actual)
            .slice(0, 8);

        if (topFrec.length > 0) {
            y += 4;
            checkY(14);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...C.red);
            const totalFrec = riesgos.reduce((s, r) => s + r.frecuencia_actual, 0);
            doc.text(`Frecuencias este mes (total: ${totalFrec} ocurrencias):`, ML, y);
            y += 8;

            // Cabecera tabla frecuencias
            const fDescW = CW - 22 - 20;
            checkY(7);
            doc.setFillColor(...C.red);
            doc.rect(ML, y, CW, 6.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...C.white);
            doc.text('Descripcion del riesgo', ML + 2.5, y + 4.5);
            doc.text('Nivel', ML + fDescW + 11, y + 4.5, { align: 'center' });
            doc.text('Frec.', ML + CW - 2, y + 4.5, { align: 'right' });
            y += 6.5;

            const maxF = topFrec[0].frecuencia_actual;
            topFrec.forEach((r, ri) => {
                const nivel = getNivel(r.probabilidad, r.impacto);
                const nivelColor: RGB = nivel === 'CRITICO' ? [190, 24, 93] : nivel === 'ALTO' ? [185, 28, 28] : nivel === 'MODERADO' ? [180, 100, 6] : [22, 163, 74];
                const nivelBg: RGB = nivel === 'CRITICO' ? [252, 231, 243] : nivel === 'ALTO' ? [254, 226, 226] : nivel === 'MODERADO' ? [254, 249, 195] : [220, 252, 231];
                const pctF = maxF > 0 ? r.frecuencia_actual / maxF : 0;

                // Calcular lineas necesarias
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(5.8);
                const descLines: string[] = doc.splitTextToSize(safe(r.descripcion), fDescW - 4);
                const lineHF = 4.3;
                const padV = 2.5;
                const rowH = Math.max(descLines.length * lineHF + padV * 2, 9);

                checkY(rowH);

                // Fondo fila — siempre el color del nivel del riesgo
                doc.setFillColor(...nivelBg);
                doc.rect(ML, y, CW, rowH, 'F');
                doc.setDrawColor(...C.silver);
                doc.line(ML, y + rowH, ML + CW, y + rowH);

                // Descripcion completa multilinea
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(5.8);
                doc.setTextColor(...C.dark);
                descLines.forEach((line, li) => {
                    doc.text(line, ML + 2.5, y + padV + lineHF * li + lineHF - 1);
                });

                const midRowY = y + rowH / 2 + 2;

                // Badge nivel
                doc.setFillColor(...nivelBg);
                doc.roundedRect(ML + fDescW + 1, y + rowH / 2 - 3, 20, 6, 1, 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5.5);
                doc.setTextColor(...nivelColor);
                doc.text(nivel, ML + fDescW + 11, midRowY, { align: 'center' });

                // Numero frecuencia
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...nivelColor);
                doc.text(r.frecuencia_actual.toString(), ML + CW - 2, midRowY, { align: 'right' });

                y += rowH;
            });
        }
    }

    /* =========================================================================
       FOOTERS en todas las paginas
    ========================================================================= */
    const secColors: RGB[] = [C.navy, C.blue, C.purple, C.green, C.amber, C.red];
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        if (i > 1) accentBar(secColors[Math.min(i - 1, secColors.length - 1)]);
        footer(i, totalPages, secColors[Math.min(i - 1, secColors.length - 1)]);
    }

    /* --- Guardar ----------------------------------------------------------- */
    const filename = [
        'EstadoFinanciero',
        empresa.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        estadoSel.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        new Date().toISOString().slice(0, 10),
    ].join('_') + '.pdf';

    doc.save(filename);
}