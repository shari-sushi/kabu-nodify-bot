import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { parseScheduleInput } from "../services/schedule-parser";
import { Scheduler } from "../services/scheduler";

export const data = new SlashCommandBuilder()
  .setName("set-schedule")
  .setDescription("このチャンネルの通知スケジュールを設定")
  .addStringOption((option) =>
    option.setName("day").setDescription("曜日（毎日/平日/土日/月火水...）").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("time1").setDescription("通知時刻1（HH:MM）").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("time2").setDescription("通知時刻2（HH:MM）").setRequired(false)
  )
  .addStringOption((option) =>
    option.setName("time3").setDescription("通知時刻3（HH:MM）").setRequired(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository,
  scheduler: Scheduler
): Promise<void> {
  const dayInput = interaction.options.getString("day", true);
  const times = [
    interaction.options.getString("time1", true),
    interaction.options.getString("time2"),
    interaction.options.getString("time3"),
  ].filter((t): t is string => t !== null);

  const results: { cron: string; desc: string }[] = [];

  for (const time of times) {
    const parsed = parseScheduleInput(dayInput, time);
    if ("error" in parsed) {
      await interaction.reply({ content: `❌ ${parsed.error}`, ephemeral: true });
      return;
    }
    results.push({ cron: parsed.cronExpression, desc: parsed.description });
  }

  // DB更新（既存スケジュールを上書き）
  repo.setSchedules(
    interaction.channelId,
    interaction.guildId!,
    results.map((r) => r.cron)
  );

  // cronタスク再登録
  scheduler.registerAll();

  const scheduleList = results.map((r) => `  ⏰ ${r.desc}`).join("\n");
  await interaction.reply(`✅ 通知スケジュールを設定しました:\n${scheduleList}`);
}
