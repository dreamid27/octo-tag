#!/usr/bin/env node
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import git from "./lib/git.js";
import inquirer from "./lib/inquirer.js";
import minimist from "minimist";

clear();

console.log(
  chalk.yellow(figlet.textSync("Octo Tag", { horizontalLayout: "full" }))
);

const run = async () => {
  try {
    const argParams = minimist(process.argv.slice(2));

    let environmentUser = await inquirer.askEnvironment();
    environmentUser = {
      ...environmentUser,
      prefix: argParams.prefix || "v",
    };
    const tagging = await git.getNextTag(environmentUser);
    const isAddTag = await inquirer.askAddTag(tagging.nextTag);
    if (isAddTag.tag) {
      await git.addTagHistory({
        tagName: tagging.nextTag,
        commitId: environmentUser.commit,
      });
    }

    const isPushTag = await inquirer.askPushTag(tagging.nextTag);
    console.log(isPushTag, "ispush tag");

    if (isPushTag.isPush) {
      await git.addTagToOrigin({ tagName: tagging.nextTag });
    }
  } catch (err) {
    console.log(err);
  }
};

run();
