import {
  STOCK_COLORS,
  STOCK_COLOR_PALETTE,
  getColorForIndex,
  getEmojiForIndex,
} from "./stock-colors";

describe("stock-colors", () => {
  describe("STOCK_COLORS", () => {
    it("7色の色定義が存在する", () => {
      expect(STOCK_COLORS).toHaveLength(7);
    });

    it("全ての色がHEX形式である", () => {
      STOCK_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe("getColorForIndex", () => {
    it("インデックス0で最初の色を取得できる", () => {
      expect(getColorForIndex(0)).toBe(STOCK_COLOR_PALETTE[0].color);
    });

    it("インデックス6で7番目の色を取得できる", () => {
      expect(getColorForIndex(6)).toBe(STOCK_COLOR_PALETTE[6].color);
    });

    it("インデックスが色数を超えた場合は最初から繰り返す", () => {
      expect(getColorForIndex(7)).toBe(STOCK_COLOR_PALETTE[7 - STOCK_COLOR_PALETTE.length].color);
    });

    it("負のインデックスでもエラーにならない", () => {
      expect(() => getColorForIndex(-1)).not.toThrow();
    });
  });

  describe("getEmojiForIndex", () => {
    it("インデックス0で青の丸絵文字を取得できる", () => {
      expect(getEmojiForIndex(0)).toBe(STOCK_COLOR_PALETTE[0].emoji);
    });

    it("インデックス1で緑の丸絵文字を取得できる", () => {
      expect(getEmojiForIndex(1)).toBe(STOCK_COLOR_PALETTE[1].emoji);
    });

    it("インデックス6で茶の丸絵文字を取得できる", () => {
      expect(getEmojiForIndex(6)).toBe(STOCK_COLOR_PALETTE[6].emoji);
    });

    it("インデックスが色数を超えた場合は最初から繰り返す", () => {
      expect(getEmojiForIndex(7)).toBe(STOCK_COLOR_PALETTE[7 - STOCK_COLORS.length].emoji);
      expect(getEmojiForIndex(8)).toBe(STOCK_COLOR_PALETTE[8 - STOCK_COLORS.length].emoji);
    });

    it("全てのインデックスに対して絵文字が取得できる", () => {
      for (let i = 0; i < 16; i++) {
        const emoji = getEmojiForIndex(i);
        expect(emoji).toBeTruthy();
        expect(typeof emoji).toBe("string");
      }
    });
  });
});
