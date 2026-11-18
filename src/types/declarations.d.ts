declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string | null;
    windowWidth?: number;
    windowHeight?: number;
    width?: number;
    height?: number;
  }
  export default function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
}
