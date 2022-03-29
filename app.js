const puppeteer = require('puppeteer');
const fs = require("fs");
const path = require("path")

const BaseURL = 'https://docs.microsoft.com/en-us/cli/azure';
const Dir = path.join(__dirname, "az");

const removeLastPeriodOfSentence = (string) => {
  return string.endsWith(".") ? string.slice(0, string.length - 2) : string;
}


(async () => {
  const browser = await puppeteer.launch("~/Library/Application Support / Google / Chrome");
  const page = await browser.newPage();
  await page.goto(`${BaseURL}/reference-index?view=azure-cli-latest`);

  const subCommands = await page.$$eval('tr', (element) => element.reduce((acc, cv) => {

    const args1Name = cv.children[0].innerText.split(' ')[1];
    const args1Description = cv.children[1].innerText.replaceAll(".", (period, index, text) => {
      if (index === text.length - 1) return "";
      return period;
    });

    const loadSpec = `az/${args1Name}`;
    acc.push({ name: args1Name.trim(), description: args1Description.trim(), loadSpec });
    return acc;
  }, []));

  await page.close();

  // The following generate az.ts main azure command file

  fs.writeFileSync("az.ts", `const completionSpec: Fig.Spec = {
name: "az",
description: "",
subcommands: ${JSON.stringify(subCommands)}
}
export default completionSpec;`)

console.log("========== az.ts Created ==========")

  if (!fs.existsSync(Dir)){
    fs.mkdirSync(Dir);
  }


  for (const command of subCommands) {
    const arg2URL = `${BaseURL}/${command.name}`;
    const sub_subCommands = await generateAutoComplete(arg2URL, browser);

    const template = `const completionSpec: Fig.Spec = {
      name: "${command.name}",
      description: "${command.description}",
      subcommands: ${JSON.stringify(sub_subCommands)}
      }

      export default completionSpec;`;

      fs.writeFile(Dir + `/${command.name}.ts`, template, (err) => {
        if (err) throw err;
        console.log(`File is created successfully for: ${command.name}`);
      })
  }

  await browser.close();
})();

async function generateAutoComplete (arg2URL, browser) {
  const arg2Page = await browser.newPage();
  await arg2Page.goto(arg2URL + '/?view=azure-cli-latest');

  const arg2Command = await arg2Page.$$eval('tr', (element) => element.reduce((acc, cv, index) => {
    const arg2Name = cv.children[0].innerText.split(' ')[2];
    const description = cv.children[1].innerText.replaceAll(".", (period, index, text) => {
      if (index === text.length - 1) return "";
      return period;
    }).trim();
    const arg3Name = cv.children[0].innerText.split(' ')[3];


    if (arg3Name && acc.some((arg2Command) => arg2Command.name === arg2Name)) {
      const arg2Index = acc.findIndex((arg2) => arg2.name === arg2Name);

      if (acc[arg2Index].subcommands) {
        if (acc[arg2Index].subcommands.some((arg3Command) => arg3Command.name === arg3Name)) {
          const arg4Name = cv.children[0].innerText.split(' ')[4];

          if (arg4Name && acc[arg2Index].subcommands.some((arg3Command) => arg3Command.name === arg3Name)) {
            const arg3Index = acc[arg2Index].subcommands.findIndex((arg3Command) => arg3Command.name === arg3Name);

            if (acc[arg2Index].subcommands[arg3Index].subcommands) {

              const arg5Name = cv.children[0].innerText.split(' ')[5];

              if (arg5Name && acc[arg2Index].subcommands[arg3Index].subcommands.some((arg4Command) => arg4Command.name === arg4Name)) {
                const arg4Index = acc[arg2Index].subcommands[arg3Index].subcommands.findIndex((arg4Command) => arg4Command.name === arg4Name);

                if (acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands) {
                  const arg6Name = cv.children[0].innerText.split(' ')[6];

                  // Args 6

                  if (arg6Name && acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands.some((arg5Command) => arg5Command.name === arg5Name)) {
                    const arg5Index = acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands.findIndex((arg5Command) => arg5Command.name === arg5Name);
                    if (acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands) {

                      // Args 7
                      const arg7Name = cv.children[0].innerText.split(' ')[7];

                      if (arg7Name && acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands.some((arg6Command) => arg6Command.name === arg6Name)) {
                        const arg6Index = acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands.findIndex((arg6Command) => arg6Command.name === arg6Name)

                        if (acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands[arg6Index].subcommands) {
                          acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands[arg6Index].subcommands.push({ name: arg7Name, description: description });
                        } else {
                          acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands[arg6Index].subcommands = [{ name: arg7Name, description: description }];
                        }

                      } else {
                        acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands.push({ name: arg6Name, description: description });
                      }


                    } else {
                      acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands[arg5Index].subcommands = [{ name: arg6Name, description: description }];
                    }
                  } else {
                    acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands.push({ name: arg5Name, description: description });
                  }

                  //

                } else {
                  acc[arg2Index].subcommands[arg3Index].subcommands[arg4Index].subcommands = [{ name: arg5Name, description: description }];
                }


              } else {
                acc[arg2Index].subcommands[arg3Index].subcommands.push({ name: arg4Name, description: description });
              }

            } else {
              acc[arg2Index].subcommands[arg3Index].subcommands = [{ name: arg4Name, description: description }];
            }
          }

        } else {
          acc[arg2Index].subcommands.push({ name: arg3Name, description: description });
        }
      } else {
        acc[arg2Index].subcommands = [{ name: arg3Name, description: description }];
      }

    } else {
      acc.push({ name: arg2Name, description: description });
    }

    return acc;
  }, []));

  await arg2Page.close();

  return arg2Command;
}
