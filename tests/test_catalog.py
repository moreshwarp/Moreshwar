import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('catalog', Path(__file__).resolve().parents[1] / 'scripts/build_catalog.py')
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)

class CatalogTests(unittest.TestCase):
    def fixture(self, root, posts):
        (root / 'data').mkdir()
        (root / 'articles').mkdir()
        (root / 'articles/ok.html').write_text('original')
        (root / 'substack-posts.json').write_text(json.dumps({'posts': posts}))
        (root / 'data/science-cabinet.json').write_text('{"podcasts":[]}')
    def test_drafts_are_excluded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.fixture(root, [{'status':'draft','page':'missing.html'}])
            self.assertEqual(catalog.build(root)['entries'], [])
    def test_missing_and_escaping_articles_fail(self):
        for page in ['articles/missing.html', '../escape.html']:
            with self.subTest(page=page), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                self.fixture(root, [{'status':'published','page':page}])
                with self.assertRaises(ValueError): catalog.build(root)
    def test_real_catalog_is_deterministic(self):
        self.assertEqual(catalog.build(catalog.ROOT), catalog.build(catalog.ROOT))
        self.assertGreater(catalog.build(catalog.ROOT)['count'], 22)

if __name__ == '__main__': unittest.main()
