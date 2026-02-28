import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { parseScheduleInput } from "../services/schedule-parser";
import { Scheduler } from "../services/scheduler";

export const data = new SlashCommandBuilder()
  .setName("set-schedule")
  .setDescription("このチャンネルに通知スケジュールを追加")
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

  // DB追加（既存スケジュールは保持）
  const insertedIds = repo.addSchedules(
    interaction.channelId,
    interaction.guildId!,
    results.map((r) => r.cron)
  );

  // cronタスク再登録
  scheduler.registerAll();

  if (insertedIds.length === 0) {
    await interaction.reply({
      content: "⚠️ 指定されたスケジュールは既に登録されています",
      ephemeral: true,
    });
    return;
  }

  const scheduleList = results
    .slice(0, insertedIds.length)
    .map((r, i) => `  [ID:${insertedIds[i]}] ${r.desc}`)
    .join("\n");
  await interaction.reply(`✅ 通知スケジュールを追加しました:\n${scheduleList}`);
}
