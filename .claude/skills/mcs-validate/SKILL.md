---
name: mcs-validate
description: Run the dirMcshmgr Mcs validator on the dirMcsh worldview, read its findings (Mvr../Hvr.. codes) and fix them, safely and verifiably. Use this whenever the user mentions validating, checking or reporting on dirMcsh / Mcsh / Hitp files, a validator code like Mvrw01, Hvre07, Hvrw08, reportMcsh, createMcsh, dupMcsh, validator-report, heading gaps, unclosed sections, missing description::, duplicate names or broken anchors — even if they don't say "validator".
---

# Mcs validate-and-fix

The worldview lives at `C:/dirNodews/dirMcsh` (621 `*.last.html` files).
The tools live in `dirValid/` of this repo and always take the worldview path
as their first argument. Run them from the repo root.

## The rule codes

Mcsh rules (`structuralMcsh.js`, Mcsh* files only):

| Code   | Meaning |
|--------|---------|
| Mvre01 | concept-file missing idOverview section |
| Mvre02 | duplicate name-line in a McsLago, across the worldview |
| Mvrw01 | concept-section missing description:: |
| Mvrw02 | description:: empty (only "·") |
| Mvrw03 | concept-section missing name:: |
| Mvrw04 | name:: has zero valid Mcsh* entries |
| Mvrw06 | date not in {YYYY-MM-DD} format |
| MvrlMnnm01 | (error) main-name, the text after `!⇒`, has a hyphen: use underscores |

Hitp rules (`structuralHitp.js`, every .last.html file):

| Code   | Meaning |
|--------|---------|
| Hvre01 | duplicate id within a file |
| Hvre02 | heading without id |
| Hvre03 | paragraph without id |
| Hvre04 | section without id |
| Hvre05 | broken file link (.last.html missing) |
| Hvre06 | broken internal anchor (#id or file#id) |
| Hvre07 | missing tag pair: unclosed open or stray close |
| Hvrw01 | <title> missing |
| Hvrw02 | version string malformed |
| Hvrw03 | clsHide self-anchor missing |
| Hvrw04 | clsHide self-anchor not matching own id |
| Hvrw05 | element name not lowercase |
| Hvrw06 | attribute value not double-quoted |
| Hvrw07 | heading gap (h1 → h3); law articles exempt |
| Hvrw08 | section nesting error (a missing </section>) |

`e` = error, `w` = warning. If a code is not in these tables, read the header
comment of `dirValid/structuralMcsh.js` / `structuralHitp.js`: they are the
source of truth and new codes appear there first.

## Workflow

### 1. Report

```bash
node dirValid/reportMcsh.mjs C:/dirNodews/dirMcsh --code Hvre07,Hvrw08 [--file McshTchInf000012] [--line]
```

- It takes ~45 s for the whole worldview; run it in the background if the
  user may want to keep talking.
- Output goes to `dirValid/reportMcsh.txt` (overwritten each run). Each line
  is `FileShortName:line;line;...` — lines **biggest first**, files with most
  issues first. Read the header: it gives files / files-with-issues / issues.
- `--line` adds the detail per issue; use it when you are about to fix a file.
- For a full multi-rule HTML report use
  `node dirValid/validator.js C:/dirNodews/dirMcsh [--file X.last.html]`
  → `dirValid/validator-report.html`. Do not pass `--ai` unless the user asks:
  it calls the DeepSeek API and costs money.

Summarize to the user by code and by worst files before touching anything —
the counts are often thousands, and the user decides the scope.

### 2. Prefer the existing fixers

Several findings have a tested, scripted fixer. They are **dry-run by default**:
run without `--fix`, show the user what would change, then rerun with `--fix`
only after they agree. createMcsh `--fix` writes a backup under
`dirValid/createMcsh-backup/<timestamp>` and its report to `dirValid/createMcsh.txt`
(also on a dry run). **dupMcsh `--fix` makes no backup** — it deletes lines in
place, so check `git -C C:/dirNodews/dirMcsh status` is clean first (then git is
the backup) or copy the affected files before running it.

| Finding | Fixer |
|---------|-------|
| Mvrw01 (no description::) | `node dirValid/createMcsh.mjs <dir> --missing` |
| Hvrw07 (obvious heading gaps) | `node dirValid/createMcsh.mjs <dir> --headgap` |
| Hvrw08 (obvious nesting errors) | `node dirValid/createMcsh.mjs <dir> --nest` |
| MvrlMnnm01 (main-name with "-") | `node dirValid/createMcsh.mjs <dir> --mainname` (keeps the old form as synonym `X!⇒X_`) |
| idOverview description without creation date | `--overview` |
| any description without creation date | `--undated` |
| idOverview name:: para without id idName | `--nameid` |
| Mvre02 kind-A duplicates (same name-line twice) | `node dirValid/dupMcsh.mjs <dir> --fix` (inspect first with `--summary` / `--line`) |

The fixers SKIP what is not obvious and say why (e.g. "the-file has an-unclosed
or stray <section> (Hvre07)", "a-duplicated id", "is <h1>, not <h2>"). Those
SKIP lines are your hand-fix list, and their order matters: an Hvre07 in a file
blocks --headgap and --nest there, so fix Hvre07 first, then rerun the fixer.

After a `--fix` run, write its summary next to the others in `dirValid/`
following the existing naming (`<topic>-dry.txt`, `<topic>-applied.txt`) only
if the user wants a record — the repo already keeps these for past runs.

### 3. Fix by hand what remains

- Work **bottom-up inside a file** (biggest line number first, as the report
  lists them), so each edit leaves the other reported line numbers valid.
- Keep the Mcs house style when you write text: ids as `id<Something>`, the
  hyphenated-article English (`the-file`, `a-section`), dates `{YYYY-MM-DD}`,
  every `<p>` / heading with an id and its own `<a class="clsHide" href="#id"></a>`.
  Imitate the neighbouring sections of the same file rather than inventing.
- Many issues are content decisions (Mvre02 kind B/C: two concepts share a
  name; Hvre06: which target was meant). Ask the user instead of guessing —
  a wrong guess is silent damage in a hand-written worldview.
- dirMcsh is its own repository. Don't commit there unless asked.

### 4. Verify

Rerun step 1 with the same codes (and `--file` for touched files). Report the
before → after counts. If a fix created new issues (e.g. moving a </section>
surfaces an Hvrw07), say so.

## Changing the validator itself

When the user wants a new rule or a fixer change, edit `dirValid/*.js|mjs`:
- New rule codes go in the header table of the `structural*.js` file and in
  `fRunChecksMcsh` / `fRunChecksHitp`, so `reportMcsh.mjs` picks them up.
- Add a line to the file's `aVersion` array (`'<file>.0-x-0.<date>: <what>'`).
- Follow CLAUDE.md's type-prefix naming (`sName`, `aoIssue`, `fCheckX`,
  `rPattern`, `nLine`, `bFound`); the PostToolUse hook flags violations.
- Keep `reportMcsh.txt`, `createMcsh.txt` and `validator-report.html` out of
  commits unless the user wants the new report recorded (they are tracked, so a
  test run dirties them — `git checkout -- dirValid/reportMcsh.txt` restores it).
