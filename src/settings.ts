import {
	App,
	PluginSettingTab,
	Setting,
	type SettingDefinitionItem,
} from "obsidian";
import type ClickToEditPlugin from "./main";

export type CursorPosition = "bottom" | "top" | "click";
export type ClickTrigger = "single" | "double";

export interface ClickToEditSettings {
	openInReaderMode: boolean;
	skipEmptyNotes: boolean;
	clickTrigger: ClickTrigger;
	cursorPosition: CursorPosition;
	disableOnMobile: boolean;
}

export const DEFAULT_SETTINGS: ClickToEditSettings = {
	openInReaderMode: true,
	skipEmptyNotes: true,
	clickTrigger: "single",
	cursorPosition: "bottom",
	disableOnMobile: true,
};

export class ClickToEditSettingTab extends PluginSettingTab {
	plugin: ClickToEditPlugin;

	constructor(app: App, plugin: ClickToEditPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Obsidian 1.13.0+: renders settings and indexes them for search.
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: "Open notes in reader mode",
				desc: "When a note is opened, automatically switch it to reader mode.",
				control: {
					type: "toggle",
					key: "openInReaderMode",
				},
			},
			{
				name: "Skip empty notes",
				desc: "Don't force reader mode on notes that have no content yet.",
				control: {
					type: "toggle",
					key: "skipEmptyNotes",
				},
			},
			{
				name: "Disable on mobile",
				desc: "Don't auto-switch to reader mode or click-to-edit on mobile devices.",
				control: {
					type: "toggle",
					key: "disableOnMobile",
				},
			},
			{
				name: "Click trigger",
				desc: "Use a single click to edit, or double clicks to toggle between reader and edit mode.",
				control: {
					type: "dropdown",
					key: "clickTrigger",
					defaultValue: DEFAULT_SETTINGS.clickTrigger,
					options: {
						single: "Single click",
						double: "Double click",
					},
				},
			},
			{
				name: "Cursor position on edit",
				desc: "Where to place the cursor when switching from reader to edit mode.",
				control: {
					type: "dropdown",
					key: "cursorPosition",
					defaultValue: DEFAULT_SETTINGS.cursorPosition,
					options: {
						bottom: "Bottom of note",
						top: "Top of note",
						click: "Where you clicked",
					},
				},
			},
		];
	}

	// Obsidian < 1.13.0: imperative fallback (skipped when getSettingDefinitions
	// returns a non-empty array on 1.13.0+).
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
			.setName("Disable on mobile")
			.setDesc(
				"Don't auto-switch to reader mode or click-to-edit on mobile devices."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.disableOnMobile)
					.onChange(async (value) => {
						this.plugin.settings.disableOnMobile = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Click trigger")
			.setDesc(
				"Use a single click to edit, or double clicks to toggle between reader and edit mode."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("single", "Single click")
					.addOption("double", "Double click")
					.setValue(this.plugin.settings.clickTrigger)
					.onChange(async (value: string) => {
						this.plugin.settings.clickTrigger = value as ClickTrigger;
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
					.onChange(async (value: string) => {
						this.plugin.settings.cursorPosition =
							value as CursorPosition;
						await this.plugin.saveSettings();
					})
			);
	}
}
