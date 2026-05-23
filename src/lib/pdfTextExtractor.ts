// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/legacy/build/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
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

export async function extractTextWithOCR(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allText: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    if (import.meta.env.DEV) {
      console.log(`OCR: processing page ${pageNum}/${pdf.numPages}...`);
    }

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
        if (m.status === 'recognizing text' && import.meta.env.DEV) {
          console.log(`OCR page ${pageNum}: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    allText.push(data.text);
    canvas.remove();
  }

  return allText.join('\n');
}
