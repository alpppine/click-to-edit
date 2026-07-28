import {
	type Editor,
	MarkdownView,
	Platform,
	Plugin,
	type WorkspaceLeaf,
} from "obsidian";
import type { ClickToEditSettings, ClickTrigger } from "./settings";

const CONTENTEDITABLE_SELECTOR = '[contenteditable="true"]';

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
	CONTENTEDITABLE_SELECTOR,
].join(",");

// How much surrounding text we capture around the click point.
// Bigger snippets are more likely to match uniquely; smaller snippets are
// more tolerant of markdown rendering that drops/changes characters.
const SNIPPET_BEFORE_CHARS = 80;
const SNIPPET_AFTER_CHARS = 40;
const MIN_SNIPPET_CHARS = 6;

interface ClickAnchor {
	snippet: string;
	offsetInSnippet: number;
}

const DOC_BOUND_ATTR = "data-click-to-edit-bound";

export function registerClickToEdit(
	plugin: Plugin,
	getSettings: () => ClickToEditSettings
): void {
	const boundContainers = new WeakSet<HTMLElement>();
	const handledEvents = new WeakSet<Event>();

	// Two independent delivery paths guard against Obsidian's pop-out window
	// lifecycle; a per-event guard keeps a click from being handled twice.
	const onEvent = (evt: MouseEvent, trigger: ClickTrigger): void => {
		if (handledEvents.has(evt)) return;
		handledEvents.add(evt);
		handleClick(plugin, getSettings(), evt, trigger);
	};

	const listen = (el: HTMLElement | Document): void => {
		// The Document and HTMLElement overloads of registerDomEvent are
		// identical at runtime; collapse them behind one cast.
		const target = el as HTMLElement;
		plugin.registerDomEvent(target, "click", (evt: MouseEvent) => {
			onEvent(evt, "single");
		});
		plugin.registerDomEvent(target, "dblclick", (evt: MouseEvent) => {
			onEvent(evt, "double");
		});
	};

	// Path 1: listeners on each view's own container element. Element-bound
	// listeners travel with the leaf DOM when it is adopted into a pop-out
	// document.
	const bindView = (view: MarkdownView): void => {
		const containerEl = view.containerEl;
		if (boundContainers.has(containerEl)) return;
		boundContainers.add(containerEl);
		listen(containerEl);
	};

	// Path 2: listeners on each window's document. Creating a pop-out can
	// rebuild its document, which erases listeners but also replaces the
	// documentElement carrying the marker attribute — so a wiped document
	// re-registers on the next workspace event instead of being deduped
	// against a stale identity.
	const bindDocument = (doc: Document): void => {
		if (doc.documentElement.hasAttribute(DOC_BOUND_ATTR)) return;
		doc.documentElement.setAttribute(DOC_BOUND_ATTR, "1");
		listen(doc);
	};

	const bindLeafView = (view: MarkdownView): void => {
		bindView(view);
		bindDocument(view.containerEl.ownerDocument);
	};

	const bindEverything = (): void => {
		bindDocument(document);
		plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) bindLeafView(leaf.view);
		});
	};

	// Deferred (background) leaves get a fresh MarkdownView and container
	// when they load, so rebind on every event that can create or reveal a
	// view. active-leaf-change also fires when a pane gains focus, which
	// happens on mousedown — before the resulting click is dispatched.
	plugin.app.workspace.onLayoutReady(bindEverything);
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", bindEverything)
	);
	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", (leaf) => {
			if (leaf?.view instanceof MarkdownView) bindLeafView(leaf.view);
		})
	);
	plugin.registerEvent(
		plugin.app.workspace.on("window-open", (workspaceWindow) => {
			bindDocument(workspaceWindow.doc);
		})
	);
}

function handleClick(
	plugin: Plugin,
	settings: ClickToEditSettings,
	evt: MouseEvent,
	trigger: ClickTrigger
): void {
	if (settings.disableOnMobile && Platform.isMobile) return;
	if (settings.clickTrigger !== trigger) return;
	if (evt.button !== 0) return;
	if (evt.defaultPrevented) return;
	if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;

	const target = evt.target;
	if (!isElement(target)) return;

	const previewContainer = target.closest(".markdown-reading-view");
	if (previewContainer) {
		switchReaderToSource(
			plugin,
			settings,
			target,
			previewContainer,
			evt,
			trigger
		);
		return;
	}

	// In double-click mode the gesture is a toggle: a double click inside
	// the editor switches back to reading view.
	if (trigger === "double") switchSourceToReader(plugin, target, evt);
}

function switchReaderToSource(
	plugin: Plugin,
	settings: ClickToEditSettings,
	target: Element,
	previewContainer: Element,
	evt: MouseEvent,
	trigger: ClickTrigger
): void {
	if (target.closest(INTERACTIVE_SELECTOR)) return;

	// Refuse to switch modes while any text is selected. Double clicks are
	// exempt: the double click itself selects a word.
	if (trigger === "single") {
		const selection = target.ownerDocument.getSelection();
		if (selection && selection.toString().length > 0) return;
	}

	const leaf = findLeafForElement(plugin, previewContainer);
	if (!leaf) return;

	const view = leaf.view as MarkdownView;
	const state = view.getState();
	if (state.mode !== "preview") return;

	// A double click normally selects a word. Once it is confirmed as the
	// configured trigger, suppress that default before replacing the preview.
	if (trigger === "double") evt.preventDefault();

	// Capture an anchor synchronously, while the rendered DOM is still mounted.
	const anchor = settings.cursorPosition === "click"
		? captureClickAnchor(evt, previewContainer)
		: null;

	void view
		.setState({ ...state, mode: "source" }, { history: false })
		.then(() => {
			placeCursor(view.editor, settings.cursorPosition, anchor);
		});
}

function switchSourceToReader(
	plugin: Plugin,
	target: Element,
	evt: MouseEvent
): void {
	const sourceContainer = target.closest(".markdown-source-view");
	if (!sourceContainer) return;

	// The editor surface itself is contenteditable; only bail on real
	// controls (checkboxes, fold arrows, buttons, ...) so double clicks on
	// text still toggle back to reading view.
	const interactive = target.closest(INTERACTIVE_SELECTOR);
	if (interactive && !interactive.matches(CONTENTEDITABLE_SELECTOR)) return;

	const leaf = findLeafForElement(plugin, sourceContainer);
	if (!leaf) return;

	const view = leaf.view as MarkdownView;
	const state = view.getState();
	if (state.mode !== "source") return;

	// Prevent the editor from selecting a word before its DOM is replaced.
	evt.preventDefault();
	void view.setState({ ...state, mode: "preview" }, { history: false });
}

// No instanceof: each window has its own DOM constructors, and nodes moved
// into a pop-out keep the prototype chain of the window that CREATED them,
// so neither window's Element class matches every node. nodeType is the only
// realm-independent check.
function isElement(target: EventTarget | null): target is Element {
	return (target as Node | null)?.nodeType === Node.ELEMENT_NODE;
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

interface CaretPoint {
	node: Node;
	offset: number;
}

function caretFromPoint(evt: MouseEvent): CaretPoint | null {
	const doc = (evt.target as Node | null)?.ownerDocument ?? document;

	const docWithCaretPosition = doc as Document & {
		caretPositionFromPoint?: (
			x: number,
			y: number
		) => { offsetNode: Node; offset: number } | null;
	};
	if (typeof docWithCaretPosition.caretPositionFromPoint === "function") {
		const pos = docWithCaretPosition.caretPositionFromPoint(
			evt.clientX,
			evt.clientY
		);
		if (pos) return { node: pos.offsetNode, offset: pos.offset };
	}

	// Fallback for older Chromium versions where the standardized
	// `caretPositionFromPoint` is unavailable.
	const docWithCaretRange = doc as Document & {
		caretRangeFromPoint?: (x: number, y: number) => Range | null;
	};
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	if (typeof docWithCaretRange.caretRangeFromPoint === "function") {
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		const range = docWithCaretRange.caretRangeFromPoint(
			evt.clientX,
			evt.clientY
		);
		if (range) {
			return { node: range.startContainer, offset: range.startOffset };
		}
	}

	return null;
}

function captureClickAnchor(
	evt: MouseEvent,
	previewContainer: Element
): ClickAnchor | null {
	const caret = caretFromPoint(evt);
	if (!caret) return null;

	// Scope the text walk to the rendered note, so we don't pick up text
	// from neighboring panes/UI.
	const scope =
		previewContainer.querySelector(".markdown-preview-section") ??
		previewContainer;

	if (!scope.contains(caret.node)) return null;

	const before = collectTextBefore(scope, caret.node, caret.offset, SNIPPET_BEFORE_CHARS);
	const after = collectTextAfter(scope, caret.node, caret.offset, SNIPPET_AFTER_CHARS);
	const snippet = before + after;

	if (snippet.trim().length < MIN_SNIPPET_CHARS) return null;

	return { snippet, offsetInSnippet: before.length };
}

function collectTextBefore(
	scope: Node,
	endNode: Node,
	endOffset: number,
	maxLen: number
): string {
	const walker = scope.ownerDocument!.createTreeWalker(
		scope,
		NodeFilter.SHOW_TEXT
	);
	let acc = "";
	let node = walker.nextNode() as Text | null;
	while (node) {
		if (node === endNode) {
			acc += node.data.slice(0, endOffset);
			break;
		}
		// If the caret landed on an element node, endOffset is a child index;
		// stop once we've walked past that child's subtree.
		if (
			endNode.nodeType !== Node.TEXT_NODE &&
			isAfterPositionInElement(node, endNode, endOffset)
		) {
			break;
		}
		acc += node.data;
		node = walker.nextNode() as Text | null;
	}
	return acc.slice(-maxLen);
}

function collectTextAfter(
	scope: Node,
	startNode: Node,
	startOffset: number,
	maxLen: number
): string {
	const walker = scope.ownerDocument!.createTreeWalker(
		scope,
		NodeFilter.SHOW_TEXT
	);
	let acc = "";
	let started = false;
	let node = walker.nextNode() as Text | null;
	while (node && acc.length < maxLen) {
		if (!started) {
			if (node === startNode) {
				acc += node.data.slice(startOffset);
				started = true;
			} else if (
				startNode.nodeType !== Node.TEXT_NODE &&
				isAfterPositionInElement(node, startNode, startOffset)
			) {
				started = true;
				acc += node.data;
			}
		} else {
			acc += node.data;
		}
		node = walker.nextNode() as Text | null;
	}
	return acc.slice(0, maxLen);
}

function isAfterPositionInElement(
	textNode: Node,
	parent: Node,
	childIndex: number
): boolean {
	if (!parent.contains(textNode)) return false;
	const child = parent.childNodes[childIndex];
	if (!child) return true;
	const cmp = child.compareDocumentPosition(textNode);
	return (cmp & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

function placeCursor(
	editor: Editor | undefined,
	position: ClickToEditSettings["cursorPosition"],
	anchor: ClickAnchor | null
): void {
	if (!editor) return;

	if (position === "top") {
		editor.setCursor({ line: 0, ch: 0 });
		editor.focus();
		return;
	}

	if (position === "click" && anchor) {
		const source = editor.getValue();
		const sourceOffset = locateAnchorInSource(source, anchor);
		if (sourceOffset !== null) {
			const pos = offsetToLineCh(source, sourceOffset);
			editor.setCursor(pos);
			editor.focus();
			return;
		}
		// Fall through to bottom if we can't find the click point.
	}

	const lastLine = editor.lastLine();
	const lastCh = editor.getLine(lastLine).length;
	editor.setCursor({ line: lastLine, ch: lastCh });
	editor.focus();
}

function locateAnchorInSource(
	source: string,
	anchor: ClickAnchor
): number | null {
	const { snippet, offsetInSnippet } = anchor;

	const direct = source.indexOf(snippet);
	if (direct !== -1) return direct + offsetInSnippet;

	// Try progressively shorter prefixes of the "before" portion. The text
	// just before the click is usually the most reliable anchor because it
	// is what the user's eye fixated on.
	const before = snippet.slice(0, offsetInSnippet);
	for (let len = before.length; len >= MIN_SNIPPET_CHARS; len -= 4) {
		const tail = before.slice(-len);
		const trimmed = tail.trim();
		if (trimmed.length < MIN_SNIPPET_CHARS) continue;
		const idx = findUniqueIndex(source, trimmed);
		if (idx !== null) return idx + trimmed.length;
	}

	// As a last resort, try a chunk of "after" text and place cursor at its start.
	const after = snippet.slice(offsetInSnippet);
	for (let len = after.length; len >= MIN_SNIPPET_CHARS; len -= 4) {
		const head = after.slice(0, len).trim();
		if (head.length < MIN_SNIPPET_CHARS) continue;
		const idx = findUniqueIndex(source, head);
		if (idx !== null) return idx;
	}

	return null;
}

function findUniqueIndex(haystack: string, needle: string): number | null {
	const first = haystack.indexOf(needle);
	if (first === -1) return null;
	const second = haystack.indexOf(needle, first + 1);
	if (second === -1) return first;
	// Not unique; still return the first occurrence — for prose this is
	// usually correct because the rendered DOM is laid out in source order.
	return first;
}

function offsetToLineCh(
	text: string,
	offset: number
): { line: number; ch: number } {
	const clamped = Math.max(0, Math.min(offset, text.length));
	let line = 0;
	let lineStart = 0;
	for (let i = 0; i < clamped; i++) {
		if (text.charCodeAt(i) === 10) {
			line++;
			lineStart = i + 1;
		}
	}
	return { line, ch: clamped - lineStart };
}
