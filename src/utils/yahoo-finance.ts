/**
 * Yahoo Finance API クライアント
 * 外部APIとのやり取りを抽象化し、ライブラリの変更に強い設計にする
 */

import { retryWithBackoff, isNetworkError } from "./retry";
import { YahooFinanceChartResult } from "../libs/yahoo-finance/types";

export type { YahooFinanceChartResult };

const DEFAULT_TIMEOUT_MS = 10000; // 10秒
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1秒

/**
 * Yahoo Finance APIからチャートデータを取得
 * タイムアウトとリトライ機能付き
 */
export async function fetchYahooFinanceChart(
  ticker: string,
  range: string = "1d",
  interval: string = "1d",
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<YahooFinanceChartResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "kabu-notify-bot/1.0" },
          signal: controller.signal,
        });

        if (!res.ok) {
          // 404やその他のHTTPエラーはリトライしない
          const error: any = new Error(`Yahoo Finance API error: HTTP ${res.status}`);
          error.status = res.status;
          error.isHttpError = true;
          throw error;
        }

        const json = (await res.json()) as any;
        const result = json?.chart?.result?.[0];

        if (!result) {
          // データが存在しない場合もリトライしない
          const error: any = new Error("No data returned from Yahoo Finance API");
          error.isDataError = true;
          throw error;
        }

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxRetries,
      initialDelay: INITIAL_RETRY_DELAY_MS,
      shouldRetry: (error: unknown) => {
        // HTTPエラーやデータエラーはリトライしない
        // ネットワークエラーのみリトライする
        const err = error as any;
        if (err?.isHttpError || err?.isDataError) {
          return false;
        }
        return isNetworkError(error);
      },
    }
  );
}
