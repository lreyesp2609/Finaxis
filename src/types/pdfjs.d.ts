declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
    getViewport(options: { scale: number }): PageViewport;
    render(options: { canvas: HTMLCanvasElement | any; viewport: PageViewport }): RenderTask;
  }

  export interface TextContent {
    items: TextItem[];
  }

  export interface TextItem {
    str: string;
    transform: number[];
  }

  export interface PageViewport {
    width: number;
    height: number;
  }

  export interface RenderTask {
    promise: Promise<void>;
  }

  export function getDocument(src: any): {
    promise: Promise<PDFDocumentProxy>;
  };
}

declare module 'pdfjs-dist' {
  export * from 'pdfjs-dist/legacy/build/pdf.mjs';
}
