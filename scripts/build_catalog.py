"""Build a deterministic, public discovery catalog; never include unpublished posts."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

def build(root):
    posts = json.loads((root / 'substack-posts.json').read_text())['posts']
    science = json.loads((root / 'data/science-cabinet.json').read_text())
    entries = []
    for post in posts:
        if post.get('status') != 'published':
            continue
        page = post['page']
        resolved = (root / page).resolve()
        if not resolved.is_relative_to((root / 'articles').resolve()) or not resolved.is_file():
            raise ValueError('Invalid published article path: ' + page)
        entries.append(dict(id=post['id'], title=post['title'], summary=post.get('excerpt', ''),
                            kind='Essay', url=page, date=post['date'], minutes=post.get('read_time', 0)))
    for podcast in science['podcasts']:
        url = urlsplit(podcast['url'])
        if url.scheme != 'https' or not url.netloc or url.username or url.password:
            raise ValueError('Invalid source URL: ' + podcast['url'])
        entries.append(dict(id='podcast-' + podcast['id'], title=podcast['title'],
                            summary=podcast['why'], kind='Podcast', url=podcast['url'],
                            date='', minutes=0))
    ids = [entry['id'] for entry in entries]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate catalog ID')
    return dict(version=1, count=len(entries), entries=entries)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'data/research-catalog.json')
    args = parser.parse_args()
    catalog = build(ROOT)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    print('Built %d published discovery entries' % catalog['count'])
