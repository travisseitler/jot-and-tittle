# Jot & Tittle design reference · revision 2

2026-10-08 · Working specification under the user's design request; not explicitly user-approved. R2 governs the current implementation. The user authorized applying these guidelines across the app; the visual specification itself remains a working reference. Implementation evidence and remaining verification limits are recorded in [Implementation and verification](implementation-r2.md).

## Canonical sources

[Visual Design Guidelines](visual-design-guidelines.md) govern meaning, workflow and state requirements. [Numeric tokens](tokens-r2.json) govern dimensions, colors and typography. The editable reference is [local Penpot · Reference desk · r2](http://localhost:9001/#/workspace?team-id=389359b9-41aa-8115-8008-c1d036bbf00b&file-id=389359b9-41aa-8115-8008-c1dd1c742e50&page-id=389359b9-41aa-8115-8008-c1dd1c742e51).

[Manifest](references/r2/manifest.json) preserves all 23 board identifiers, page identifiers, dimensions and PNG exports. Native Penpot assets include 49 tokens and 22 component variants in five groups. Three named prototype flows connect exploration/capture/inspection, first reading/return, and invalid-input recovery; 81 links provide representative navigation. The file contains a named saved version, `r2 · final reviewed reference · 2026-10-08`.

## Reference coverage

D01–D07: desktop populated map, capture, selected passage/notes, history/detail, Text view, filtered empty and display dialog. M01–M10: phone map/capture/detail/history/Text view, validation, first use, color key, confirmation and display settings. N01: 320px map. T01: 768px map. C01–C04: components/states, foundations/palette, map access/input and extended states/long content.

Representative exports do not depict every required full-screen state. The guidelines' required state inventory also governs Patterns, Your data, journal lifecycle, conflict comparison, imports, Trash and recovery. Omitted controls in an example are not authorized removals. Unwired controls are specimens; the prototype does not execute parsing, data writes, counter updates, browser focus or assistive technology behavior.

Inter and Source Serif 4 are Penpot proxies for the app's system sans and Georgia. App code must use the specified local stacks and verify actual wrapping. Screen counts/notes are illustrative synthetic content; map imagery is a cropped representative field, not personal data or a persistence simulation.

## Implementation and verification

The guidelines §14 maps requirements to source components. Text view, adjacent detail, separate capture, shared dialog/feedback behavior and the r2 CSS foundations are now implemented while preserving domain and storage semantics. Current-journal/sample/archive counting and aggregate-view counting intentionally differ; mode labels must explain this. The cell-size definition/default is an explicit proposed presentation change, independent of data.

Three specialist subagents completed initial coverage reviews and multiple consistency passes. Their historical proposal documents are supporting evidence, superseded by the canonical guidelines where recommendations differ. [Review resolution](review-resolution-r2.md) records the consequential decisions. Opaque token contrast calculations are in [color-contrast-r2.json](color-contrast-r2.json); they do not certify rendered combinations.

All 23 exports were decoded as PNG and visually inspected as a contact sheet, with selected detailed exports inspected during composition. Native file/page/board readback and named-version creation confirmed local persistence. Prototype links are authored navigation, not end-to-end application verification. Rendered responsive composition, actual fonts, keyboard/touch flows and persistence/recovery were checked in the running app; see [r2 implementation evidence](implementation-r2.md). Assistive-technology sessions, Firefox execution and user studies remain outstanding, as documented there. This is not an accessibility-conformance claim.

R1 is historical: [previous contract](references/design-contract-r1.md), original SVG and earlier browser evidence remain preserved. Existing `verification.md` describes that earlier implementation only; it does not verify r2. Resolve reference discrepancies by updating guidelines, tokens, manifest and relevant Penpot exports together.
