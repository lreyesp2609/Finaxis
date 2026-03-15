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
          content: `You are a financial account catalog parser for Ecuadorian banks.
Extract ALL account entries from the financial statement.
Respond ONLY with a valid JSON array, no markdown, no explanation.

Each element must have exactly:
- "codigo": string with numeric code or null if no code
- "nombre": string with account name in uppercase  
- "nivel": number (1=root, 2=group, 3=subgroup, 4=leaf)
- "contenedor": boolean

CRITICAL RULES:
- Include EVERY row that has a code, even if values are "-" or empty
- Accounts with "-" values are still valid accounts, include them
- nivel is based on code LENGTH: 1 digit=1, 2 digits=2, 4 digits=3, 6 digits=4
- Section headers without code (ACTIVO, PASIVOS, PATRIMONIO, GASTOS, 
  INGRESOS, CONTINGENTES, CUENTAS DE ORDEN) get nivel=1, contenedor=true
- "TOTAL ACTIVOS" code "1", "TOTAL PASIVOS" code "2" etc are 
  summary rows - include them with contenedor=false
- Do NOT skip any numbered account
- Do NOT include: table headers (CÓDIGO, DESCRIPCIÓN), 
  date headers (31/12/...), footer text, signatures`
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
