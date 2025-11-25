import type { ChartData } from "./ChatChart";

/**
 * Extrae datos de gráfico de un mensaje del chat
 * El backend envía los datos en formato: <<<CHART_DATA>>>{json}<<<END_CHART_DATA>>>
 */
export function extractChartData(content: string): {
  chartData: ChartData | null;
  textContent: string;
} {
  const chartMatch = content.match(
    /<<<CHART_DATA>>>([\s\S]*?)<<<END_CHART_DATA>>>/
  );

  if (!chartMatch) {
    return { chartData: null, textContent: content };
  }

  try {
    const chartData = JSON.parse(chartMatch[1]) as ChartData;
    const textContent = content
      .replace(/<<<CHART_DATA>>>[\s\S]*?<<<END_CHART_DATA>>>/, "")
      .trim();
    return { chartData, textContent };
  } catch {
    return { chartData: null, textContent: content };
  }
}
