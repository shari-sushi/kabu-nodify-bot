import * as addStock from "./add-stock";
import * as removeStock from "./remove-stock";
import * as setSchedule from "./set-schedule";
import * as removeSchedule from "./remove-schedule";
import * as list from "./list";
import * as help from "./help";
import * as quote from "./quote";

export const allCommands = [
  addStock.data,
  removeStock.data,
  setSchedule.data,
  removeSchedule.data,
  list.data,
  help.data,
  quote.data,
];
