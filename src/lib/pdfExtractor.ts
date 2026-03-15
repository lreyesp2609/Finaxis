// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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
  // Step 1: Extract raw text from PDF using PDF.js
  const rawText = await extractTextFromPDF(file);
  
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('No se pudo extraer texto del PDF');
  }

  console.log('Raw text extracted:', rawText.substring(0, 500));

  // Step 2: Send text to Groq for structured parsing
  const items = await parseWithGroq(rawText);
  
  console.log('Groq parsed:', items.length, 'items');
  console.log(JSON.stringify(items, null, 2));

  return buildHierarchy(items);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group text items by Y coordinate with 4px tolerance
    const yMap = new Map<number, { x: number; text: string }[]>();
    
    for (const item of content.items as any[]) {
      const text = item.str?.trim();
      if (!text) continue;
      const y = Math.round(item.transform[5] / 4) * 4;
      const x = Math.round(item.transform[4]);
      if (!yMap.has(y)) yMap.set(y, []);
      yMap.get(y)!.push({ x, text });
    }

    // Sort rows top to bottom, items left to right
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

async function parseWithGroq(rawText: string): Promise<ExtractedItem[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You are a financial account catalog parser for Ecuadorian banks
following Superintendencia de Bancos (SB) chart of accounts.

Respond ONLY with a valid JSON array. No markdown, no explanation.

Each object must have exactly these fields:
- "codigo": string (numeric code) or null
- "nombre": string (account name, uppercase)  
- "nivel": integer (1=root, 2=subgroup, 3=account, 4=subaccount)
- "contenedor": boolean

═══════════════════════════════
STRICT RULES - READ CAREFULLY
═══════════════════════════════

RULE 1 — WHAT TO INCLUDE:
Only include rows that have a numeric code (1-8 digits) AND a name.
Example valid rows: "11 FONDOS DISPONIBLES", "41 INTERESES CAUSADOS"

RULE 2 — WHAT TO EXCLUDE (never include these):
× Rows without a numeric code, even if they look like headers
  (ACTIVO, PASIVOS, PATRIMONIO, MARGEN NETO INTERESES, etc.)
× Summary/total rows: TOTAL ACTIVOS, TOTAL PASIVOS, TOTAL PATRIMONIO,
  GANANCIA O PÉRDIDA DEL EJERCICIO, GANANCIA O PÉRDIDA ANTES DE IMPUESTOS,
  MARGEN NETO INTERESES, MARGEN BRUTO FINANCIERO, MARGEN NETO FINANCIERO,
  MARGEN DE INTERMEDIACIÓN, MARGEN OPERACIONAL, and any similar subtotal
× Table headers: CÓDIGO, DESCRIPCIÓN, 31/12/2024, 31/12/2025
× Footer: signatures, names, titles, institution name

RULE 3 — NIVEL based on code length:
1 digit  → nivel 1 (e.g. "1", "2", "3", "4", "5")
2 digits → nivel 2 (e.g. "11", "21", "41")
4 digits → nivel 3 (e.g. "1101", "4101")
6 digits → nivel 4 (e.g. "110101")

RULE 4 — CONTENEDOR:
true  → if the code has child codes in this document
        (e.g. "1" is contenedor=true because "11","12"... exist)
false → if no child codes exist for this code in the document

RULE 5 — HIERARCHY (auto-infer parents):
If 2-digit codes exist (11, 12, 21, 41...) but their 1-digit parent
does NOT appear in the document, CREATE the parent entry:
  codes 1x → {"codigo":"1","nombre":"ACTIVO","nivel":1,"contenedor":true}
  codes 2x → {"codigo":"2","nombre":"PASIVOS","nivel":1,"contenedor":true}
  codes 3x → {"codigo":"3","nombre":"PATRIMONIO","nivel":1,"contenedor":true}
  codes 4x → {"codigo":"4","nombre":"GASTOS","nivel":1,"contenedor":true}
  codes 5x → {"codigo":"5","nombre":"INGRESOS","nivel":1,"contenedor":true}
  codes 6x → {"codigo":"6","nombre":"CONTINGENTES","nivel":1,"contenedor":true}
  codes 7x → {"codigo":"7","nombre":"CUENTAS DE ORDEN","nivel":1,"contenedor":true}

BUT if the 1-digit code already appears in the document (e.g. "1 TOTAL ACTIVOS"),
DO NOT create a duplicate — use the existing one BUT rename it to the standard name:
  "1" → "ACTIVO" (not "TOTAL ACTIVOS")
  "2" → "PASIVOS" (not "TOTAL PASIVOS")  
  "3" → "PATRIMONIO" (not "TOTAL PATRIMONIO")

RULE 6 — DEDUPLICATION:
Never output two entries with the same codigo.
If the same code appears twice, keep only one.

RULE 7 — OUTPUT ORDER:
Sort by codigo ascending. Parents before children.
Example: "1", "11", "12", "13", "2", "21", "22", "3", "31"...`
        },
        {
          role: 'user',
          content: `Extract ALL account entries including those with zero or dash values.
Financial statement text:\n\n${rawText}`
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '[]';
  
  // Clean and parse JSON
  const clean = text.replace(/```json|```/g, '').trim();
  
  const parsed: any[] = JSON.parse(clean);
  
  return parsed.map(item => ({
    codigo: item.codigo ?? null,
    nombre: (item.nombre ?? '').toUpperCase().trim(),
    nivel: item.nivel ?? 1,
    contenedor: item.contenedor ?? false,
    iditempadre_codigo: null,
  }));
}

function buildHierarchy(items: ExtractedItem[]): ExtractedItem[] {
  const codeMap = new Map<string, ExtractedItem>();
  for (const item of items) {
    if (item.codigo) codeMap.set(item.codigo, item);
  }

  for (const item of items) {
    if (!item.codigo) continue;

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
