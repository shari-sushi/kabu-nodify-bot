/**
 * Yahoo Finance API クライアント
 * 外部APIとのやり取りを抽象化し、ライブラリの変更に強い設計にする
 */

export interface YahooFinanceChartResult {
  meta: {
    regularMarketPrice: number;
    previousClose?: number;
    chartPreviousClose?: number;
    shortName?: string;
    longName?: string;
    symbol?: string;
    currency?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: number[];
    }>;
  };
}

/**
 * Yahoo Finance APIからチャートデータを取得
 */
export async function fetchYahooFinanceChart(
  ticker: string,
  range: string = "1d",
  interval: string = "1d"
): Promise<YahooFinanceChartResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "kabu-notify-bot/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API error: HTTP ${res.status}`);
  }

  const json = (await res.json()) as any;
  const result = json?.chart?.result?.[0];

  if (!result) {
    throw new Error("No data returned from Yahoo Finance API");
  }

  return result;
}
