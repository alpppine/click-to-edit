import { MarkdownView, Plugin, TFile } from "obsidian";
import type { ClickToEditSettings } from "./settings";

export function registerReaderModeOnOpen(
	plugin: Plugin,
	getSettings: () => ClickToEditSettings
): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", async (file) => {
			const settings = getSettings();
			if (!settings.openInReaderMode) return;
			if (!file || !(file instanceof TFile)) return;
			if (file.extension !== "md") return;

			const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view || view.file?.path !== file.path) return;

			if (settings.skipEmptyNotes) {
				const content = view.editor?.getValue() ?? "";
				if (content.trim().length === 0) return;
			}

			const state = view.getState();
			if (state.mode === "preview") return;

			await view.setState(
				{ ...state, mode: "preview" },
				{ history: false }
			);
		})
	);
}
