import { toPng } from "html-to-image";

export async function exportChartAsImage(ref: React.RefObject<HTMLElement | null>, filename = "chart-analysis.png") {
  if (!ref.current) return;
  
  try {
    const dataUrl = await toPng(ref.current, { 
      quality: 0.95,
      backgroundColor: '#030816' // Match the theme background
    });
    
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Failed to export chart", err);
  }
}
