import { App, Modal, Notice, Plugin, TFile } from "obsidian";
import { SampleSettingTab } from "./SampleSettingTab";
import { copy } from "./util";

interface MyPluginSettings {}

const DEFAULT_SETTINGS: MyPluginSettings = {};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();

    this.addCommand({
      id: "run-formatter",
      name: "Run Formatter on Current Note & Copy to Clipboard",
      callback: async () => {
        const currFile = this.app.workspace.getActiveFile();
        if (currFile instanceof TFile) {
          const content = await this.app.vault.read(currFile);
          this.runFormatter(content);
        } else {
          new Notice(
            "You must be focussed on a markdown note to run this command."
          );
        }
      },
    });

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  specialStarts = ["- #", "- %", "- ?", "- !", "- +", "- ="];

  splitDropMerge = (line: string, split: string) =>
    line.split(split).slice(1).join(split).trim();

  lineBeforeI(lines: string[], type: string, i: number, before = 0) {
    const copy = [...lines];
    return copy
      .reverse()
      .slice(copy.length - 1 + before - i)
      .find((line) => line.startsWith(type));
  }

  lineAfterI(lines: string[], type: string, i: number, after = 0) {
    const copy = [...lines];
    return copy.slice(i + after).find((line) => line.startsWith(type));
  }

  runFormatter(content: string) {
    let output = "";
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    const keywords: string[] = [];
    lines.forEach((line, i) => {
      try {
        const quoteBefore = this.lineBeforeI(lines, "> ", i, 1);
        if (
          !this.specialStarts.some((start: string) => line.startsWith(start)) &&
          !this.specialStarts.some((start: string) =>
            lines[i + 1].startsWith(start)
          ) &&
          (!lines[i - 1] || !lines[i - 1].startsWith("- +"))
        ) {
          output += line + "\n\n";
        }
        //
        else if (line.startsWith("- % ")) {
          const com = this.splitDropMerge(line, "- % ");
          output += `%%% ${com}\n${quoteBefore}\n\n`;
        }
        //
        else if (line.startsWith("- +")) {
          const quoteAfter = this.lineAfterI(lines, "> ", i);
          output += `${quoteBefore} ${this.splitDropMerge(
            quoteAfter,
            ">"
          )}\n\n`;
        }
        //
        else if (line.startsWith("- ?")) {
          output += `- [ ] ${this.splitDropMerge(quoteBefore, ">")}\n\n`;
        }
        //
        else if (line.match(/- #+/)) {
          const headingLevel = line.match(/- (#+)/)[1];
          output += `${headingLevel} ${this.splitDropMerge(
            quoteBefore,
            ">"
          )}\n\n`;
        }
        //
        else if (line.startsWith("- !")) {
          output += `#${this.splitDropMerge(quoteBefore, ">")}\n\n`;
        }
        //
        else if (line.startsWith("- =")) {
          keywords.push(this.splitDropMerge(quoteBefore, ">"));
        }
        //
        else {
        }
      } catch (e) {
        console.log({ line, e });
      }
    });

    let result = output;
    if (keywords.length) {
      const outputLines = output.split("\n");
      const keywordFormat = `\nkeywords:: ${keywords.join(", ")}\n`;
      if (outputLines[0] === "---") {
        const endOfYaml =
          outputLines.slice(1).findIndex((line) => line === "---") + 2;
        outputLines.splice(endOfYaml, 0, keywordFormat);
      } else {
        outputLines.splice(0, 0, keywordFormat);
      }

      result = outputLines.join("\n");
    }
    console.log({ result });
    await copy(result);
  }

  onunload() {
    console.log("unloading plugin");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.setText("Woah!");
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
