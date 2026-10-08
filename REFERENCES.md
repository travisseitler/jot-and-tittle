# Commas and shorthand

The parser uses explicit context rules and previews its normalized interpretation and unique verse count before saving. All parts must validate; an invalid part prevents the entire save and preserves the draft. Overlaps count once per session.

- A named book starts a new reference. `Psalm 23, John 10:1–18` means those two explicit passages.
- After a chapter-only reference, comma-separated bare numbers or ranges are chapters: `John 3, 5` means full chapters 3 and 5. `John 3, 5–6` includes chapters 5 through 6.
- After a verse reference, comma-separated bare numbers or ranges are verses in the last referenced chapter: `John 3:16, 18–21` means verse 16 and verses 18 through 21. `John 3:16, 4:1–3, 5` means John 3:16, John 4:1–3, and John 4:5.
- An explicit `chapter:verse` changes the inherited chapter. A cross-chapter or cross-book range updates comma context to its ending endpoint: `John 3:36–4:3, 5` ends with John 4:5; `Genesis 50:26–Exodus 1:2, 4` adds Exodus 1:4.
- A named chapter-only reference resets verse mode: `John 3:16, John 4, 5` means John 3:16 and full chapters 4 and 5. To request a chapter after verse shorthand, repeat the book name or use a semicolon.
- Semicolons inherit only the book, preserving existing syntax; a bare number after a semicolon means a chapter. `John 3:16; 5` means John 3:16 and chapter 5. As before, book inheritance after a cross-book range uses that range's starting book; repeat a book name to make a different destination explicit.
- A whole-book reference does not establish shorthand chapter/verse context. `John, 3` is rejected; write `John 3` or an explicit additional reference. A chapter and verse (`John, 3:16`) remains explicit and valid.
- Numbered books, ordinary whitespace (including around colons), and hyphen/en/em/figure/nonbreaking/minus dashes are supported. Empty items, trailing commas/semicolons, multiple dashes in a range, backward ranges, and invalid inherited verses fail with explanatory errors.

Bare numbers after verse references always mean verses, even when that number could also name a chapter. This is a defined grammar, not a guess. Repeat the book or use a semicolon to express a chapter. Range endpoints inherit verse mode only within the range when the starting endpoint has a verse, preserving existing `John 3:16–18` and `John 3:16–4:3` syntax.
