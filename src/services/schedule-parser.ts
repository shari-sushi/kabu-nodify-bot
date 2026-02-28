/**
 * ユーザー入力をcron式に変換する
 *
 * 入力例:
 *   "毎日 09:00"         → "0 9 * * *"
 *   "平日 09:00"         → "0 9 * * 1-5"
 *   "月水金 15:30"       → "30 15 * * 1,3,5"
 */

const DAY_MAP: Record<string, string> = {
  日: "0",
  月: "1",
  火: "2",
  水: "3",
  木: "4",
  金: "5",
  土: "6",
};

export interface ParsedSchedule {
  cronExpression: string;
  description: string;
}

export function parseScheduleInput(
  dayInput: string,
  timeInput: string
): ParsedSchedule | { error: string } {
  // 時刻パース
  const timeMatch = timeInput.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return { error: `時刻の形式が不正です: "${timeInput}" → HH:MM で指定してください` };
  }
  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { error: `時刻が範囲外です: ${timeInput}` };
  }

  // 曜日パース
  let dayOfWeek: string;
  let description: string;

  const normalized = dayInput.trim();

  if (normalized === "毎日") {
    dayOfWeek = "*";
    description = "毎日";
  } else if (normalized === "平日") {
    dayOfWeek = "1-5";
    description = "平日";
  } else if (normalized === "休日" || normalized === "土日") {
    dayOfWeek = "0,6";
    description = "土日";
  } else {
    // 個別曜日指定: "月水金" → "1,3,5"
    const days: string[] = [];
    const dayNames: string[] = [];
    for (const char of normalized) {
      if (DAY_MAP[char]) {
        days.push(DAY_MAP[char]);
        dayNames.push(char);
      } else {
        return {
          error: `不明な曜日: "${char}" → 毎日/平日/土日、または曜日（月火水木金土日）を指定してください`,
        };
      }
    }
    if (days.length === 0) {
      return { error: "曜日が指定されていません" };
    }
    dayOfWeek = days.join(",");
    description = dayNames.map((d) => d + "曜").join("");
  }

  const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
  const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  return {
    cronExpression,
    description: `${description} ${timeStr}`,
  };
}

/** cron式を日本語で表示 */
export function cronToDescription(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [minute, hour, , , dayOfWeek] = parts;
  const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  const REVERSE_DAY_MAP: Record<string, string> = {
    "0": "日",
    "1": "月",
    "2": "火",
    "3": "水",
    "4": "木",
    "5": "金",
    "6": "土",
  };

  if (dayOfWeek === "*") return `毎日 ${timeStr}`;
  if (dayOfWeek === "1-5") return `平日 ${timeStr}`;
  if (dayOfWeek === "0,6") return `土日 ${timeStr}`;

  const dayStr = dayOfWeek
    .split(",")
    .map((d) => REVERSE_DAY_MAP[d] ?? d)
    .join("");

  return `${dayStr} ${timeStr}`;
}
