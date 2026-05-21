# Click to Edit

An Obsidian plugin that makes notes feel more like a wiki: every note opens in
**reader mode** by default, and a single click anywhere in the note flips it
into **edit mode** with the cursor placed at the **end of the note** (or
wherever you prefer).

## Features

- **Reader mode by default** &mdash; whenever a note is opened, it is
  automatically switched to reader (preview) mode.
- **Click anywhere to edit** &mdash; a single click in the rendered note flips
  the view into edit (source) mode, with the cursor placed at the end of the
  note so you can immediately start typing.
- **Configurable cursor placement** &mdash; choose end of note (default), top
  of note, or as close to where you clicked as possible.
- **Respects normal interactions** &mdash; clicks on links, tags, task
  checkboxes, fold buttons, and other interactive elements still behave
  normally instead of triggering edit mode.
- **Keeps text selection** &mdash; if you're selecting text in reader mode, the
  plugin won't switch to edit until you release the selection.

## Settings

Open **Settings &rarr; Community plugins &rarr; Click to Edit** to configure:

- **Open notes in reader mode** &mdash; toggle the auto reader-mode behavior.
- **Skip empty notes** &mdash; don't force reader mode on brand-new, empty
  notes (so creating a note still drops you straight into editing).
- **Cursor position on edit** &mdash; choose between *Bottom of note* (default),
  *Top of note*, or *Where you clicked*.

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
