import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";
import "chartjs-adapter-date-fns";
import { StockHistory, displayTicker } from "./stock";

const WIDTH = 800;
const HEIGHT = 400;

const chartCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: "#1e1e2e",
});

const COLORS = [
  "#89b4fa", // blue
  "#a6e3a1", // green
  "#f38ba8", // red
  "#fab387", // peach
  "#cba6f7", // mauve
  "#94e2d5", // teal
  "#f9e2af", // yellow
  "#74c7ec", // sapphire
];

/**
 * 複数銘柄のチャート画像をBuffer(PNG)で生成
 */
export async function generateChart(
  data: Map<string, StockHistory[]>
): Promise<Buffer> {
  const datasets = Array.from(data.entries()).map(
    ([ticker, history], index) => {
      const color = COLORS[index % COLORS.length];
      return {
        label: displayTicker(ticker),
        data: history.map((h) => ({
          x: h.date.getTime(),
          y: h.close,
        })),
        borderColor: color,
        backgroundColor: color + "33",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      };
    }
  );

  // 銘柄ごとに価格帯が違うので、正規化（初日=100%）するか個別Y軸にする
  // ここでは正規化方式を採用
  const normalizedDatasets = Array.from(data.entries()).map(
    ([ticker, history], index) => {
      const color = COLORS[index % COLORS.length];
      const basePrice = history.length > 0 ? history[0].close : 1;
      return {
        label: displayTicker(ticker),
        data: history.map((h) => ({
          x: h.date.getTime(),
          y: ((h.close - basePrice) / basePrice) * 100,
        })),
        borderColor: color,
        backgroundColor: color + "33",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      };
    }
  );

  // 銘柄が1つなら実際の価格、複数なら正規化（変化率%）
  const useNormalized = data.size > 1;
  const finalDatasets = useNormalized ? normalizedDatasets : datasets;

  const config: ChartConfiguration = {
    type: "line",
    data: {
      datasets: finalDatasets as any,
    },
    options: {
      responsive: false,
      scales: {
        x: {
          type: "time" as any,
          time: {
            unit: "day",
            displayFormats: { day: "MM/dd" },
          },
          ticks: { color: "#cdd6f4" },
          grid: { color: "#31324433" },
        },
        y: {
          ticks: {
            color: "#cdd6f4",
            callback: useNormalized
              ? (value: any) => `${value > 0 ? "+" : ""}${Number(value).toFixed(1)}%`
              : (value: any) => `¥${Number(value).toLocaleString()}`,
          },
          grid: { color: "#31324433" },
        },
      },
      plugins: {
        legend: {
          labels: { color: "#cdd6f4" },
        },
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
