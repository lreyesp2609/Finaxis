import { supabase } from './supabaseClient';
import { extractTextFromPDF, extractTextWithOCR } from './pdfTextExtractor';

export interface ExtractedItem {
  codigo: string | null;
  nombre: string;
  nivel: number;
  contenedor: boolean;
  iditempadre_codigo: string | null;
}

export async function extractCatalogFromPDF(
  file: File
): Promise<ExtractedItem[]> {
  let rawText = await extractTextFromPDF(file);

  const isScanned = !rawText || rawText.trim().length < 50;

  if (isScanned) {
    if (import.meta.env.DEV) console.log('PDF appears to be scanned, switching to OCR...');
    rawText = await extractTextWithOCR(file);
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('No se pudo extraer texto del PDF (ni con OCR)');
  }

  if (import.meta.env.DEV) {
    console.log('Text extracted via:', isScanned ? 'OCR (Tesseract)' : 'PDF.js');
    console.log('Raw text extracted:', rawText.substring(0, 500));
  }

  const items = await parseWithGroq(rawText);

  if (import.meta.env.DEV) {
    console.log('Groq parsed:', items.length, 'items');
    console.log(JSON.stringify(items, null, 2));
  }

  return buildHierarchy(items);
}



async function parseWithGroq(rawText: string): Promise<ExtractedItem[]> {
  const { data, error } = await supabase.functions.invoke('groq-proxy', {
    body: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You are a financial statement parser for Ecuadorian banks (Superintendencia de Bancos).

Respond ONLY with a valid JSON array. No markdown, no explanation.

Each object must have exactly these fields:
- "codigo": string (numeric code) or null
- "nombre": string (account name, uppercase)
- "nivel": integer
- "contenedor": boolean
- "iditempadre_codigo": string or null

══════════════════════════════════════════
DOCUMENT STRUCTURE — READ THIS FIRST
══════════════════════════════════════════

This is a Profit & Loss Statement (Estado de Pérdidas y Ganancias).
It does NOT follow a tree structure by code prefix.
Instead, it uses MARGIN ROWS as logical containers that group
the account rows listed ABOVE them (between the previous margin and itself).

MARGIN ROWS are bold rows with NO numeric code. They act as containers.
They appear AFTER the accounts they summarize. Examples:
  MARGEN NETO INTERESES
  MARGEN BRUTO FINANCIERO
  MARGEN NETO FINANCIERO
  MARGEN DE INTERMEDIACIÓN
  MARGEN OPERACIONAL

ACCOUNT ROWS have a 2-digit numeric code and a name. Examples:
  51 INTERESES Y DESCUENTOS GANADOS
  41 INTERESES CAUSADOS

══════════════════════════════════════════
STEP-BY-STEP EXTRACTION RULES
══════════════════════════════════════════

STEP 1 — ASSIGN SYNTHETIC CODES TO MARGIN ROWS:
Give each margin row a synthetic string code (not numeric) so it can be referenced:
  "MARGEN NETO INTERESES"       → codigo: "M1"
  "MARGEN BRUTO FINANCIERO"     → codigo: "M2"
  "MARGEN NETO FINANCIERO"      → codigo: "M3"
  "MARGEN DE INTERMEDIACIÓN"    → codigo: "M4"
  "MARGEN OPERACIONAL"          → codigo: "M5"

STEP 2 — DETERMINE CHILDREN OF EACH MARGIN:
Each margin row owns the account rows that appear between it and the previous margin
(or the start of the document if it's the first margin).

Group accounts into margins like this:
  M1 (MARGEN NETO INTERESES) owns:
    51 INTERESES Y DESCUENTOS GANADOS
    41 INTERESES CAUSADOS

  M2 (MARGEN BRUTO FINANCIERO) owns everything NEW since M1:
    52 COMISIONES GANADAS
    54 INGRESOS POR SERVICIOS
    42 COMISIONES CAUSADAS
    53 UTILIDADES FINANCIERAS
    43 PÉRDIDAS FINANCIERAS

  M3 (MARGEN NETO FINANCIERO) owns everything NEW since M2:
    44 PROVISIONES

  M4 (MARGEN DE INTERMEDIACIÓN) owns everything NEW since M3:
    45 GASTOS DE OPERACIÓN

  M5 (MARGEN OPERACIONAL) owns everything NEW since M4:
    55 OTROS INGRESOS OPERACIONALES
    46 OTRAS PÉRDIDAS OCASIONALES

  Remaining accounts after M5 (no margin container, iditempadre_codigo: null):
    56 OTROS INGRESOS
    47 OTROS GASTOS Y PÉRDIDAS
    48 IMPUESTOS Y PARTICIPACIÓN A EMPLEADOS

STEP 3 — SET FIELDS:
For margin rows (M1–M5):
  - codigo: synthetic code (M1, M2, ...)
  - nombre: exact name in uppercase
  - nivel: 1
  - contenedor: true
  - iditempadre_codigo: null

For account rows that belong to a margin:
  - codigo: the numeric code as string ("51", "41", etc.)
  - nombre: exact name in uppercase
  - nivel: 2
  - contenedor: false
  - iditempadre_codigo: the margin's synthetic code ("M1", "M2", etc.)

For account rows after M5 with no margin:
  - iditempadre_codigo: null
  - nivel: 2
  - contenedor: false

STEP 4 — EXCLUDE these rows entirely (do not output them):
× Table headers: CÓDIGO, DESCRIPCIÓN, 31/12/2024, 31/12/2025
× Totals/results: GANANCIA O PÉRDIDA DEL EJERCICIO,
  GANANCIA O PÉRDIDA ANTES DE IMPUESTOS
× Footer content: signatures, names, titles, institution name, dates

STEP 5 — OUTPUT ORDER:
Output each margin immediately followed by its child accounts.
Example:
  M1, then 51, then 41,
  M2, then 52, 54, 42, 53, 43,
  M3, then 44, ...`
        },
        {
          role: 'user',
          content: `Extract ALL account entries including those with zero or dash values.
Financial statement text:\n\n${rawText}`
        }
      ]
    }
  });

  if (error) {
    throw new Error(`Groq Proxy error: ${error.message || JSON.stringify(error)}`);
  }
  if (data?.error) {
    throw new Error(`Groq API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '[]';

  const clean = text.replace(/```json|```/g, '').trim();

  const parsed: any[] = JSON.parse(clean);

  return parsed.map(item => ({
    codigo: item.codigo ?? null,
    nombre: (item.nombre ?? '').toUpperCase().trim(),
    nivel: item.nivel ?? 1,
    contenedor: item.contenedor ?? false,
    iditempadre_codigo: item.iditempadre_codigo ?? null,
  }));
}

function buildHierarchy(items: ExtractedItem[]): ExtractedItem[] {
  const codeMap = new Map<string, ExtractedItem>();
  for (const item of items) {
    if (item.codigo) codeMap.set(item.codigo, item);
  }

  for (const item of items) {
    if (!item.codigo) continue;

    if (item.iditempadre_codigo !== null) {
      const parent = codeMap.get(item.iditempadre_codigo);
      if (parent) parent.contenedor = true;
      continue;
    }

    const isNumeric = /^\d+$/.test(item.codigo);
    if (!isNumeric) continue;

    let parentCode: string | null = null;
    for (let len = item.codigo.length - 1; len >= 1; len--) {
      const prefix = item.codigo.slice(0, len);
      if (codeMap.has(prefix)) {
        parentCode = prefix;
        break;
      }
    }

    item.iditempadre_codigo = parentCode;

    if (parentCode && codeMap.has(parentCode)) {
      codeMap.get(parentCode)!.contenedor = true;
    }
  }

  return items;
}