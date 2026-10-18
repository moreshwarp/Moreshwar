# Moreshwar Research Lab design system

The existing technical studio is the visual foundation. Keep the static HTML and JavaScript architecture and preserve original article bodies, source links, reviews and publishing gates.

## Foundations

`design-system.css` owns semantic color, type, spacing, radius, target size and motion tokens. Warm paper is the canvas, white paper is the raised surface, charcoal is primary text, muted gray is secondary text, red identifies actions and research emphasis, and blue identifies keyboard focus. Use the inverse surface only with inverse text. Never rely on color alone for selection: retain pressed/selected attributes and borders.

Typography uses the system Arial/Helvetica stack for headings and prose, with the existing monospace stack for metadata. Base prose is 16px, lead text 18px, metadata 14px. Reading columns cap at 72 characters. Space follows 4, 8, 12, 16, 24, 32, 48 and 64px tokens. Corners use a restrained 3px radius.

## Components and states

`redesign.css` consumes these foundations for discovery, projects, navigation, library and research controls. `research-reader.css` applies the same vocabulary after legacy article styles during publishing, and to the archive. Original article files remain unchanged.

Primary actions use accent and inverse text; hover darkens the accent. Quiet actions use bordered surfaces. All controls retain a visible keyboard outline. Navigation, icon controls and reading actions have a 44px minimum height. Disabled controls expose their native disabled state and a subdued appearance. Invalid inputs use an explicit border and must also provide a text error. Reduced motion removes transitions and animations; forced colors uses the system highlight for focus and selection.

## Information architecture

Explore is the entry directory; latest story and the dated source-linked archive provide current discovery; projects and research retain technical depth; writing and library provide reading; science provides curated exploration; about and contact provide context and collaboration. Existing section IDs, search, filters, mobile navigation and keyboard behavior are preserved. Mobile navigation scrolls within the available viewport; it retains all destinations.

## Extending and verifying

Add semantic tokens here before introducing new surface colors. Keep article prose at readable width, allow wrapping and preserve browser zoom. Run `node --test tests/*.test.cjs`, publish a fixture with `scripts/build-content.cjs`, then run `tests/browser.cjs`. Inspect reading and archive pages at 320px and desktop, keyboard focus, reduced motion and automated accessibility. Automated checks are not a complete accessibility conformance audit.

## Discovery edition

The discovery edition adds generous section spacing, rounded reading cards, a two-column introduction and a soft green research instrument panel. Existing paper, charcoal and red remain the base; deep green (#214c3e) identifies discovery actions, with light green (#e6e9de) grouping the search controls. On narrow screens, the introduction, instrument and results stack in reading order. The discovery search has explicit labels, announces result counts, handles empty and network-error states, and retains writing/science links without JavaScript. Python and Go are publication tools; visitors need only a browser.
