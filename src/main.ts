import { MarkdownView, Plugin } from "obsidian";
import {
	type ClickToEditSettings,
	ClickToEditSettingTab,
	DEFAULT_SETTINGS,
} from "./settings";
import { registerReaderModeOnOpen } from "./reader-mode";
import { registerClickToEdit } from "./click-handler";

export default class ClickToEditPlugin extends Plugin {
	settings: ClickToEditSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		registerReaderModeOnOpen(this, () => this.settings);
		registerClickToEdit(this, () => this.settings);

		this.addCommand({
			id: "switch-active-note-to-reader-mode",
			name: "Switch active note to reader mode",
			checkCallback: (checking) => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return false;
				const state = view.getState();
				if (state.mode === "preview") return false;
				if (checking) return true;
				void view.setState(
					{ ...state, mode: "preview" },
					{ history: false }
				);
				return true;
			},
		});

		this.addSettingTab(new ClickToEditSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as
			| Partial<ClickToEditSettings>
			| null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
