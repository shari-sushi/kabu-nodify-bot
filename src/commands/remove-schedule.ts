import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { Scheduler } from "../services/scheduler";
import { COMMAND_PREFIX } from "../config";

export const data = new SlashCommandBuilder()
  .setName("remove-schedule")
  .setDescription("指定したスケジュールを削除")
  .addIntegerOption((option) =>
    option.setName("id").setDescription("削除するスケジュールID").setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository,
  scheduler: Scheduler
): Promise<void> {
  const scheduleId = interaction.options.getInteger("id", true);

  const deleted = repo.deleteSchedule(scheduleId);

  if (!deleted) {
    await interaction.reply({
      content: `❌ スケジュールID ${scheduleId} が見つかりませんでした\n\`/${COMMAND_PREFIX}list\` コマンドでスケジュールIDを確認してください`,
      ephemeral: true,
    });
    return;
  }

  scheduler.registerAll();

  await interaction.reply(`✅ スケジュールID ${scheduleId} を削除しました`);
}
