# Context Cloze visual system

## Thesis: brutalist concrete and moss

Context Cloze is a workbench, not a deck browser. The interface borrows the blunt utility of a poured-concrete language lab: visible seams, squared controls, stamped labels, and a dense workspace. Moss is the counterpoint—learning is gradual, local, and alive. It appears only where progress or action matters. This makes the product feel made for repeated sentence work rather than like a reskinned quiz template.

The treatment is intentionally single-mode. A warm, light concrete canvas supports long authoring and practice sessions; painting every surface explicitly avoids dependence on browser theme defaults. Dark ink and moss were contrast-checked against their intended backgrounds.

## Tokens

- `--concrete-0 #F2F0E8`: page background, like chalked aggregate.
- `--concrete-1 #E5E2D7`: inset surfaces and secondary controls.
- `--concrete-2 #CBC7B9`: dividers, disabled areas, visible seams.
- `--ink #171C18`: primary text (15.3:1 on the page).
- `--ink-muted #50574F`: secondary text (6.7:1 on the page).
- `--moss #315B36`: primary action and progress (7.1:1 on the page).
- `--moss-deep #173D24`: pressed state and large display text.
- `--lichen #CBE0A8`: selected/highlight surfaces; paired with `--ink`.
- `--rust #91412E`: destructive/error state (5.7:1 on the page).
- `--ochre #73540E`: warning/offline state (6.3:1 on the page).
- `--paper #FCFBF5`: writable fields and practice sheet.

## Type and spacing

The display face is the self-hosted/system slab stack `Rockwell, Rockwell Nova, Roboto Slab, Georgia, serif`; its blocky serifs evoke workshop stencils without sacrificing legibility. Interface and body copy use `Inter, ui-sans-serif, system-ui, sans-serif`; the system fallback means no font download or privacy leak. Two families maximum.

The scale is 14 / 16 / 20 / 28 / 44 / 64 px. Body copy never falls below 16 px. Spacing follows a strict 4/8 px rhythm: 4, 8, 12, 16, 24, 32, 48, 64. Text measures stop around 68 characters. Corners remain mostly square; a 2 px radius only softens inputs and reduces visual aliasing.

## Layout and interaction grammar

- A narrow utility masthead sits above the workbench; the wordmark is deliberately typographic, not a decorative logo.
- Author mode is a two-column bench: tools on the left, the reusable sentence bank on the right. On phones it becomes one column, with mode navigation and the main action remaining near the thumb.
- Practice mode drops authoring chrome and puts one paper-like prompt in the center. Answer feedback grows from the answer field, so depth follows the learner’s action.
- Heavy 2 px ink borders, 4 px offset shadows, and exposed divider lines provide the concrete/brutalist structure. Cards are reserved for genuinely independent prompts and practice records.
- Labels are uppercase and tracked like stamped workshop markings. Button labels remain plain verbs.
- All targets are at least 44 px. Focus is a 3 px ochre outline with a 3 px offset. Destructive actions require a prompt-specific confirmation; last deletion can be undone.
- RTL is a per-prompt setting inferred from sentence content and user-overridable. Sentence and answer fields use `dir="auto"`.

## Motion

Motion is short and physical: 180 ms press/hover shifts, 220 ms prompt replacement, and a single 260 ms success confirmation. Only transforms and opacity animate. Nothing loops. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed and feedback changes instantly while retaining shape, label, and icon cues.

## Original asset plan and provenance

The hero illustration is an original, generated still life: a raw concrete language workbench where letter blocks have been removed from a sentence channel and moss grows precisely through the gaps. It explains the action (context with missing words) rather than decorating the page. The app’s icons and texture marks are hand-authored SVG/CSS.

Prompt sheet:

- **Use case:** `stylized-concept`
- **Asset:** compact onboarding/empty-state illustration for a vocabulary retrieval PWA
- **Subject/world:** top-down raw concrete workbench; a shallow sentence-shaped groove made from dark letterless type blocks, two clean missing rectangular blocks, fine living moss emerging only from the blanks; one small graphite pencil and blank paper slip as scale cues
- **Materials/light/lens:** board-formed concrete, paper fiber, graphite, velvety moss; diffuse overcast studio light; orthographic/top-down editorial framing; strong tactile shadows; generous uncluttered negative space
- **Palette words:** chalk concrete, charcoal ink, forest moss, pale lichen, restrained rust
- **Negative list:** no people, no hands, no readable text, no letters, no logos, no watermark, no UI screenshot, no glossy plastic, no neon, no gradient, no excessive objects

Generation provenance: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`, generated 2026-08-28. Generated output is original to this product and disclosed in the footer. The selected source prompt is stored beside the source image in `assets/src/hero-concrete-moss.json`; derivatives are optimized locally as WebP/AVIF and must remain below the 300 KB hero budget. `public/assets/context-cloze-social.webp` is a hand-composed 1200 × 630 crop of that original source for social metadata; it introduces no new subject or third-party asset.
