import { Client, GatewayIntentBits, Events } from "discord.js";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config, COMMAND_PREFIX } from "./config";
import { migrate } from "./db/schema";
import { Repository } from "./db/repository";
import { Scheduler } from "./services/scheduler";
import * as addStock from "./commands/add-stock";
import * as removeStock from "./commands/remove-stock";
import * as setSchedule from "./commands/set-schedule";
import * as removeSchedule from "./commands/remove-schedule";
import * as list from "./commands/list";
import * as help from "./commands/help";
import * as quote from "./commands/quote";

// コマンドIDのキャッシュ
export const commandIds = new Map<string, string>();

// DB初期化
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(config.dbPath);
migrate(db);
const repo = new Repository(db);

// Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let scheduler: Scheduler;

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  // スラッシュコマンド登録
  const { REST, Routes } = await import("discord.js");
  const rest = new REST({ version: "10" }).setToken(config.botToken);
  const commands = [
    addStock.data.toJSON(),
    removeStock.data.toJSON(),
    setSchedule.data.toJSON(),
    removeSchedule.data.toJSON(),
    list.data.toJSON(),
    help.data.toJSON(),
    quote.data.toJSON(),
  ];
  const registeredCommands = (await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands,
  })) as { id: string; name: string }[];

  // コマンドIDをキャッシュ
  for (const cmd of registeredCommands) {
    commandIds.set(cmd.name, cmd.id);
  }

  console.log(`${commands.length} slash commands registered`);

  scheduler = new Scheduler(client, repo);
  scheduler.registerAll();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case COMMAND_PREFIX + "add-stock":
        await addStock.execute(interaction, repo);
        break;
      case COMMAND_PREFIX + "remove-stock":
        await removeStock.execute(interaction, repo);
        break;
      case COMMAND_PREFIX + "set-schedule":
        await setSchedule.execute(interaction, repo, scheduler);
        break;
      case COMMAND_PREFIX + "remove-schedule":
        await removeSchedule.execute(interaction, repo, scheduler);
        break;
      case COMMAND_PREFIX + "list":
        await list.execute(interaction, repo);
        break;
      case COMMAND_PREFIX + "help":
        await help.execute(interaction, commandIds);
        break;
      case COMMAND_PREFIX + "quote":
        await quote.execute(interaction, repo);
        break;
      default:
        await interaction.reply({
          content: "不明なコマンドです。",
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error(`Command error [${interaction.commandName}]:`, error);
    const reply = {
      content: "⚠️ コマンドの実行中にエラーが発生しました。",
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  scheduler?.clearAll();
  db.close();
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  scheduler?.clearAll();
  db.close();
  client.destroy();
  process.exit(0);
});

client.login(config.botToken);
