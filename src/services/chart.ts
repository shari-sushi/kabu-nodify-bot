import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";
import { StockHistory, displayTicker } from "./stock";
import { getColorForIndex } from "../utils/stock-colors";

const WIDTH = 800;
const HEIGHT = 400;

const chartCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: "#1e1e2e",
});

function formatDate(date: Date): string {
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${m}/${d}`;
}

export async function generateChart(data: Map<string, StockHistory[]>): Promise<Buffer> {
  // 全銘柄の日付をユニオンしてラベル作成
  const allDates = new Set<string>();
  for (const history of data.values()) {
    for (const h of history) {
      allDates.add(formatDate(h.date));
    }
  }
  const labels = Array.from(allDates).sort();

  const useNormalized = data.size > 1;

  const datasets = Array.from(data.entries()).map(([ticker, history], index) => {
    const color = getColorForIndex(index);
    const dateMap = new Map(history.map((h) => [formatDate(h.date), h.close]));
    const basePrice = history.length > 0 ? history[0].close : 1;

    const values = labels.map((label) => {
      const close = dateMap.get(label);
      if (close == null) return null;
      return useNormalized ? ((close - basePrice) / basePrice) * 100 : close;
    });

    return {
      label: displayTicker(ticker),
      data: values,
      borderColor: color,
      backgroundColor: color + "33",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.1,
      spanGaps: true,
    };
  });

  const config: ChartConfiguration = {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: false,
      scales: {
        x: {
          ticks: { color: "#cdd6f4", maxTicksLimit: 10 },
          grid: { color: "#31324433" },
        },
        y: {
          ticks: {
            color: "#cdd6f4",
            callback: useNormalized
              ? (value: any) => `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)}%`
              : (value: any) => `¥${Number(value).toLocaleString()}`,
          },
          grid: { color: "#31324433" },
        },
      },
      plugins: {
        legend: { labels: { color: "#cdd6f4" } },
        title: {
          display: true,
          text: useNormalized ? "株価変化率（30日間）" : "株価推移（30日間）",
          color: "#cdd6f4",
          font: { size: 16 },
        },
      },
    },
  };

  return await chartCanvas.renderToBuffer(config);
}
