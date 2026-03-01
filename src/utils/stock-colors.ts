/**
 * 株価チャートとEmbedで使用する色とアイコンの定義
 */
export const STOCK_COLOR_PALETTE = [
  { color: "#89b4fa", emoji: "🔵", name: "青" },
  { color: "#a6e3a1", emoji: "🟢", name: "緑" },
  { color: "#f38ba8", emoji: "🔴", name: "赤" },
  { color: "#fab387", emoji: "🟠", name: "橙" },
  { color: "#cba6f7", emoji: "🟣", name: "紫" },
  { color: "#f9e2af", emoji: "🟡", name: "黄" },
  { color: "#74c7ec", emoji: "🟤", name: "茶" },
] as const;

/**
 * インデックスに対応する色を取得する
 * @param index - 銘柄のインデックス
 * @returns カラーコード（例: "#89b4fa"）
 */
export const getColorForIndex = (index: number): string => {
  const safeIndex =
    ((index % STOCK_COLOR_PALETTE.length) + STOCK_COLOR_PALETTE.length) %
    STOCK_COLOR_PALETTE.length;
  return STOCK_COLOR_PALETTE[safeIndex].color;
};

/**
 * インデックスに対応する絵文字を取得する
 * @param index - 銘柄のインデックス
 * @returns 色の絵文字（例: "🔵"）
 */
export const getEmojiForIndex = (index: number): string => {
  const safeIndex =
    ((index % STOCK_COLOR_PALETTE.length) + STOCK_COLOR_PALETTE.length) %
    STOCK_COLOR_PALETTE.length;
  return STOCK_COLOR_PALETTE[safeIndex].emoji;
};

// テスト用に色の配列もエクスポート
export const STOCK_COLORS = STOCK_COLOR_PALETTE.map((p) => p.color);
