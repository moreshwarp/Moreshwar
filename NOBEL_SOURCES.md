# Nobel Science Source Policy

Reviewed: 2026-10-17

**What a link proves matters.** The three 2026 Science & Ideas stories distinguish:

1. **Award evidence:** reporting from the institution responsible for the award. For Physics and Chemistry, the Royal Swedish Academy of Sciences publishes its own dated official press releases. For Physiology or Medicine, Karolinska Institutet publishes a dated, institution-authored account of the Nobel Assembly's award. The latter is an institutional news report, **not** the Nobel Assembly's original press release.
2. **Education evidence:** a separate institutional biography or university announcement for the named individual. A co-award does not mean the recipients studied together.
3. **Learning interpretation:** short stories and takeaways are educational summaries, not Nobel Committee quotations, experimental data or claims of the owner's work.

## Verified awarding-institution sources

- **Physics (6 October 2026):** https://www.kva.se/en/news/the-nobel-prize-in-physics-2026/ — Royal Swedish Academy of Sciences official press release.
- **Chemistry (7 October 2026):** https://www.kva.se/en/news/the-nobel-prize-in-chemistry-2026/ — Royal Swedish Academy of Sciences official press release; also lists Soai's PhD in 1979.
- **Physiology or Medicine (6 October 2026, updated 8 October):** https://news.ki.se/the-discovery-sheds-light-on-the-brains-mysteries-there-is-a-before-and-an-after — Karolinska Institutet institutional reporting on the 5 October award, including the three laureates' education.

The official NobelPrize.org 2026 press-release URLs were not independently retrievable during the review, so this update **does not label untested URLs as verified**. The above three awarding-institution pages were retrievable and checked against laureate names, category and discovery. The external links are curated, not a real-time Nobel feed.

The catalog is in `data/science-cabinet.json` and the homepage has static fallback cards. Keep both in sync. The regression test `tests/nobel-official-sources.test.cjs` checks the three source URLs and labels in both the fallback and the JavaScript rendering. Update `reviewedOn` only after checking the sources again.
