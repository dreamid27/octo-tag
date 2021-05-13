import inquirer from "inquirer";
import git from "./git.js";

const envList = ["staging", "production", "beta"];
const semanticList = ["patch", "minor", "major"];

export default {
  askEnvironment: async () => {
    const commitList = await git.getCommitList();

    const questions = [
      {
        name: "environment",
        type: "list",
        message: "Choose environment :",
        choices: envList,
        validate: function (value) {
          if (value.length) {
            return true;
          } else {
            return "Please choose the environment";
          }
        },
      },
      {
        name: "semanticType",
        type: "list",
        message: "Choose semantic version type :",
        choices: semanticList,
        validate: function (value) {
          if (value.length) {
            return true;
          } else {
            return "Please choose semantic version ";
          }
        },
      },
      {
        name: "commit",
        type: "list",
        message: "Choose commit id :",
        choices: commitList,
        validate: function (value) {
          if (value.length) {
            return true;
          } else {
            return "Please choose commit id";
          }
        },
        filter: function (value) {
          const tempValue = value.split(":")[0];
          return tempValue;
        },
      },
    ];

    return inquirer.prompt(questions);
  },
  askAddTag: async (tag) => {
    const questions = [
      {
        name: "tag",
        type: "input",
        message: "Are you sure to add tag ?",
        default: tag,
      },
    ];

    return inquirer.prompt(questions);
  },
  askPushTag: async (tag) => {
    const questions = [
      {
        name: "isPush",
        type: "confirm",
        message: `Push tag ${tag} to remote :`,
        default: true,
      },
    ];

    return inquirer.prompt(questions);
  },
};
