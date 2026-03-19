/**
 * extractFullFromPDF.ts
 *
 * Extrae ESTRUCTURA (ítems del catálogo) + VALORES en una sola pasada de IA.
 * Usado cuando el usuario sube un PDF sin catálogo seleccionado.
 * La extracción de texto usa exactamente el mismo patrón de extractCatalogFromPDF.ts
 * que ya funciona (incluyendo fallback OCR con Tesseract).
 */

// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */

/** Ítem que se insertará en la tabla itemcat */
export interface NewCatalogItem {
  tempId: string;              // ID temporal para vincular padre/hijo
  nombre: string;
  codigo: string | null;
  contenedor: boolean;
  parentTempId: string | null;
}

/** Valor extraído para un ítem y un año */
export interface NewItemValue {
  itemTempId: string;
  year: string;
  valor: number;
}

export interface FullPDFExtractionResult {
  catalogName: string;
  items: NewCatalogItem[];
  years: string[];
  values: NewItemValue[];
  usedOCR: boolean;
  rawText: string;
}

/* ─────────────────────────────────────────
   TEXTO NATIVO — idéntico al original que funciona
───────────────────────────────────────── */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const yMap = new Map<number, { x: number; text: string }[]>();
    for (const item of content.items as any[]) {
      const text = item.str?.trim();
      if (!text) continue;
      const y = Math.round(item.transform[5] / 4) * 4;
      const x = Math.round(item.transform[4]);
      if (!yMap.has(y)) yMap.set(y, []);
      yMap.get(y)!.push({ x, text });
    }

    const sortedRows = Array.from(yMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items.sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim()
      )
      .filter(line => line.length > 0);

    lines.push(...sortedRows);
  }

  return lines.join('\n');
}

/* ─────────────────────────────────────────
   OCR — idéntico al original que funciona
   usa { canvas, viewport } (NO canvasContext)
───────────────────────────────────────── */
async function extractTextWithOCR(
  file: File,
  onProgress?: (step: string, pct: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allText: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(
      `OCR página ${pageNum} de ${pdf.numPages}…`,
      10 + Math.round(((pageNum - 1) / pdf.numPages) * 25)
    );
    console.log(`[FullOCR] Página ${pageNum}/${pdf.numPages}`);

    const page = await pdf.getPage(pageNum);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, viewport }).promise;

    const { data } = await Tesseract.recognize(canvas, 'spa', {
      // @ts-ignore
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const pct = 10 + Math.round(((pageNum - 1 + m.progress) / pdf.numPages) * 25);
          onProgress?.(`OCR página ${pageNum}… ${Math.round(m.progress * 100)}%`, pct);
        }
      },
    });

    allText.push(data.text);
    canvas.remove();
  }

  return allText.join('\n');
}

/* ─────────────────────────────────────────
   DETECTAR AÑOS
───────────────────────────────────────── */
function detectYears(text: string): string[] {
  const re = /\b(20[012]\d)\b/g;
  const found = new Set<string>();
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  const years = Array.from(found).sort();
  if (years.length === 0) years.push(String(new Date().getFullYear()));
  return years;
}

/* ─────────────────────────────────────────
   PARSEAR NÚMERO
───────────────────────────────────────── */
function parseNumber(str: string): number | null {
  if (!str) return null;
  const isNeg = str.includes('(') || str.startsWith('-');
  const clean = str.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  if (!clean) return null;
  const n = parseFloat(clean);
  if (isNaN(n)) return null;
  return isNeg ? -n : n;
}

/* ─────────────────────────────────────────
   IA — estructura + valores en una sola llamada
───────────────────────────────────────── */
async function parseStructureAndValuesWithGroq(
  rawText: string,
  years: string[]
): Promise<{
  items: Array<{ code: string | null; nombre: string; contenedor: boolean; parentCode: string | null }>;
  values: Array<{ itemCode: string; year: string; valor: number }>;
}> {
  const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY no configurada');

  const yearsStr = years.join(', ');

  const systemPrompt = `Eres un extractor de estados financieros ecuatorianos.
Responde SOLO con un objeto JSON válido. Sin markdown, sin explicaciones, sin texto extra.

TAREA: Dado un estado financiero, extrae:
1. La ESTRUCTURA jerárquica de cuentas
2. Los VALORES numéricos por cuenta y año

AÑOS A EXTRAER: ${yearsStr}

══ REGLAS ESTRUCTURA (array "items") ══
Cada ítem: { "code": string|null, "nombre": string, "contenedor": bool, "parentCode": string|null }
- "nombre": texto en MAYÚSCULAS exactamente como aparece
- "contenedor": true si es un grupo, subtotal, margen, o totalizador (sin valor propio)
- "contenedor": false si es una cuenta con valor numérico
- "code": código numérico si existe, o código sintético para grupos (G1, G2, M1, M2...)
- "parentCode": code del ítem padre inmediato, o null si es raíz
- Mantén la jerarquía: si el documento muestra sangría o niveles, refléjalos con parentCode

══ REGLAS VALORES (array "values") ══
Solo para ítems con contenedor:false
Cada valor: { "itemCode": string, "year": string, "valor": number }
- Extrae para TODOS los años detectados
- Valores negativos si aparecen entre paréntesis o con signo negativo
- Si no hay valor, usa 0 (no incluir en la respuesta)
- Formatos: 1.234.567,89 | 1234567.89 | (1234) | -1234 | — o - = cero

══ EXCLUIR ══
- Encabezados de tabla (CÓDIGO, DESCRIPCIÓN, fechas como columnas)
- Totales finales (GANANCIA O PÉRDIDA DEL EJERCICIO, UTILIDAD NETA, etc.)
- Pie de página, firmas, fechas, nombres de funcionarios

FORMATO EXACTO DE RESPUESTA:
{
  "items": [
    { "code": "G1", "nombre": "NOMBRE GRUPO", "contenedor": true, "parentCode": null },
    { "code": "51", "nombre": "NOMBRE CUENTA", "contenedor": false, "parentCode": "G1" }
  ],
  "values": [
    { "itemCode": "51", "year": "${years[0]}", "valor": 12345.67 }
  ]
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 6000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extrae la estructura completa y todos los valores para los años: ${yearsStr}\n\nTEXTO DEL PDF:\n${rawText.substring(0, 8000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed: any = { items: [], values: [] };
  try {
    parsed = JSON.parse(clean);
  } catch {
    console.error('[FullExtract] Error parseando IA:', clean.substring(0, 500));
  }

  const items = (Array.isArray(parsed.items) ? parsed.items : []).map((i: any) => ({
    code: i.code ? String(i.code) : null,
    nombre: String(i.nombre ?? '').toUpperCase().trim(),
    contenedor: Boolean(i.contenedor),
    parentCode: i.parentCode ? String(i.parentCode) : null,
  }));

  const values = (Array.isArray(parsed.values) ? parsed.values : [])
    .map((v: any) => {
      const num = typeof v.valor === 'number' ? v.valor : parseNumber(String(v.valor ?? ''));
      return { itemCode: String(v.itemCode ?? ''), year: String(v.year ?? years[0]), valor: num ?? 0 };
    })
    .filter((v: any) => v.valor !== 0);

  return { items, values };
}

/* ─────────────────────────────────────────
   SUGERIR NOMBRE DEL CATÁLOGO
───────────────────────────────────────── */
function suggestCatalogName(rawText: string, fileName: string): string {
  const upper = rawText.substring(0, 1500).toUpperCase();
  if (upper.includes('PÉRDIDAS Y GANANCIAS') || upper.includes('PERDIDAS Y GANANCIAS')) return 'Estado de Pérdidas y Ganancias';
  if (upper.includes('BALANCE GENERAL')) return 'Balance General';
  if (upper.includes('SITUACIÓN FINANCIERA')) return 'Estado de Situación Financiera';
  if (upper.includes('FLUJO DE EFECTIVO') || upper.includes('FLUJO DE CAJA')) return 'Estado de Flujo de Efectivo';
  if (upper.includes('CAMBIOS EN EL PATRIMONIO')) return 'Estado de Cambios en el Patrimonio';
  if (upper.includes('RESULTADOS')) return 'Estado de Resultados';
  return fileName.replace(/\.pdf$/i, '').replace(/[_\-]+/g, ' ').trim() || 'Catálogo desde PDF';
}

/* ─────────────────────────────────────────
   EXPORT PRINCIPAL
───────────────────────────────────────── */
export async function extractFullFromPDF(
  file: File,
  onProgress?: (step: string, pct: number) => void
): Promise<FullPDFExtractionResult> {
  let usedOCR = false;

  // Paso 1: texto nativo
  onProgress?.('Leyendo PDF…', 5);
  let rawText = await extractTextFromPDF(file);
  console.log('[FullExtract] Texto nativo, longitud:', rawText.trim().length);

  // Paso 2: OCR si es escaneado
  if (!rawText || rawText.trim().length < 50) {
    usedOCR = true;
    console.log('[FullExtract] Activando OCR…');
    onProgress?.('PDF escaneado, iniciando OCR…', 8);
    rawText = await extractTextWithOCR(file, onProgress);
    console.log('[FullExtract] OCR, longitud:', rawText.trim().length);
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('No se pudo extraer texto del PDF' + (usedOCR ? ' ni con OCR' : '') + '.');
  }

  // Paso 3: años
  onProgress?.('Detectando años…', usedOCR ? 38 : 22);
  const years = detectYears(rawText);
  console.log('[FullExtract] Años:', years);

  // Paso 4: estructura + valores con IA
  onProgress?.('Extrayendo estructura y valores con IA…', usedOCR ? 45 : 32);
  const { items: rawItems, values: rawValues } = await parseStructureAndValuesWithGroq(rawText, years);
  console.log('[FullExtract] Items:', rawItems.length, '| Valores:', rawValues.length);

  // Paso 5: asignar tempIds y resolver parentTempId
  onProgress?.('Organizando…', 88);

  const codeToTempId = new Map<string, string>();
  const items: NewCatalogItem[] = rawItems.map((item, idx) => {
    const tempId = `item_${idx}`;
    if (item.code) codeToTempId.set(item.code, tempId);
    return {
      tempId,
      nombre: item.nombre,
      codigo: item.code,
      contenedor: item.contenedor,
      parentTempId: item.parentCode ?? null, // se resolverá abajo
    };
  });

  // Resolver parentTempId de string code → tempId
  for (const item of items) {
    if (item.parentTempId !== null) {
      const resolved = codeToTempId.get(item.parentTempId);
      item.parentTempId = resolved ?? null;
    }
  }

  // Mapear values
  const values: NewItemValue[] = rawValues
    .map(v => {
      const tempId = codeToTempId.get(v.itemCode);
      if (!tempId) return null;
      return { itemTempId: tempId, year: v.year, valor: v.valor };
    })
    .filter((v): v is NewItemValue => v !== null);

  const catalogName = suggestCatalogName(rawText, file.name);
  onProgress?.('Listo', 100);

  return { catalogName, items, years, values, usedOCR, rawText };
}