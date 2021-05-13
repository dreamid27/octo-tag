import CLI from "clui";
import simpleGit from "simple-git/promise.js";

const git = simpleGit();
const Spinner = CLI.Spinner;

const getLatestTag = async (tag, isCheckAlpha = false) => {
  const status = new Spinner("Fetch latest tag from remote...");
  status.start();

  try {
    let tagsList = await git.tags([`--sort=-v:refname`, `-l`, tag]);

    const tagListAll = tagsList.all;

    //get latest real tag not nomad/alpha tag
    let filteredTag = tagListAll.filter(
      (curTag) => curTag.indexOf("nomad") === -1
    );

    if (isCheckAlpha)
      filteredTag = filteredTag.filter(
        (curTag) => curTag.indexOf("alpha") === -1
      );

    if (filteredTag.length > 0) {
      return filteredTag[0];
    }

    //if the initial tagging
    const hasAlpha = tag.indexOf("alpha") !== -1;
    let tempTag = tag;
    if (hasAlpha) tempTag = tempTag.replace("alpha*", "alpha.0");

    tempTag = tempTag.replace("*", "0.0.0");
    return tempTag;
  } catch (err) {
    console.log(err);
  } finally {
    status.stop();
  }
};

export default {
  getLatestTag: getLatestTag,
  getNextTag: async ({
    environment = "staging",
    semanticType = "patch",
    prefix = "v",
  }) => {
    const status = new Spinner("Getting next tag...");
    status.start();

    try {
      await git.fetch();
      const detailTagging = {};

      const tagMaster = `${prefix}*`;
      const tagStaging = `${prefix}*-alpha*`;
      const latestTagInMaster = await getLatestTag(tagMaster, true);
      const latestTagInStaging = await getLatestTag(tagStaging);

      const getNextVersion = (tagName, semVer) => {
        const versionNumber = tagName.replace(prefix, "");
        const semanticVersion = versionNumber.split("."); //1.6.3 --> [1, 6, 3];
        //Major
        let lastVersion = "";
        if (semanticVersion.length === 3) {
          switch (semanticType) {
            case "major":
              lastVersion = Number(semanticVersion[0]);
              semanticVersion[0] = lastVersion + 1;
              break;
            case "minor":
              lastVersion = Number(semanticVersion[1]);
              semanticVersion[1] = lastVersion + 1;
              break;
            default:
              //patch:
              lastVersion = Number(semanticVersion[2]);
              semanticVersion[2] = lastVersion + 1;
              break;
          }
        } else {
          lastVersion = Number(semanticVersion[semanticVersion.length - 1]) + 1;
          semanticVersion[semanticVersion.length - 1] = semVer
            ? semVer
            : lastVersion;
        }

        const strSemanticVersion = semanticVersion.join(".");
        return `${prefix}${strSemanticVersion}`;
      };

      // tag version di staging sama dengan yg master,
      const tagIsSame = latestTagInStaging.indexOf(latestTagInMaster) != -1;
      const isStaging = environment === "staging";
      // Patch Version Cases 1.6.[3] <--
      // Minor Version Cases 1.[6].0 <--
      // Major Version Cases [1].[6].0 <--

      if (tagIsSame) {
        const finalTag = getNextVersion(latestTagInMaster);

        //staging
        if (isStaging) {
          let finalTagStagingRep = latestTagInStaging.replace(
            latestTagInMaster,
            finalTag
          );
          const finalTagStaging = getNextVersion(finalTagStagingRep, 1);
          detailTagging.nextTag = finalTagStaging;
          detailTagging.lastTag = latestTagInStaging;
        } else {
          detailTagging.nextTag = finalTag;
        }
      } else {
        //Kalau beda, master < staging
        if (isStaging) {
          const finalTag = getNextVersion(latestTagInStaging);
          detailTagging.nextTag = finalTag;
          detailTagging.lastTag = latestTagInStaging;
        } else {
          const finalTag = getNextVersion(latestTagInMaster);
          detailTagging.nextTag = finalTag;
          detailTagging.lastTag = latestTagInMaster;
        }
      }

      console.log("Succesfully get next tag...");
      return detailTagging;
    } catch (err) {
      console.log(err);
    } finally {
      status.stop();
    }
  },
  getCommitList: async () => {
    const status = new Spinner("Fetch 10 latest commit from remote...");
    status.start();

    try {
      const commit = await git.log(["-10"]);
      const commitList = commit.all;
      const selectCommitOpt = commitList.map((obj, i) => {
        return `${obj.hash}: ${i === 0 ? `(latest)` : ""} ${
          obj.message
        }, author: ${obj.author_name}, date: ${obj.date} `;
      });

      return selectCommitOpt;
    } catch (err) {
      console.log(err, "err");
    } finally {
      status.stop();
    }
  },
  addTagHistory: async ({ tagName, commitId }) => {
    const status = new Spinner(`Add tag ${tagName} as locally...`);
    status.start();
    try {
      await git.tag([tagName, commitId]);
      console.log(`Succesfully add tag ${tagName} as locally`);
    } catch (err) {
      console.log(err);
    } finally {
      status.stop();
    }
  },
  addTagToOrigin: async ({ tagName }) => {
    const status = new Spinner(`push tag ${tagName} to origin`);
    status.start();
    try {
      await git.push(["origin", tagName]);
      console.log(`Succesfully push tag ${tagName} as origin`);
    } catch (err) {
      console.log(err);
    } finally {
      status.stop();
    }
  },
};
