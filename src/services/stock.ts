import YahooFinanceModule from "yahoo-finance2";

console.log("yahoo-finance2 export type:", typeof YahooFinanceModule);
const yahooFinance = typeof YahooFinanceModule === "function"
  ? new (YahooFinanceModule as any)()
  : YahooFinanceModule;

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
  const trimmed = input.trim().toUpperCase();
  return trimmed.endsWith(".T") ? trimmed : `${trimmed}.T`;
}

export function displayTicker(ticker: string): string {
  return ticker.replace(/\.T$/, "");
}

export async function getQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const result: any = await yahooFinance.quote(ticker);
    if (!result || !result.regularMarketPrice) return null;

    const price = result.regularMarketPrice;
    const previousClose = result.regularMarketPreviousClose ?? price;
    const change = price - previousClose;
    const changePercent =
      previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      name: result.shortName ?? result.longName ?? ticker,
      price,
      previousClose,
      change,
      changePercent,
      currency: result.currency ?? "JPY",
    };
  } catch (e) {
    console.error(`Failed to fetch quote for ${ticker}:`, e);
    return null;
  }
}

export async function getQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const promises = tickers.map(async (ticker) => {
    const quote = await getQuote(ticker);
    if (quote) results.set(ticker, quote);
  });
  await Promise.all(promises);
  return results;
}

export async function validateTicker(ticker: string): Promise<{ valid: boolean; name?: string }> {
  try {
    const result: any = await yahooFinance.quote(ticker);
    console.log(`validateTicker(${ticker}) result:`, JSON.stringify(result, null, 2));
    if (result && result.regularMarketPrice) {
      return { valid: true, name: result.shortName ?? result.longName ?? undefined };
    }
    return { valid: false };
  } catch (e) {
    console.error(`validateTicker(${ticker}) error:`, e);
    return { valid: false };
  }
}

export async function getHistory(
  ticker: string,
  days: number = 30
): Promise<StockHistory[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result: any = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    return (result as any[]).map((row: any) => ({
      date: row.date,
      close: row.close,
    }));
  } catch (e) {
    console.error(`Failed to fetch history for ${ticker}:`, e);
    return [];
  }
}
