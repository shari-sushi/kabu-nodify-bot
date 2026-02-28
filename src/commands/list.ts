import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { displayTicker } from "../services/stock";
import { cronToDescription } from "../services/schedule-parser";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("このサーバーの株価通知設定を一覧表示");

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "サーバー内でのみ使用できます。", ephemeral: true });
    return;
  }

  const overview = repo.getGuildOverview(guildId);

  if (overview.length === 0) {
    await interaction.reply({
      content:
        "📋 このサーバーにはまだ通知設定がありません。\n`/add-stock` で銘柄を追加してください。",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder().setTitle("📋 株価通知設定").setColor(0x89b4fa);

  const warnings: string[] = [];

  for (const ch of overview) {
    const stockList =
      ch.stocks.length > 0
        ? ch.stocks
            .map((s) => `${s.name ?? displayTicker(s.ticker)} (${displayTicker(s.ticker)})`)
            .join(", ")
        : "なし";

    const schedules = repo.getSchedules(ch.channelId);
    const scheduleList =
      schedules.length > 0
        ? schedules.map((s) => `[ID:${s.id}] ${cronToDescription(s.cronExpression)}`).join(", ")
        : "未設定";

    embed.addFields({
      name: `<#${ch.channelId}>`,
      value: `銘柄: ${stockList}\n通知: ${scheduleList}`,
      inline: false,
    });

    // 警告チェック
    if (ch.stocks.length > 0 && ch.schedules.length === 0) {
      warnings.push(
        `<#${ch.channelId}> — 銘柄${ch.stocks.length}件登録済み、\`/set-schedule\` で設定してください`
      );
    }
    if (ch.stocks.length === 0 && ch.schedules.length > 0) {
      warnings.push(`<#${ch.channelId}> — スケジュール設定済みですが銘柄がありません`);
    }
  }

  if (warnings.length > 0) {
    embed.addFields({
      name: "⚠️ 注意",
      value: warnings.join("\n"),
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed] });
}
