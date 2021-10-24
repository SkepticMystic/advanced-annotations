import { App, PluginSettingTab } from "obsidian";
import MyPlugin from "./main";

export class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    
    
    
    
    
    
  }
}
