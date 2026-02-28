import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

export const config = {
  botToken: requireEnv("DISCORD_BOT_TOKEN"),
  clientId: requireEnv("DISCORD_CLIENT_ID"),
  dbPath: process.env.DB_PATH ?? "./data/kabu-notify.db",
} as const;
