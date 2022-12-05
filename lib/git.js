import CLI from "clui";
import simpleGit from "simple-git/promise.js";

const git = simpleGit();
const Spinner = CLI.Spinner;

const environemntList = {
  staging: "staging",
  beta: "beta",
  production: "production",
};

const getLatestTag = async (tag, environment = "production") => {
  const status = new Spinner("Fetch latest tag from remote...");
  status.start();

  try {
    let tagsList = await git.tags([`--sort=-v:refname`, `-l`, tag]);

    const tagListAll = tagsList.all;

    //get latest real tag not nomad/alpha tag
    let filteredTag = tagListAll.filter(
      (curTag) => curTag.indexOf("nomad") === -1
    );

    switch (environment) {
      case environemntList.staging:
        filteredTag = filteredTag.filter(
          (curTag) => curTag.indexOf("beta") === -1
        );
        break;
      case environemntList.beta:
        filteredTag = filteredTag.filter(
          (curTag) => curTag.indexOf("alpha") === -1
        );
        break;
      default:
        filteredTag = filteredTag.filter(
          (curTag) =>
            curTag.indexOf("alpha") === -1 && curTag.indexOf("beta") === -1
        );
        break;
    }

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
      const tagBeta = `${prefix}*-beta*`;
      const latestTagInMaster = await getLatestTag(tagMaster);
      const latestTagInStaging = await getLatestTag(tagStaging, environment);
      const latestTagInBeta = await getLatestTag(tagBeta, environment);

      //v1.0.1-alpha.1
      //v1.0.1
      const getNextVersion = ({ currentTag, currentTagMaster }) => {
        const checkOutdated = (currentTag, currentTagMaster) => {
          const versionNumber = currentTag
            .replace("-alpha", "")
            .replace("-beta", "")
            .replace(prefix, "");

          const versionNumberMaster = currentTagMaster.replace(prefix, "");

          const currentSemanticVer = versionNumber.split(".");
          const currentSemanticVerMaster = versionNumberMaster.split(".");
          const majorVersion = Number(currentSemanticVer[0]);
          const majorVersionMaster = Number(currentSemanticVerMaster[0]);

          if (majorVersion < majorVersionMaster) {
            return true;
          } else if (majorVersion > majorVersionMaster) {
            return false;
          }

          const minorVersion = Number(currentSemanticVer[1]);
          const minorVersionMaster = Number(currentSemanticVerMaster[1]);

          if (minorVersion < minorVersionMaster) {
            return true;
          } else if (minorVersion > minorVersionMaster) {
            return false;
          }

          const patchVersion = Number(currentSemanticVer[2]);
          const patchVersionMaster = Number(currentSemanticVerMaster[2]);

          if (patchVersion < patchVersionMaster) {
            return true;
          } else if (patchVersion > patchVersionMaster) {
            return false;
          }

          return false;
        };

        let versionNumber = currentTag.replace(prefix, "");
        let semanticVersion = versionNumber.split("."); //1.6.3 --> [1, 6, 3];

        const isOutdated = checkOutdated(currentTag, currentTagMaster);

        if (isOutdated) {
          versionNumber = currentTagMaster.replace(prefix, "");
          semanticVersion = versionNumber.split("."); //1.6.3 --> [1, 6, 3];
        }

        //Major
        let lastVersion = "";
        if (semanticVersion.length === 3) {
          switch (semanticType) {
            case "major":
              lastVersion = Number(semanticVersion[0]);
              semanticVersion[0] = lastVersion + 1;
              semanticVersion[1] = 0;
              semanticVersion[2] = 0;
              break;
            case "minor":
              lastVersion = Number(semanticVersion[1]);
              semanticVersion[1] = lastVersion + 1;
              semanticVersion[2] = 0;
              break;
            default:
              //patch:
              lastVersion = Number(semanticVersion[2]);
              semanticVersion[2] = lastVersion + 1;
              break;
          }
        } else {
          lastVersion = Number(semanticVersion[semanticVersion.length - 1]) + 1;
          semanticVersion[semanticVersion.length - 1] = lastVersion;
        }

        const strSemanticVersion = semanticVersion.join(".");
        let finalVersion = `${prefix}${strSemanticVersion}`;

        if (isOutdated) {
          switch (environment) {
            case environemntList.staging:
              finalVersion = `${finalVersion}-alpha.1`;
              break;
            default:
              finalVersion = `${finalVersion}-beta.1`;
              break;
          }
        }

        return finalVersion;
      };

      // tag version di staging sama dengan yg master,
      const isStaging = environment === environemntList.staging;
      const isBeta = environment === environemntList.beta;

      // Patch Version Cases 1.6.[3] <--
      // Minor Version Cases 1.[6].0 <--
      // Major Version Cases [1].[6].0 <--

      let currentTag = latestTagInMaster;

      switch (environment) {
        case environemntList.beta:
          currentTag = latestTagInBeta;
          break;
        case environemntList.staging:
          currentTag = latestTagInStaging;
          break;
        default:
          currentTag = latestTagInMaster;
          break;
      }

      if (isStaging || isBeta) {
        const tagIsSame = currentTag.indexOf(latestTagInMaster) !== -1;

        if (tagIsSame) {
          const finalTag = getNextVersion({
            currentTag: latestTagInMaster,
            currentTagMaster: latestTagInMaster,
          });

          let finalTagStagingRep = finalTag;

          switch (environment) {
            case environemntList.staging:
              finalTagStagingRep = `${finalTagStagingRep}-alpha.0`;
              break;
            default:
              finalTagStagingRep = `${finalTagStagingRep}-beta.0`;
              break;
          }

          const finalTagStaging = getNextVersion({
            currentTag: finalTagStagingRep,
            currentTagMaster: latestTagInMaster,
          });

          detailTagging.nextTag = finalTagStaging;
          detailTagging.lastTag = latestTagInStaging;
        } else {
          //Check version is outdated atau malah terbaru.
          const finalTag = getNextVersion({
            currentTag,
            currentTagMaster: latestTagInMaster,
          });
          detailTagging.nextTag = finalTag;
          detailTagging.lastTag = latestTagInStaging;
        }
      } else {
        const finalTag = getNextVersion({
          currentTag: latestTagInMaster,
          currentTagMaster: latestTagInMaster,
        });
        detailTagging.nextTag = finalTag;
        detailTagging.lastTag = latestTagInMaster;
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
