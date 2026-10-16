# Nobel Science Source Policy

Reviewed: 2026-10-16

The Science & Ideas Nobel cards distinguish two types of evidence:

1. **Award evidence:** The official Nobel Prize press release for the relevant year and field. It establishes the recipient and reason for the prize.
2. **Education evidence:** An institutional biography of the specifically named scientist. A shared prize does not imply that all laureates studied at the same institution.

2026 official announcement pages:

- Physics: https://www.nobelprize.org/prizes/physics/2026/press-release/
- Chemistry: https://www.nobelprize.org/prizes/chemistry/2026/press-release/
- Physiology or Medicine: https://www.nobelprize.org/prizes/medicine/2026/press-release/

The content is maintained in `data/science-cabinet.json`, and the homepage includes a static fallback. Keep both in sync. The automated test `tests/nobel-official-sources.test.cjs` checks that award links in the data and homepage agree.

Update the review date only after checking sources. These links are not a real-time Nobel news feed.
