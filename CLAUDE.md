# dirMcshmgr — project conventions

Mcs consistency checker for the `dirMcsh` worldview.

## Naming convention (type-prefix)

Identifiers carry a lowercase type prefix. **Apply this to every new or edited
identifier**.

| Prefix | Type          | Examples |
|--------|---------------|----------|
| `s`    | string        | `sId`, `sFile_name`, `sFilename`, `sHtmlIn` |
| `a`    | array         | `aNames`, `aLinks`, `aoPara`, `aFiles` |
| `o`    | object / Map  | `oParaByTitle`, `oSetIdAll`, `oMapIdLine` |
| `n`    | number        | `nDepth`, `nHeadinglevel`, `nL` |
| `b`    | boolean       | `bIsCnptSect`, `bInOwnSection`, `bIsClose` |
| `f`    | function      | `fStrip_tags`, `fReadSection`, `fBuildMapLine` |
| `r`    | regex         | `rId`, `rHref`, `rP`, `rSectTag` |

Additional rules:

- **`ao` prefix** for an array whose items are objects: `aoName`,
  `aoSectStart`, `aoRawsect`.
- **Mcs domain tokens** are kept verbatim (never re-prefixed): `McsEngl`,
  `McsElln`, `lagEngl`, `idOverview`, `name::`, `description::`.
- **multi-word names, one word**: `file_name`, `filename`.
- **multi-word abbreviations** first capital: `Mcs(modelConceptSenso)`.
- **specific names** as genericSpecific: `carRed`, `sectionLast`.
- **JavaScript** without use of "class".