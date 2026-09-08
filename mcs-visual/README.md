# Mcs-Visual editor (`Mcs*|Hitp*.last.html`)

A-VSCode-extension that visually edits McsHitp(`Mcs*.last.html`) and Hitp(`Hitp*.last.html`) pages.
An address-bar has **← → ⟳ ⋯** menu, and the page is-rendered exactly as in a-browser.

## The ⋯ menu (sits right after ⟳ menu)

The-submenus are file type depended.

## Canonical serialization (what Save produces)

On **Save** the *entire* document is re-serialised to the canonical Mcs indent 2|4 format.
It runs a **re-indenter** (`src/format.js`), not a re-flow — it never moves content between lines, it only fixes each line's leading indentation:

- `<section>` / `<header>` at the top level → column 0; nested `<section>` and
  every `<h1..h9>` / `<p>` / `<div>` → **2 spaces**.
- the block's continuation lines (`<br>` segments, the trailing
  `<a class="clsHide">` tail, standalone `</p></hN></div>`) → **4 spaces**.
- `<head>` / prologue, blank lines, and anything it doesn't recognise as Mcsh
  grammar — **tables, `<pre>`/terminal dumps, wrapped inline links** — are copied
  through **byte-for-byte**, so hand-maintained (and semantically-significant)
  whitespace is never disturbed. Files with unbalanced `<section>` tags keep
  their section indentation untouched (the tool never guesses on malformed input).

It is idempotent: saving an already-canonical file changes nothing.

## How editing maps back to the file

The page is rendered by XAMPP with `?mcsv=1`, which makes `mMcsh2.js` load the bridge `Mcsmgr/mcs-visual/src/mMcsVisual.js` (never on the public site).
The bridge makes each content text run editable and reports changes as `(id, ordinal, text/markup)`.
Because the render keeps your source `id`s and text order, the extension maps `(id, ordinal)` back to the exact byte range (via `parse5`) and mirrors the change into the **unsaved** document.
After a format command the bridge re-annotates locally so ordinals stay in sync without a reload. 
Only ids that exist in your source are editable — generated chrome (ToC, menu, search) is left alone.

## The one change to your site

`Mcsmgr/mMcsh2.js` has a second guarded loader (next to the `mcsv` one):

```js
if (new URLSearchParams(location.search).has('mcsv')) {
  import('./mcs-visual/src/mMcsVisual.js?v=' + Date.now()).catch(e => console.error('mcsv bridge load failed:', e))
}
```

It only runs with `?mcsv=1` (inside this editor) — **no effect on the public site**. Removing the editor = delete `Mcsmgr/mcs-visual/src/mMcsVisual.js` and this block (and the `mcsv` line in `Mcsmgr/.htaccess`).

## Run it (development)

1. Open this folder (`/dirMcshmgr/mcs-visual`) in VSCode.
2. `npm install` (installs `parse5`; a copy is already vendored in `node_modules`).
3. Press **F5** → an *Extension Development Host* opens with `dirMcsh` loaded.
4. Make sure XAMPP is running. Open any `Mcs*.last.html` or `Hitp*.last.html`, then run **Mcs: Open in Mcs-Visual** (or click the title-bar button). It opens a **vertical split**:
   the **raw source on the left** and the **visual editor on the right** (focus on the right). It registers as an *option*, so it never overrides the default text editor; **Reopen Editor With… → Mcs-Visual** still opens single-pane.

Both panes back the same document: visual edits show in the source live; saving either pane canonicalises the file and reloads the visual.

## Tests (offline)

- `node src/test-format.js` — safety of the canonical re-indenter across every `dirCor/*.last.html`: idempotent, content-preserving, and verbatim-preserving for tables / `<pre>` / unrecognised lines. `--diff` prints each re-indent.

## Notes / limits

- Editing covers **text** and **inline format** (Bold / Color / Url) of existing
  content, plus the whole-file canonical Save. Adding/removing paragraphs or
  sections is done in the raw editor for now.
- Edits stay **unsaved** until Save (VSCode shows the dirty dot; Ctrl+S also
  saves-and-canonicalises). Use Undo in the raw editor to revert.
- The page `<title>` and generated chrome are not editable.
