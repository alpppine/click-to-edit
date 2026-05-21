import {
	type Editor,
	MarkdownView,
	Plugin,
	type WorkspaceLeaf,
} from "obsidian";
import type { ClickToEditSettings } from "./settings";

const INTERACTIVE_SELECTOR = [
	"a",
	".internal-link",
	".external-link",
	".tag",
	"button",
	"input",
	"textarea",
	"select",
	".task-list-item-checkbox",
	".callout-fold",
	".copy-code-button",
	".embed-title",
	'[contenteditable="true"]',
].join(",");

export function registerClickToEdit(
	plugin: Plugin,
	getSettings: () => ClickToEditSettings
): void {
	plugin.registerDomEvent(
		document,
		"click",
		(evt: MouseEvent) => {
			handleClick(plugin, getSettings(), evt);
		}
	);
}

function handleClick(
	plugin: Plugin,
	settings: ClickToEditSettings,
	evt: MouseEvent
): void {
	if (evt.button !== 0) return;
	if (evt.defaultPrevented) return;
	if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;

	const target = evt.target;
	if (!(target instanceof HTMLElement)) return;
	if (target.closest(INTERACTIVE_SELECTOR)) return;

	const selection = target.ownerDocument.getSelection();
	if (selection && selection.toString().length > 0) return;

	const previewContainer = target.closest(".markdown-reading-view");
	if (!previewContainer) return;

	const leaf = findLeafForElement(plugin, previewContainer);
	if (!leaf) return;

	const view = leaf.view as MarkdownView;
	const state = view.getState();
	if (state.mode !== "preview") return;

	const clickedLine = settings.cursorPosition === "click"
		? findClickedLine(target)
		: null;

	void view
		.setState({ ...state, mode: "source" }, { history: false })
		.then(() => {
			placeCursor(view.editor, settings.cursorPosition, clickedLine);
		});
}

function findLeafForElement(
	plugin: Plugin,
	element: Element
): WorkspaceLeaf | null {
	let found: WorkspaceLeaf | null = null;
	plugin.app.workspace.iterateAllLeaves((leaf) => {
		if (found) return;
		if (
			leaf.view instanceof MarkdownView &&
			leaf.view.containerEl.contains(element)
		) {
			found = leaf;
		}
	});
	return found;
}

function findClickedLine(target: HTMLElement): number | null {
	const lineEl = target.closest<HTMLElement>("[data-line]");
	if (!lineEl) return null;
	const raw = lineEl.getAttribute("data-line");
	if (raw === null) return null;
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

function placeCursor(
	editor: Editor | undefined,
	position: ClickToEditSettings["cursorPosition"],
	clickedLine: number | null
): void {
	if (!editor) return;

	if (position === "top") {
		editor.setCursor({ line: 0, ch: 0 });
		editor.focus();
		return;
	}

	if (position === "click" && clickedLine !== null) {
		const line = Math.min(Math.max(clickedLine, 0), editor.lastLine());
		const ch = editor.getLine(line).length;
		editor.setCursor({ line, ch });
		editor.focus();
		return;
	}

	const lastLine = editor.lastLine();
	const lastCh = editor.getLine(lastLine).length;
	editor.setCursor({ line: lastLine, ch: lastCh });
	editor.focus();
}
