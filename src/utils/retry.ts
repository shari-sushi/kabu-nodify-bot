/**
 * リトライユーティリティ
 * エクスポネンシャルバックオフ
 */

export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** 初回リトライまでの待機時間（ミリ秒） */
  initialDelay?: number;
  /** バックオフの倍率 */
  backoffMultiplier?: number;
  /** リトライ可能なエラーかどうかを判定する関数 */
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * 指定された関数をエクスポネンシャルバックオフで再試行する
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // リトライ可能なエラーかチェック
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // 最後の試行なら例外をスロー
      if (attempt >= opts.maxRetries) {
        throw error;
      }

      // エクスポネンシャルバックオフで待機
      const delay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ネットワークエラーかどうかを判定
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const err = error as any;
  // タイムアウトや接続エラーを検出
  return (
    err.code === "ETIMEDOUT" ||
    err.code === "ECONNREFUSED" ||
    err.code === "ENOTFOUND" ||
    err.code === "ECONNRESET" ||
    err.name === "AbortError" ||
    err.message?.includes("fetch failed") ||
    err.message?.includes("timeout")
  );
}
