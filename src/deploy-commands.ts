import { REST, Routes } from "discord.js";
import { config } from "./config";
import * as addStock from "./commands/add-stock";
import * as removeStock from "./commands/remove-stock";
import * as setSchedule from "./commands/set-schedule";
import * as removeSchedule from "./commands/remove-schedule";
import * as list from "./commands/list";
import * as help from "./commands/help";

const commands = [
  addStock.data.toJSON(),
  removeStock.data.toJSON(),
  setSchedule.data.toJSON(),
  removeSchedule.data.toJSON(),
  list.data.toJSON(),
  help.data.toJSON(),
];

async function main() {
  const rest = new REST({ version: "10" }).setToken(config.botToken);

  console.log(`Registering ${commands.length} slash commands...`);

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands,
  });

  console.log("Slash commands registered successfully.");
}

main().catch(console.error);
