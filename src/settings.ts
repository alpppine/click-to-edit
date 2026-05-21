import { App, PluginSettingTab, Setting } from "obsidian";
import type ClickToEditPlugin from "./main";

export type CursorPosition = "bottom" | "top" | "click";

export interface ClickToEditSettings {
	openInReaderMode: boolean;
	skipEmptyNotes: boolean;
	cursorPosition: CursorPosition;
}

export const DEFAULT_SETTINGS: ClickToEditSettings = {
	openInReaderMode: true,
	skipEmptyNotes: true,
	cursorPosition: "bottom",
};

export class ClickToEditSettingTab extends PluginSettingTab {
	plugin: ClickToEditPlugin;

	constructor(app: App, plugin: ClickToEditPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Open notes in reader mode")
			.setDesc(
				"When a note is opened, automatically switch it to reader mode."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openInReaderMode)
					.onChange(async (value) => {
						this.plugin.settings.openInReaderMode = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Skip empty notes")
			.setDesc(
				"Don't force reader mode on notes that have no content yet."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.skipEmptyNotes)
					.onChange(async (value) => {
						this.plugin.settings.skipEmptyNotes = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Cursor position on edit")
			.setDesc(
				"Where to place the cursor when switching from reader to edit mode."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("bottom", "Bottom of note")
					.addOption("top", "Top of note")
					.addOption("click", "Where you clicked")
					.setValue(this.plugin.settings.cursorPosition)
					.onChange(async (value: CursorPosition) => {
						this.plugin.settings.cursorPosition = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
