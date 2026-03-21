/**
 * exportarPDF.ts  —  Finaxis · Estado Financiero
 * Diseño profesional full-bleed. Portada sin cortes, secciones sin repetición.
 */

import { supabase } from '../lib/supabaseClient';

/* ─── Types ─────────────────────────────────────── */
interface Empresa { id: number; nombre: string; tipo_nombre: string; }
interface EstadoCuenta { id: number; nombre: string; idcatalogo: number; }
interface Anio { id: number; valor: string; }
interface ItemCat { id: number; nombre: string; codigo: string | null; contenedor: boolean; iditempadre: number | null; depth?: number; }
interface ItemEstado { iditemcat: number; idanio: number; valor: number; }
interface Riesgo { id: number; categoria: string; descripcion: string; probabilidad: number; impacto: number; frecuencia_actual: number; }
interface FToken { type: 'item' | 'operator' | 'number' | 'paren'; value: string; itemId?: number; }
interface Formula { id: number; nombre: string; descripcion: string | null; codigo: { tokens: FToken[] }; source: 'catalogo' | 'personal'; }

/* ─── Palette ────────────────────────────────────── */
type RGB = [number, number, number];
const C: Record<string, RGB> = {
    navy: [12, 35, 80],
    blue: [24, 95, 165],
    blueD: [16, 68, 120],
    blueL: [230, 241, 251],
    blueM: [66, 135, 200],
    purple: [109, 40, 217],
    green: [22, 163, 74],
    amber: [180, 100, 6],
    red: [185, 28, 28],
    dark: [15, 23, 42],
    gray: [100, 116, 139],
    light: [241, 245, 249],
    silver: [226, 232, 240],
    white: [255, 255, 255],
};

/* ─── Helpers ───────────────────────────────────── */
const fmtN = (v: number) =>
    !v ? '—' : new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const getNivel = (p: number, i: number): string => {
    const s = p * i;
    return s >= 16 ? 'CRÍTICO' : s >= 9 ? 'ALTO' : s >= 4 ? 'MODERADO' : 'BAJO';
};

function flatten(items: ItemCat[], parentId: number | null = null, depth = 0): ItemCat[] {
    const out: ItemCat[] = [];
    for (const item of items) {
        if (item.iditempadre === parentId) {
            out.push({ ...item, depth });
            out.push(...flatten(items, item.id, depth + 1));
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

function evalFormula(tokens: FToken[], fm: Record<number, number>): number | null {
    let expr = '';
    for (const t of tokens) {
        if (t.type === 'item') { if (t.itemId === undefined) return null; expr += fm[t.itemId] ?? 0; }
        else if (t.type === 'operator') {
            const op = t.value === '−' ? '-' : t.value === '×' ? '*' : t.value === '÷' ? '/' : t.value;
            expr += ` ${op} `;
        } else expr += t.value;
    }
    try {
        const r = new Function(`return (${expr})`)();
        return typeof r === 'number' && isFinite(r) ? Math.round(r * 10000) / 10000 : null;
    } catch { return null; }
}

// Obtener todos los ítems hoja de un grupo raíz (o el propio root si es hoja)
function getGroupLeafs(root: ItemCat, allItems: ItemCat[]): ItemCat[] {
    // Caso flat: el root mismo es hoja (no tiene hijos)
    const hasChildren = allItems.some(i => i.iditempadre === root.id);
    if (!hasChildren && !root.contenedor) return [root];

    const result: ItemCat[] = [];
    const collect = (pid: number) => {
        for (const it of allItems) {
            if (it.iditempadre === pid) {
                if (!it.contenedor) result.push(it);
                collect(it.id);
            }
        }
    };
    collect(root.id);
    return result;
}

function calcDenominator(item: ItemCat, anioId: number, allItems: ItemCat[], valMap: Record<number, Record<number, number>>): number {
    const iMap: Record<number, ItemCat> = {};
    for (const i of allItems) iMap[i.id] = i;
    const roots = allItems.filter(i => i.iditempadre === null);

    // Para catálogos flat: el denominador es la suma de todos los items del mismo bloque (1x, 2x, etc.)
    if (item.iditempadre === null) {
        const block = (item.codigo ?? '').charAt(0);
        const sibs = roots.filter(i => (i.codigo ?? '').startsWith(block));
        return sibs.reduce((s, i) => s + Math.abs(valMap[i.id]?.[anioId] ?? 0), 0);
    }

    // Para catálogos jerárquicos: subir hasta el padre raíz y sumar sus hijos directos
    const getRoot = (it: ItemCat): number | null => {
        if (it.iditempadre === null) return null;
        const p = iMap[it.iditempadre];
        if (!p) return null;
        if (p.iditempadre === null) return p.id;
        return getRoot(p);
    };
    const rootId = getRoot(item);
    const targetId = rootId ?? item.iditempadre!;
    const dc = allItems.filter(i => i.iditempadre === targetId);
    return dc.reduce((s, i) => s + Math.abs(valMap[i.id]?.[anioId] ?? 0), 0);
}

/* ══════════════════════════════════════════════════
   FUNCIÓN PRINCIPAL
══════════════════════════════════════════════════ */
export async function exportarPDF(
    empresa: Empresa,
    estadoSel: EstadoCuenta,
    _userId: string,
    onProgress?: (msg: string) => void
): Promise<void> {
    const prog = (m: string) => onProgress?.(m);

    prog('Cargando jsPDF…');
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm' as any);

    prog('Cargando datos…');
    const [
        [{ data: rawItems }, { data: rawAnios }, { data: rawVals }],
        [{ data: rData }, { data: fpData }, { data: fecData }]
    ] = await Promise.all([
        Promise.all([
            supabase.from('itemcat').select('id,nombre,codigo,contenedor,iditempadre').eq('idcatalogo', estadoSel.idcatalogo),
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
    const items = flatten(allItems);
    const anios: Anio[] = rawAnios ?? [];
    const valMap = buildValMap(rawVals ?? []);
    const leafs = items.filter(i => !i.contenedor);
    // roots = solo items de primer nivel que NO son contenedores de agrupación virtual (G1, G2…)
    // Los roots reales tienen códigos numéricos o de un dígito
    const roots = allItems.filter(i => i.iditempadre === null && !i.contenedor);
    const riesgos: Riesgo[] = rData ?? [];
    const formulas: Formula[] = [
        ...(fpData ?? []).map((f: any) => ({ ...f, source: 'personal' as const })),
        ...(fecData ?? []).map((f: any) => ({
            id: f.formula.id, nombre: f.formula.nombre,
            descripcion: f.formula.descripcion, codigo: f.formula.codigo,
            source: 'catalogo' as const,
        })),
    ];

    prog('Generando PDF…');

    /* ── Documento ── */
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
    let y = 0;

    const newPage = () => { doc.addPage(); y = 28; };
    const checkY = (n: number) => { if (y + n > PH - 14) newPage(); };

    /* ── Helpers de dibujo ── */
    const accentBar = (col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, 0, 6, PH, 'F');
    };

    const pageHeader = (num: string, title: string, sub: string, col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, 0, PW, 20, 'F');
        doc.setFillColor(Math.max(col[0] - 25, 0), Math.max(col[1] - 25, 0), Math.max(col[2] - 25, 0));
        doc.rect(PW - 55, 0, 55, 20, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C.white);
        doc.text(`SECCIÓN ${num}`, ML + 4, 7.5);
        doc.setFontSize(12);
        doc.text(title, ML + 4, 15.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(sub, PW - MR, 12, { align: 'right', maxWidth: 50 });
        y = 26;
    };

    const footerBar = (pageN: number, total: number, col: RGB) => {
        doc.setFillColor(...col);
        doc.rect(0, PH - 9, PW, 9, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.white);
        doc.text(`${empresa.nombre.toUpperCase()} · ESTADO FINANCIERO · FINAXIS`, ML + 4, PH - 3.5);
        doc.text(new Date().toLocaleDateString('es-ES'), PW / 2, PH - 3.5, { align: 'center' });
        doc.text(`${pageN} / ${total}`, PW - MR, PH - 3.5, { align: 'right' });
    };

    const subTitle = (title: string, col: RGB = C.blue as RGB) => {
        checkY(13);
        doc.setFillColor(...col);
        doc.rect(ML, y, 4, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...C.dark);
        doc.text(title, ML + 7, y + 5.8);
        y += 12;
    };

    const infoPill = (text: string, bg: RGB = C.blueL as RGB, fg: RGB = C.blue as RGB) => {
        checkY(10);
        doc.setFillColor(...bg);
        doc.roundedRect(ML, y, CW, 7.5, 2, 2, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...fg);
        doc.text(text, ML + 4, y + 5, { maxWidth: CW - 8 });
        y += 10;
    };

    const drawTable = (
        headers: string[],
        rows: string[][],
        colWidths: number[],
        opts: { hBg?: RGB; aRight?: number[]; compact?: boolean } = {}
    ) => {
        const { hBg = C.blue as RGB, aRight = [], compact = false } = opts;
        const rH = compact ? 5.6 : 6.3;
        checkY(rH + 3);

        // Header
        doc.setFillColor(...hBg);
        doc.rect(ML, y, CW, rH, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.3); doc.setTextColor(...C.white);
        let cx = ML;
        headers.forEach((h, i) => {
            if (aRight.includes(i)) doc.text(h, cx + colWidths[i] - 2, y + rH - 1.4, { align: 'right' });
            else doc.text(h, cx + 2.5, y + rH - 1.4);
            cx += colWidths[i];
        });
        y += rH;

        if (!rows.length) {
            doc.setFillColor(...C.light); doc.rect(ML, y, CW, rH, 'F');
            doc.setFont('helvetica', 'italic'); doc.setFontSize(6.3); doc.setTextColor(...C.gray);
            doc.text('Sin datos disponibles', PW / 2, y + rH - 1.8, { align: 'center' });
            y += rH + 3; return;
        }

        rows.forEach((row, ri) => {
            checkY(rH + 1);
            doc.setFillColor(ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 250 : 255, ri % 2 === 0 ? 252 : 255);
            doc.rect(ML, y, CW, rH, 'F');
            doc.setDrawColor(...C.silver);
            doc.line(ML, y + rH, ML + CW, y + rH);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.dark);
            cx = ML;
            row.forEach((cell, ci) => {
                const txt = String(cell ?? '—');
                if (aRight.includes(ci)) doc.text(txt, cx + colWidths[ci] - 2, y + rH - 1.8, { align: 'right' });
                else doc.text(txt.slice(0, 55), cx + 2.5, y + rH - 1.8, { maxWidth: colWidths[ci] - 4 });
                cx += colWidths[ci];
            });
            y += rH;
        });
        y += 4;
    };

    /* ══════════════════════════════════════════════
       PORTADA — zona azul completa sin cortes
       Estructura: banda azul continua hasta y=230,
       luego navy hasta el final.
    ══════════════════════════════════════════════ */

    // Fondo full-page navy
    doc.setFillColor(...C.navy);
    doc.rect(0, 0, PW, PH, 'F');

    // Banda azul (ocupa hasta y=230 para que KPIs y TOC queden dentro)
    doc.setFillColor(...C.blue);
    doc.rect(0, 0, PW, 230, 'F');

    // Panel derecho oscuro (decorativo)
    doc.setFillColor(...C.blueD);
    doc.rect(PW - 55, 0, 55, 230, 'F');

    // Franja blanca superior (full bleed)
    doc.setFillColor(...C.white);
    doc.rect(0, 0, PW, 3.5, 'F');

    // Logo
    doc.setFillColor(...C.white);
    doc.triangle(ML, 27, ML + 10, 13, ML + 20, 27, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...C.white);
    doc.text('FINAXIS', ML + 24, 24);

    // Títulos
    doc.setFontSize(30); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text('ESTADO', ML, 52);
    doc.text('FINANCIERO', ML, 65);

    // Línea separadora
    doc.setFillColor(255, 255, 255); doc.rect(ML, 70, CW - 55, 0.5, 'F');

    // Datos de empresa
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...C.white);
    doc.text(empresa.nombre, ML, 80);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(179, 210, 240);
    doc.text(`Tipo: ${empresa.tipo_nombre}`, ML, 88);
    doc.text(`Estado: ${estadoSel.nombre}`, ML, 95);
    doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        ML, 102
    );

    // KPI cards (y=112, altura=28 → terminan en y=140, bien dentro de la banda azul)
    const kpiDef = [
        { label: 'PERÍODOS', val: anios.length.toString(), sub: anios.map(a => a.valor).join(', ') },
        { label: 'CUENTAS', val: leafs.length.toString(), sub: 'en catálogo activas' },
        { label: 'RIESGOS', val: riesgos.length.toString(), sub: `${riesgos.filter(r => ['ALTO', 'CRÍTICO'].includes(getNivel(r.probabilidad, r.impacto))).length} alto/crítico` },
        { label: 'FÓRMULAS', val: formulas.length.toString(), sub: `${formulas.filter(f => f.source === 'personal').length} personales` },
    ];
    const kw = CW / 4, ky = 113;
    kpiDef.forEach((k, i) => {
        const kx = ML + i * kw;
        // fondo semitransparente (simulado con blueD)
        doc.setFillColor(...C.blueD);
        doc.roundedRect(kx, ky, kw - 3, 26, 3, 3, 'F');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(kx, ky, kw - 3, 26, 3, 3, 'S'); // borde blanco
        doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...C.white);
        doc.text(k.val, kx + (kw - 3) / 2, ky + 13, { align: 'center' });
        doc.setFontSize(6.3);
        doc.text(k.label, kx + (kw - 3) / 2, ky + 19, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8); doc.setTextColor(179, 210, 240);
        doc.text(k.sub, kx + (kw - 3) / 2, ky + 23.5, { align: 'center' });
    });

    // Divider
    doc.setFillColor(255, 255, 255); doc.rect(ML, 146, CW - 55, 0.4, 'F');

    // TOC (empieza y=152, 5 filas × 10 = 50px → termina en y=202, dentro del azul)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(179, 210, 240);
    doc.text('CONTENIDO DEL INFORME', ML, 152);
    const toc = [
        { n: '01', t: 'Catálogo de Cuentas', d: 'Estructura de cuentas con valores por período' },
        { n: '02', t: 'Análisis Vertical', d: 'Participación % de cada cuenta sobre su grupo' },
        { n: '03', t: 'Análisis Horizontal', d: 'Variación entre períodos ($ y %)' },
        { n: '04', t: 'Ratios Financieros', d: `${formulas.length} fórmula(s) calculadas automáticamente` },
        { n: '05', t: 'Riesgo Operacional', d: `${riesgos.length} riesgo(s) registrados este mes` },
    ];
    let ty = 158;
    toc.forEach(c => {
        doc.setFillColor(C.blueD[0], C.blueD[1], C.blueD[2]);
        doc.roundedRect(ML, ty, CW - 55, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.white);
        doc.text(c.n, ML + 3, ty + 5.5);
        doc.text(c.t, ML + 12, ty + 5.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(179, 210, 240);
        doc.text(c.d, ML + 62, ty + 5.5, { maxWidth: CW - 55 - 62 - 4 });
        ty += 10;
    });

    // Info pie de portada (zona navy)
    doc.setFillColor(...C.navy); doc.rect(0, 230, PW, PH - 230, 'F');
    doc.setFillColor(...C.blue); doc.rect(0, 230, 6, PH - 230, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.gray);
    doc.text('Generado automáticamente por Finaxis — Sistema de Análisis Financiero', ML + 8, 240);
    doc.text(`Empresa: ${empresa.nombre}  ·  Período: ${anios.map(a => a.valor).join(' – ')}`, ML + 8, 247);

    /* ══════════════════════════════════════════════
       S1 — CATÁLOGO DE CUENTAS
       (una sola tabla limpia, sin sección duplicada)
    ══════════════════════════════════════════════ */
    newPage();
    accentBar(C.blue as RGB);
    pageHeader('1', 'CATÁLOGO DE CUENTAS', estadoSel.nombre, C.blue as RGB);
    infoPill(
        `${estadoSel.nombre}  ·  ${leafs.length} cuentas  ·  Períodos: ${anios.map(a => a.valor).join(', ')}`,
        C.blueL as RGB, C.blue as RGB
    );

    {
        const lW = anios.length <= 2 ? 100 : 80;
        const cW = (CW - lW) / Math.max(anios.length, 1);
        const hh = ['Cuenta', ...anios.map(a => a.valor)];
        const ww = [lW, ...anios.map(() => cW)];

        // Filtrar solo roots con datos y renderizar UNA tabla
        const rows = roots
            .filter(root => anios.some(a => (valMap[root.id]?.[a.id] ?? 0) !== 0))
            .map(root => [
                `${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`,
                ...anios.map(a => fmtN(valMap[root.id]?.[a.id] ?? 0)),
            ]);

        // Si hay ítems con hijos (catálogo jerárquico), agregar también los hijos
        const hasHierarchy = allItems.some(i => i.iditempadre !== null && !i.contenedor);
        if (hasHierarchy) {
            // Mostrar todos los leafs ordenados por jerarquía
            const allRows = leafs
                .filter(item => anios.some(a => (valMap[item.id]?.[a.id] ?? 0) !== 0))
                .map(item => [
                    `${'  '.repeat(Math.min(item.depth ?? 0, 4))}${item.codigo ? `[${item.codigo}] ` : ''}${item.nombre}`,
                    ...anios.map(a => fmtN(valMap[item.id]?.[a.id] ?? 0)),
                ]);
            drawTable(hh, allRows, ww, { hBg: C.blue as RGB, aRight: anios.map((_, i) => i + 1) });
        } else {
            drawTable(hh, rows, ww, { hBg: C.blue as RGB, aRight: anios.map((_, i) => i + 1) });
        }
    }

    /* ══════════════════════════════════════════════
       S2 — ANÁLISIS VERTICAL
       Una sola tabla: cuenta + valor + % por año.
       Sin "Totales por Grupo" y "Detalle" por separado.
    ══════════════════════════════════════════════ */
    newPage();
    accentBar(C.purple as RGB);
    pageHeader('2', 'ANÁLISIS VERTICAL', 'Participación % por grupo', C.purple as RGB);
    infoPill(
        'Cada cuenta expresada como % sobre el TOTAL de su bloque (Activos, Pasivos, Patrimonio, Gastos, Ingresos…)',
        [237, 233, 254], C.purple as RGB
    );

    // Tabla resumen de totales por bloque primero
    subTitle('Totales por Bloque', C.purple as RGB);
    {
        const lW = 90, cW = (CW - lW - 22) / Math.max(anios.length, 1);
        const hh = ['Grupo', ...anios.map(a => a.valor), 'Var. %'];
        const ww = [lW, ...anios.map(() => cW), 22];
        const rows = roots
            .filter(root => anios.some(a => (valMap[root.id]?.[a.id] ?? 0) !== 0))
            .map(root => {
                const tots = anios.map(a => valMap[root.id]?.[a.id] ?? 0);
                const vp = tots.length >= 2 && tots[0] !== 0 ? `${((tots[tots.length - 1] - tots[0]) / Math.abs(tots[0]) * 100).toFixed(1)}%` : '—';
                return [`${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`, ...tots.map(fmtN), vp];
            });
        drawTable(hh, rows, ww, { hBg: C.purple as RGB, aRight: anios.map((_, i) => i + 1) });
    }

    // Tabla detalle con % calculado
    subTitle('Participación por Cuenta', C.purple as RGB);
    {
        // Para catálogo flat: calcular denominador como suma del mismo bloque (1x, 2x, 3x…)
        const blockTotals: Record<string, Record<number, number>> = {};
        for (const root of roots) {
            const block = (root.codigo ?? '').charAt(0);
            if (!blockTotals[block]) {
                blockTotals[block] = {};
                for (const a of anios) {
                    const sibs = roots.filter(r => (r.codigo ?? '').startsWith(block));
                    blockTotals[block][a.id] = sibs.reduce((s, r) => s + Math.abs(valMap[r.id]?.[a.id] ?? 0), 0);
                }
            }
        }

        const lW = anios.length <= 2 ? 72 : 60;
        const cW = (CW - lW) / (anios.length * 2);
        const hh = ['Cuenta', ...anios.flatMap(a => [a.valor, '% Part.'])];
        const ww = [lW, ...anios.flatMap(() => [cW * 1.5, cW * 0.5])];

        const rows = roots
            .filter(root => anios.some(a => (valMap[root.id]?.[a.id] ?? 0) !== 0))
            .map(root => {
                const block = (root.codigo ?? '').charAt(0);
                return [
                    `${root.codigo ? `[${root.codigo}] ` : ''}${root.nombre}`,
                    ...anios.flatMap(a => {
                        const val = valMap[root.id]?.[a.id] ?? 0;
                        const tot = blockTotals[block]?.[a.id] ?? 0;
                        const pct = tot > 0 ? (Math.abs(val) / tot * 100).toFixed(1) + '%' : '—';
                        return [fmtN(val), pct];
                    }),
                ];
            });
        drawTable(hh, rows, ww, { hBg: [130, 80, 210] as RGB, aRight: anios.flatMap((_, i) => [i * 2 + 1, i * 2 + 2]) });
    }

    /* ══════════════════════════════════════════════
       S3 — ANÁLISIS HORIZONTAL
       Resumen corregido para catálogo flat
    ══════════════════════════════════════════════ */
    newPage();
    accentBar(C.green as RGB);
    pageHeader('3', 'ANÁLISIS HORIZONTAL', anios.map(a => a.valor).join(' → '), C.green as RGB);
    infoPill(
        `Variación absoluta ($) y relativa (%) entre períodos: ${anios.map(a => a.valor).join(' → ')}`,
        [240, 253, 244], C.green as RGB
    );

    if (anios.length < 2) {
        infoPill('Se necesitan al menos 2 períodos para el análisis horizontal.', [254, 249, 195], [133, 77, 14]);
    } else {
        for (let pi = 0; pi < anios.length - 1; pi++) {
            const aB = anios[pi], aC = anios[pi + 1];
            subTitle(`${aB.valor}  →  ${aC.valor}`, C.green as RGB);

            // Resumen por bloque — usando roots directamente (funciona para flat y jerárquico)
            const hSum = ['Grupo / Cuenta', aB.valor, aC.valor, 'Var. $', 'Var. %'];
            const cS = (CW - 65) / 4;
            const wSum = [65, cS, cS, cS, cS];

            const sumRows = roots
                .map(root => {
                    // Para flat: el root ES la hoja, su valor está directo en valMap
                    const desc = getGroupLeafs(root, allItems);
                    const vA = desc.reduce((s, i) => s + Math.abs(valMap[i.id]?.[aB.id] ?? 0), 0);
                    const vC = desc.reduce((s, i) => s + Math.abs(valMap[i.id]?.[aC.id] ?? 0), 0);
                    const diff = vC - vA;
                    const pct = vA > 0 ? (diff / vA * 100).toFixed(2) + '%' : '—';
                    return { root, vA, vC, diff, pct };
                })
                .filter(r => r.vA !== 0 || r.vC !== 0)
                .map(r => [
                    `${r.root.codigo ? `[${r.root.codigo}] ` : ''}${r.root.nombre}`,
                    fmtN(r.vA), fmtN(r.vC), fmtN(r.diff), r.pct,
                ]);

            drawTable(hSum, sumRows, wSum, { hBg: C.green as RGB, aRight: [1, 2, 3, 4] });
        }
    }

    /* ══════════════════════════════════════════════
       S4 — RATIOS FINANCIEROS
    ══════════════════════════════════════════════ */
    newPage();
    accentBar(C.amber as RGB);
    pageHeader('4', 'RATIOS FINANCIEROS', `${formulas.length} fórmula(s)`, C.amber as RGB);

    if (!formulas.length) {
        infoPill('No hay fórmulas. Créalas en "Mis análisis" → panel de Fórmulas.', [254, 249, 195], [133, 77, 14]);
    } else {
        infoPill(`Calculadas para: ${anios.map(a => a.valor).join(', ')}`, [255, 251, 235], [133, 77, 14]);
        subTitle('Resultados', C.amber as RGB);

        const lW = 60, srcW = 22, resW = 24;
        const hR = ['Fórmula', 'Fuente', ...anios.map(a => a.valor)];
        const wR = [lW, srcW, ...anios.map(() => resW)];
        const fRows = formulas.map(f => {
            const ress = anios.map(a => {
                const fm: Record<number, number> = {};
                for (const item of leafs) fm[item.id] = valMap[item.id]?.[a.id] ?? 0;
                const r = evalFormula(f.codigo.tokens, fm);
                return r === null ? 'Error' : r === 0 ? '—' : r.toFixed(2);
            });
            return [f.nombre, f.source === 'personal' ? 'Personal' : 'Catálogo', ...ress];
        });
        drawTable(hR, fRows, wR, { hBg: C.amber as RGB, aRight: anios.map((_, i) => i + 2) });

        y += 2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(133, 77, 14);
        doc.text('Expresiones:', ML, y); y += 7;
        formulas.forEach(f => {
            checkY(16);
            doc.setFillColor(255, 249, 195);
            doc.roundedRect(ML, y, CW, 13, 2, 2, 'F');
            doc.setFillColor(...C.amber);
            doc.rect(ML, y, 4, 13, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(133, 77, 14);
            doc.text(f.nombre, ML + 6, y + 5.5);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.gray);
            const expr = f.codigo.tokens.map(t => t.value).join(' ');
            doc.text(`= ${expr}`, ML + 6, y + 10.5, { maxWidth: CW - 10 });
            y += 15;
        });
    }

    /* ══════════════════════════════════════════════
       S5 — RIESGO OPERACIONAL
    ══════════════════════════════════════════════ */
    newPage();
    accentBar(C.red as RGB);
    pageHeader('5', 'RIESGO OPERACIONAL',
        new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), C.red as RGB);

    // KPIs de riesgo
    const rKpis = [
        { l: 'Críticos', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'CRÍTICO').length, col: [150, 10, 10] as RGB },
        { l: 'Altos', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'ALTO').length, col: C.red as RGB },
        { l: 'Moderados', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'MODERADO').length, col: C.amber as RGB },
        { l: 'Bajos', c: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'BAJO').length, col: C.green as RGB },
    ];
    const rkw = CW / 4;
    rKpis.forEach((k, i) => {
        const kx = ML + i * rkw;
        doc.setFillColor(...C.light); doc.roundedRect(kx, y, rkw - 3, 22, 3, 3, 'F');
        doc.setFillColor(...k.col); doc.rect(kx, y, 4, 22, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...k.col);
        doc.text(k.c.toString(), kx + 4 + (rkw - 7) / 2, y + 13, { align: 'center' });
        doc.setFontSize(6.3); doc.setTextColor(...C.gray);
        doc.text(k.l.toUpperCase(), kx + 4 + (rkw - 7) / 2, y + 19, { align: 'center' });
    });
    y += 27;

    if (!riesgos.length) {
        infoPill('No hay riesgos registrados este mes.', [254, 226, 226], C.red as RGB);
    } else {
        const cats = [...new Set(riesgos.map(r => r.categoria))];
        for (const cat of cats) {
            const catR = riesgos.filter(r => r.categoria === cat);
            subTitle(`Categoría: ${cat}`, C.red as RGB);
            const descW = CW - 12 - 12 - 14 - 24 - 18;
            const hRisk = ['Descripción', 'P', 'I', 'Score', 'Nivel', 'Frec./Mes'];
            const wRisk = [descW, 12, 12, 14, 24, 18];
            const rRows = catR.map(r => [
                r.descripcion,
                r.probabilidad.toString(), r.impacto.toString(),
                (r.probabilidad * r.impacto).toString(),
                getNivel(r.probabilidad, r.impacto),
                r.frecuencia_actual.toString(),
            ]);
            drawTable(hRisk, rRows, wRisk, { hBg: C.red as RGB, aRight: [1, 2, 3, 5] });
        }

        // Mapa de calor
        checkY(62);
        subTitle('Mapa de Calor — Probabilidad × Impacto', C.red as RGB);
        const HEAT = ['#bbf7d0', '#fde68a', '#fca5a5', '#f87171', '#dc2626'];
        const h2rgb = (hex: string): RGB => {
            const c = hex.replace('#', '');
            return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
        };
        const cs = 12, offX = 28;
        const heatLabels = ['C.seguro', 'Probable', 'Posible', 'Improbable', 'Raro'];
        const hx = ML, hy = y;

        heatLabels.forEach((l, pi) => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray);
            doc.text(l, hx, hy + pi * (cs + 2) + 8.5);
        });
        for (let pi = 0; pi < 5; pi++) {
            for (let ii = 0; ii < 5; ii++) {
                const p = 5 - pi, imp = ii + 1, score = p * imp;
                const ci = score >= 16 ? 4 : score >= 9 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0;
                const cx = hx + offX + ii * (cs + 2), cy = hy + pi * (cs + 2);
                doc.setFillColor(...h2rgb(HEAT[ci])); doc.roundedRect(cx, cy, cs, cs, 2, 2, 'F');
                const cnt = riesgos.filter(r => r.probabilidad === p && r.impacto === imp).length;
                if (cnt > 0) {
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(40, 40, 40);
                    doc.text(cnt.toString(), cx + cs / 2, cy + cs / 2 + 3, { align: 'center' });
                }
            }
        }
        // Eje X
        for (let ii = 0; ii < 5; ii++) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray);
            doc.text((ii + 1).toString(), hx + offX + ii * (cs + 2) + cs / 2, hy + 5 * (cs + 2) + 5, { align: 'center' });
        }
        doc.text('IMPACTO →', hx + offX, hy + 5 * (cs + 2) + 9);

        // Leyenda al lado del mapa
        const legX = hx + offX + 5 * (cs + 2) + 8;
        const legItems = [{ c: '#bbf7d0', l: 'Bajo' }, { c: '#fde68a', l: 'Moderado' }, { c: '#fca5a5', l: 'Alto' }, { c: '#f87171', l: 'Muy alto' }, { c: '#dc2626', l: 'Crítico' }];
        legItems.forEach((li, idx) => {
            doc.setFillColor(...h2rgb(li.c)); doc.roundedRect(legX, hy + idx * 10, 9, 5.5, 1, 1, 'F');
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray);
            doc.text(li.l, legX + 11, hy + idx * 10 + 4.3);
        });
        y = hy + 5 * (cs + 2) + 14;

        // Barras por categoría
        y += 4;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.red);
        doc.text('Distribución por Categoría:', ML, y); y += 7;
        cats.forEach(cat => {
            checkY(9);
            const catR2 = riesgos.filter(r => r.categoria === cat);
            const pct = Math.round(catR2.length / riesgos.length * 100);
            doc.setFillColor(...C.light); doc.rect(ML, y, CW, 7, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C.red);
            doc.text(cat, ML + 2, y + 5);
            const bx = ML + 40, bw = CW - 40 - 16;
            doc.setFillColor(...C.silver); doc.roundedRect(bx, y + 2, bw, 3.5, 1, 1, 'F');
            if (catR2.length > 0) { doc.setFillColor(...C.red); doc.roundedRect(bx, y + 2, bw * pct / 100, 3.5, 1, 1, 'F'); }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C.gray);
            doc.text(`${catR2.length}`, ML + CW - 2, y + 5, { align: 'right' });
            y += 8;
        });
    }

    /* ── Footers en todas las páginas ── */
    const secColors: RGB[] = [C.navy as RGB, C.blue as RGB, C.purple as RGB, C.green as RGB, C.amber as RGB, C.red as RGB];
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        if (i > 1) accentBar(secColors[Math.min(i - 1, secColors.length - 1)]);
        footerBar(i, total, secColors[Math.min(i - 1, secColors.length - 1)]);
    }

    const fn = `EstadoFinanciero_${empresa.nombre.replace(/\s+/g, '_')}_${estadoSel.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fn);
}