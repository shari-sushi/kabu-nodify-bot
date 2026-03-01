import { fetchYahooFinanceChart } from "../utils/yahoo-finance";

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface StockHistory {
  date: Date;
  close: number;
}

export function toTokyoTicker(input: string): string {
  const trimmed = input.replace(/\s+/g, "").toUpperCase();
  return trimmed.endsWith(".T") ? trimmed : `${trimmed}.T`;
}

export function displayTicker(ticker: string): string {
  return ticker.replace(/\.T$/, "");
}

export async function getQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const result = await fetchYahooFinanceChart(ticker, "1d", "1d");
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      name: meta.shortName ?? meta.longName ?? meta.symbol ?? ticker,
      price,
      previousClose,
      change,
      changePercent,
      currency: meta.currency ?? "JPY",
    };
  } catch (e) {
    console.error(`Failed to fetch quote for ${ticker}:`, e);
    return null;
  }
}

export async function getQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  await Promise.all(
    tickers.map(async (ticker) => {
      const quote = await getQuote(ticker);
      if (quote) results.set(ticker, quote);
    })
  );
  return results;
}

export async function validateTicker(ticker: string): Promise<{ valid: boolean; name?: string }> {
  try {
    const result = await fetchYahooFinanceChart(ticker, "1d", "1d");
    const meta = result.meta;
    return { valid: true, name: meta.shortName ?? meta.longName ?? undefined };
  } catch (e) {
    console.error(`validateTicker(${ticker}) error:`, e);
    return { valid: false };
  }
}

export async function getHistory(ticker: string, days: number = 30): Promise<StockHistory[]> {
  try {
    const result = await fetchYahooFinanceChart(ticker, "1mo", "1d");
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000),
        close: closes[i],
      }))
      .filter((h) => h.close != null);
  } catch (e) {
    console.error(`Failed to fetch history for ${ticker}:`, e);
    return [];
  }
}
