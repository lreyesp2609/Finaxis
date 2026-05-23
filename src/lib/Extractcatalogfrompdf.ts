import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import { supabase } from './supabaseClient';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/legacy/build/pdf.worker.min.mjs`;

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export interface CatalogItem {
  id: number;
  nombre: string;
  codigo: string | null;
  contenedor: boolean;
  iditempadre: number | null;
}

export interface ExtractedValue {
  itemcatId: number;
  itemNombre: string;
  itemCodigo: string | null;
  values: Record<string, number>; // year -> value
}

export interface PDFExtractionResult {
  years: string[];
  values: ExtractedValue[];
  matchRate: number;
  rawText: string;
  usedOCR: boolean;
}

/* ─────────────────────────────────────────
   EXTRACT TEXT — NATIVO (pdfjs)
   Copia exacta del extractTextFromPDF original
   que ya funciona en extractCatalogFromPDF.ts
───────────────────────────────────────── */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
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
        items
          .sort((a, b) => a.x - b.x)
          .map(i => i.text)
          .join(' ')
          .trim()
      )
      .filter(line => line.length > 0);

    lines.push(...sortedRows);
  }

  return lines.join('\n');
}

/* ─────────────────────────────────────────
   EXTRACT TEXT — OCR (Tesseract)
   Copia exacta del extractTextWithOCR original
   que ya funciona: usa { canvas, viewport }
───────────────────────────────────────── */
async function extractTextWithOCR(
  file: File,
  onProgress?: (step: string, pct: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allText: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(
      `OCR página ${pageNum} de ${pdf.numPages}…`,
      10 + Math.round(((pageNum - 1) / pdf.numPages) * 30)
    );

    console.log(`[OCR] Procesando página ${pageNum}/${pdf.numPages}...`);

    const page = await pdf.getPage(pageNum);

    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // ✅ Igual que el original que funciona: { canvas, viewport }
    await page.render({ canvas, viewport }).promise;

    const { data } = await Tesseract.recognize(canvas, 'spa', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const pct = 10 + Math.round(((pageNum - 1 + m.progress) / pdf.numPages) * 30);
          onProgress?.(`OCR página ${pageNum}… ${Math.round(m.progress * 100)}%`, pct);
          console.log(`[OCR] Página ${pageNum}: ${Math.round(m.progress * 100)}%`);
        }
      },
    } as any);

    allText.push(data.text);
    canvas.remove();
  }

  return allText.join('\n');
}

/* ─────────────────────────────────────────
   DETECT YEARS
───────────────────────────────────────── */
function detectYears(text: string): string[] {
  const yearRegex = /\b(20[012]\d)\b/g;
  const found = new Set<string>();
  let match;
  while ((match = yearRegex.exec(text)) !== null) {
    found.add(match[1]);
  }
  const years = Array.from(found).sort();
  if (years.length === 0) {
    years.push(String(new Date().getFullYear()));
  }
  return years;
}

/* ─────────────────────────────────────────
   PARSE NUMBER
───────────────────────────────────────── */
function parseNumber(str: string): number | null {
  if (!str) return null;
  const isNegative = str.includes('(') || str.startsWith('-');
  const clean = str.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  if (!clean) return null;
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

/* ─────────────────────────────────────────
   MATCH WITH AI (Groq)
───────────────────────────────────────── */
async function matchWithAI(
  rawText: string,
  catalogItems: CatalogItem[],
  years: string[]
): Promise<ExtractedValue[]> {
  const prompt = `Extrae los valores correspondientes para los años: ${years.join(', ')} basados en la siguiente lista de ítems de catálogo:\n${JSON.stringify(catalogItems, null, 2)}\n\nTexto del PDF:\n${rawText.substring(0, 8000)}`;

  const { data, error } = await supabase.functions.invoke('groq-proxy', {
    body: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'Eres un extractor preciso de datos financieros. Responde SOLO con JSON válido, sin markdown.',
        },
        { role: 'user', content: prompt },
      ],
    }
  });

  if (error) {
    throw new Error(`Groq Proxy error: ${error.message || JSON.stringify(error)}`);
  }
  if (data?.error) {
    throw new Error(`Groq API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data?.choices?.[0]?.message?.content ?? '[]';
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed: any[] = [];
  try {
    parsed = JSON.parse(clean);
  } catch {
    console.error('[PDF] Error parseando respuesta IA:', clean.substring(0, 500));
    return [];
  }

  const itemMap = new Map(catalogItems.map(i => [i.id, i]));
  const result: ExtractedValue[] = [];

  for (const row of parsed) {
    const item = itemMap.get(row.itemcatId);
    if (!item) continue;

    const values: Record<string, number> = {};
    for (const [yr, val] of Object.entries(row.values ?? {})) {
      const num = typeof val === 'number' ? val : parseNumber(String(val));
      values[yr] = num ?? 0;
    }

    result.push({
      itemcatId: item.id,
      itemNombre: item.nombre,
      itemCodigo: item.codigo,
      values,
    });
  }

  return result;
}

/* ─────────────────────────────────────────
   FALLBACK: MATCH BY TEXT SIMILARITY
───────────────────────────────────────── */
function normalize(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function matchByText(
  rawText: string,
  catalogItems: CatalogItem[],
  years: string[]
): ExtractedValue[] {
  const lines = rawText.split('\n');
  const leafItems = catalogItems.filter(i => !i.contenedor);
  const result: ExtractedValue[] = [];

  for (const item of leafItems) {
    let bestLine: string | null = null;
    let bestScore = 0;

    for (const line of lines) {
      if (item.codigo && line.includes(item.codigo)) {
        bestLine = line;
        bestScore = 1;
        break;
      }
      const score = similarity(item.nombre, line);
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestLine = line;
      }
    }

    const values: Record<string, number> = {};
    for (const yr of years) values[yr] = 0;

    if (bestLine) {
      const numbers = bestLine
        .match(/[\d.,]+/g)
        ?.map(n => parseNumber(n))
        .filter((n): n is number => n !== null);
      if (numbers && numbers.length > 0) {
        years.forEach((yr, idx) => { values[yr] = numbers[idx] ?? numbers[0] ?? 0; });
      }
    }

    result.push({
      itemcatId: item.id,
      itemNombre: item.nombre,
      itemCodigo: item.codigo,
      values,
    });
  }

  return result;
}

/* ─────────────────────────────────────────
   CALCULATE MATCH RATE
───────────────────────────────────────── */
function calcMatchRate(values: ExtractedValue[], years: string[]): number {
  if (values.length === 0) return 0;
  const withData = values.filter(v => years.some(yr => (v.values[yr] ?? 0) !== 0));
  return withData.length / values.length;
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export async function extractValuesFromPDF(
  file: File,
  catalogItems: CatalogItem[],
  onProgress?: (step: string, pct: number) => void
): Promise<PDFExtractionResult> {
  let usedOCR = false;

  // ── PASO 1: texto nativo con pdfjs ──
  onProgress?.('Leyendo PDF…', 5);
  let rawText = await extractTextFromPDF(file);

  console.log('[PDF] Texto nativo, longitud:', rawText.trim().length);

  const isScanned = !rawText || rawText.trim().length < 50;

  // ── PASO 2: OCR si el texto nativo es insuficiente ──
  if (isScanned) {
    usedOCR = true;
    console.log('[PDF] Activando OCR (Tesseract)…');
    onProgress?.('PDF escaneado, iniciando OCR…', 8);

    rawText = await extractTextWithOCR(file, onProgress);
    console.log('[PDF] OCR completado, longitud:', rawText.trim().length);
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error(
      'No se pudo extraer texto del PDF' +
      (isScanned ? ' ni con OCR' : '') +
      '. Verifica que el archivo no esté dañado o protegido.'
    );
  }

  console.log(`[PDF] Método: ${usedOCR ? 'OCR Tesseract' : 'pdfjs nativo'}`);
  console.log('[PDF] Muestra:\n', rawText.substring(0, 400));

  // ── PASO 3: años ──
  onProgress?.('Detectando años…', usedOCR ? 42 : 25);
  const years = detectYears(rawText);
  console.log('[PDF] Años:', years);

  // ── PASO 4: mapeo IA ──
  onProgress?.('Analizando con IA…', usedOCR ? 50 : 40);
  let values: ExtractedValue[] = [];

  try {
    values = await matchWithAI(rawText, catalogItems, years);
    console.log('[PDF] IA mapeó', values.length, 'ítems');
  } catch (err) {
    console.warn('[PDF] IA falló, usando similitud de texto:', err);
    onProgress?.('Usando análisis local…', usedOCR ? 70 : 60);
    values = matchByText(rawText, catalogItems, years);
    console.log('[PDF] Similitud mapeó', values.length, 'ítems');
  }

  // ── PASO 5: match rate ──
  onProgress?.('Calculando correspondencia…', 90);
  const matchRate = calcMatchRate(values, years);
  console.log('[PDF] Match rate:', Math.round(matchRate * 100) + '%');

  onProgress?.('Listo', 100);

  return { years, values, matchRate, rawText, usedOCR };
}