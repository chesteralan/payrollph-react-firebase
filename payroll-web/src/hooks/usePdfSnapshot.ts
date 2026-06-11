import { useCallback, useRef } from "react";
import jsPDF from "jspdf";

export function usePdfSnapshot() {
  const contentRef = useRef<HTMLDivElement>(null);

  const exportPdf = useCallback(async (filename = "dashboard.pdf") => {
    const { default: html2canvas } = await import("html2canvas");
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  }, []);

  return { contentRef, exportPdf };
}
