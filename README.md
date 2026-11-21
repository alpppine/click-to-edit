# Click to Edit

An Obsidian plugin that makes notes feel more like a wiki: every note opens in
**reader mode** by default, and a single click (or double click, if you
prefer) anywhere in the note flips it into **edit mode** with the cursor
placed at the **end of the note** (or wherever you prefer).

## Features

- **Reader mode by default** &mdash; whenever a note is opened, it is
  automatically switched to reader (preview) mode.
- **Click anywhere to edit** &mdash; a single click in the rendered note flips
  the view into edit (source) mode, with the cursor placed at the end of the
  note so you can immediately start typing.
- **Single or double click** *(1.1.0+)* &mdash; use a single click to enter
  edit mode, or switch to double clicks, which toggle between reader and edit
  mode in both directions.
- **Configurable cursor placement** &mdash; choose end of note (default), top
  of note, or as close to where you clicked as possible.
- **Works in pop-out windows** *(1.1.0+)* &mdash; clicking works the same for
  notes opened in separate pop-out windows.
- **Respects normal interactions** &mdash; clicks on links, tags, task
  checkboxes, fold buttons, and other interactive elements still behave
  normally instead of triggering edit mode.
- **Keeps text selection** &mdash; in single-click mode, if you're selecting
  text in reader mode, the plugin won't switch to edit until you release the
  selection.

## Settings

Open **Settings &rarr; Community plugins &rarr; Click to Edit** to configure:

- **Open notes in reader mode** &mdash; toggle the auto reader-mode behavior.
- **Skip empty notes** &mdash; don't force reader mode on brand-new, empty
  notes (so creating a note still drops you straight into editing).
- **Disable on mobile** &mdash; keep the plugin out of the way on phones and
  tablets (on by default).
- **Click trigger** *(1.1.0+)* &mdash; *Single click* (default) to switch to
  edit mode, or *Double click* to toggle between reader and edit mode. In
  double-click mode, double-clicking text in edit mode switches the note back
  to reader mode instead of selecting a word. Double clicks on links,
  checkboxes and other controls, or with a modifier key held, are ignored.
  Existing settings are kept when you upgrade; the trigger starts as
  *Single click*.
- **Cursor position on edit** &mdash; choose between *Bottom of note* (default),
  *Top of note*, or *Where you clicked*.

If a setting described here is missing, check the installed version under
**Settings &rarr; Community plugins** and update the plugin.

## Commands

- **Click to Edit: Switch active note to reader mode** &mdash; manually switch
  the current note back to reader mode without opening the view menu.

## Installation

### From source

1. Clone this repository into your vault's plugins folder:
   ```bash
   <Vault>/.obsidian/plugins/click-to-edit/
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Reload Obsidian and enable **Click to Edit** in
   **Settings &rarr; Community plugins**.

### Manual install

Copy `main.js` and `manifest.json` from a release into:

```
<Vault>/.obsidian/plugins/click-to-edit/
```

Then reload Obsidian and enable the plugin.

## Development

```bash
npm install      # install dependencies
npm run dev      # build in watch mode
npm run build    # production build
npm run lint     # run eslint
```

The build output is `main.js` at the repo root, ready to be loaded by Obsidian.

## License

[0BSD](LICENSE)
