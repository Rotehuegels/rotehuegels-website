'use client';
import { Printer } from 'lucide-react';

function imgToDataUrl(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1;
    canvas.height = img.naturalHeight || 1;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return img.src;
  }
}

export default function StatementPrintButton() {
  const handlePrint = () => {
    const doc = document.getElementById('rh-statement-doc');
    if (!doc) return;

    const clone = doc.cloneNode(true) as HTMLElement;
    const cloneImgs = Array.from(clone.querySelectorAll('img'));
    const origImgs  = Array.from(doc.querySelectorAll('img'));
    cloneImgs.forEach((cloneImg, i) => {
      const orig = origImgs[i];
      if (orig?.complete && orig.naturalWidth > 0) cloneImg.src = imgToDataUrl(orig);
    });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  body { margin: 0; background: white; font-family: Arial, sans-serif; font-size: 11px; }
  table { border-collapse: collapse; }
</style>
</head><body>${clone.outerHTML}</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;left:-9999px;top:-9999px';
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(iframe); }, 2000);
      }, 300);
    };
    iframe.src = url;
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  );
}
