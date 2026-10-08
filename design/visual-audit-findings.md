# Bible scholarship interface visual audit

Date: 2026-10-08. Status: research and proposed interpretation. Companion: [Visual Design Guidelines](visual-design-guidelines.md). This audit extends [the functional research](scholarship-design-research.md).

## Assignment and evidence

Three subagents examined eight public desktop interfaces. Reading Platforms covered Bible.com, Bible Gateway and Bible Hub; Scholarship Tools covered Logos, STEP and Blue Letter Bible; Research Archives covered Sefaria and NET. Their follow-up covered size, color, shape, typography, spacing, hierarchy, icons and density. The primary agent supplemented their rendered observations with computed-style samples from Bible.com, Bible Hub and Sefaria at a measured 1280 × 720 CSS-pixel viewport.

**Measured** means computed CSS or element geometry at the named route. A font-family value is a CSS stack, not proof of the particular installed face used for every glyph. **Estimated** means a visual approximation from a desktop screenshot. **Documented historical** means an older vendor specification, not a current measurement. Approximate dimensions are representative of the inspected state, not responsive rules or vendor design tokens.

The sample combines prominent reading sites and specialist research tools. It is not a substantiated ranking of the eight most-used scholarship products; differing reach measures are explained in the earlier research. Logged-in workflows and competitor mobile layouts were not inspected. This is competitive interface research, not a usability study or accessibility certification.

## Platform findings

### Bible.com: editorial quiet

White reading surface, pale gray navigation, near-black text; serif reading typography and sans-serif tools. Broad margins and small circular icons subordinate controls. Pill-shaped selectors and subdued selected navigation soften the frame.

**Measured:** John 1 title uses `Source Serif Pro`, 39px / 44.85px line-height; its element is 600px wide. Verse prose sample is 20px / 36px, color `#121212`. The NIV selector uses `aktiv-grotesk, Inter, Arial, sans-serif`, 12px, height 32px and radius 9999px. These values apply to the sampled elements, not every component.

**Transfer:** calm hierarchy and an uncluttered primary surface. Jot & Tittle's dense map needs less surrounding whitespace than a chapter reader. [Inspected reader](https://www.bible.com/bible/111/JHN.1.NIV).

### Bible Gateway: bounded study workspace

Maroon search/brand band, rust navigation, cool-gray background and white passage/sidebar surfaces. Sans-serif content and labeled tools favor utility. Search is a wide pill; panels have subtle rounding. The study pane occupied approximately one-quarter of the screenshot, with its own scroll region.

**Evidence:** visual observations; column proportion is estimated, exact colors and CSS sizes were not measured.

**Transfer:** labeled actions and separation of primary content from optional detail. The stacked navigation and promotions are too prominent for Jot & Tittle's quick capture. [Inspected reader](https://www.biblegateway.com/passage/?search=John%201&version=NIV).

### Bible Hub: compact reference portal

Blue masthead, light-blue translation strip, white surfaces and blue links. Squared controls, thin separators, stacked comparisons and abbreviated navigation maximize visible destinations. Sans-serif text makes the dense content scan like reference material.

**Measured:** sampled translation link uses `Roboto, Arial, Helvetica, sans-serif`, 16px and `#008AE6`. Its immediate wrapper has 22px line-height. This does not establish the whole site's type scale or link contrast on every surface.

**Transfer:** exact, stable verse addresses and purposeful data density. Prefer full labels and fewer permanent destinations in Jot & Tittle. [Inspected verse](https://biblehub.com/john/1-1.htm).

### Logos: modular research workbench

White resource panels and light-gray chrome, fine rules, blue links and small orange linking markers. Serif prose contrasts with compact sans-serif controls. Mostly rectangular tabs and modestly rounded snippets distinguish resources from utilities.

**Estimated at approximately 1280 × 720:** navigation 210px; two resource panels about 530px each; prose 19–20px with about 28px line spacing; interface labels 12–14px. Multiple toolbars consumed roughly 150px vertically. Open Insights narrowed the reading column substantially.

**Transfer:** one reference across linked detail regions. Give Jot & Tittle's map more space and its chrome fewer layers. [Inspected guest app](https://app.logos.com/).

### STEP: spare scholarly utility

Flat light panes, dark type, teal-blue links and outlined rectangular controls. Serif passage prose and small sans-serif labeled tools divide reading from operations. The introductory overlay dimmed the inspected state; its apparent background colors are unsuitable for palette extraction.

**Estimated:** two roughly equal panes; global strip 50px, local toolbar 40px; prose 17–18px / approximately 24px line spacing; chapter title 24–26px; controls about 26px high.

**Transfer:** plain labels and restrained structural rules. Jot & Tittle should use larger touch targets and avoid dedicating half the workspace to help. [Inspected app](https://www.stepbible.org/).

### Blue Letter Bible: verse-local reference desk

Navy/slate bars, pale blue-gray surroundings, white content, blue links and borders. Mostly sans-serif passage text; Greek switches to serif. Pastel category tabs distinguish study tools; detail appears below the selected verse. Rectangular tables, pills for previous/next and a circular close button express different roles.

**Estimated:** centered area 1030px; main column 670px; sidebar 334px; gap 20px. Prose approximately 16px / 23px; tabs about 31px high with 4–6px rounding.

**Transfer:** reveal relevant records beside their passage context. Jot & Tittle's metric colors already carry meaning; adding many category colors would complicate that meaning. [Inspected verse tools](https://www.blueletterbible.org/kjv/jhn/3/1/).

### Sefaria: library-like reading and inquiry

White content, neutral toolbar, serif titles/prose, sans-serif controls, fine rules and flat rectangular verse highlights. Resources use grouped rows and counters. The earlier open-resource screenshot had approximately 68/32 pane proportions; the later measured state had the resource pane closed.

**Measured:** Genesis heading uses a serif stack beginning `Cardo, Meltho`, with Adobe Garamond Pro, Crimson Text, Georgia and other fallbacks: 30px / 39px, black. English prose sample: 22px / 35.2px, `#666666`, same stack. Sign-up button: Roboto-led sans-serif stack, 14px, height 28px, radius 6px, navy `#18345D` and white text. [Measured reader](https://www.sefaria.org/Genesis.1?lang=bi&aliyot=0).

**Documented historical:** its older styleguide specifies Garamond content, Roboto controls, warm neutrals and navy. These historical defaults should not replace the current measurements. **Transfer:** clear type roles, restrained surfaces and context-preserving selection. [Historical vendor guide](https://www.sefaria.org/static/files/styleguide_with_markup.pdf).

### NET: scholarship beside the passage

Charcoal header, red selected-tab accent, blue note markers and light panes. Serif passage text contrasts with sans-serif notes. Thin dividers and plain tabs carry structure; note-source controls have modest rounding.

**Estimated:** roughly equal reading/notes panes; header 64px; prose 18–20px with 1.4–1.5 line-height; gutters 45–50px. Prominent chapter numbers and small inline note markers establish hierarchy.

**Transfer:** readable notes and inspectable evidence. Jot & Tittle needs exact personal counts and dates, rather than permanent specialist notation. [Inspected reader](https://netbible.org/bible/Matthew+1).

## Synthesis for Jot & Tittle

The commonality is functional hierarchy, not a shared font, palette or radius. Long-form content is often serif and spacious; reference tools are usually compact sans-serif. Neutral surfaces dominate; links, selection and categories receive color. Detail is bounded by rows, tabs or panes, while a passage address preserves orientation. More scholarly capability generally brings more chrome and density; that tradeoff is appropriate only when the product needs it.

Jot & Tittle should be **a quiet personal reference desk: editorial calm for reflection, precise utility for recording**. Its core work is to log passages, view a continuous verse map, inspect history and read personal notes. It does not bundle Scripture. Therefore:

- Keep the map dense and canonical; give forms and notes more breathing room.
- Use sans-serif for operational text and notes; retain a restrained serif accent for identity and headings.
- Keep warm neutral surfaces and one forest accent, with a separate semantic palette for map metrics.
- Use flat history rows, fine separators and modest control rounding. Reserve raised/modal treatment for temporary interaction.
- Make the selected reference and logging action more prominent than summaries or explanatory copy.
- Preserve local ownership, portable records and descriptive analytics from the original brief. Those principles are product requirements, not findings about competitor consensus.

Concrete sizes, tokens, component rules and verification criteria are in the [Visual Design Guidelines](visual-design-guidelines.md). They are proposed choices to evaluate in the next implementation pass.
