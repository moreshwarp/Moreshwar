package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCatalogGuards(t *testing.T) {
	root := t.TempDir()
	os.Mkdir(filepath.Join(root, "articles"), 0755)
	os.WriteFile(filepath.Join(root, "articles", "essay.html"), []byte("essay"), 0644)
	valid := Entry{ID: "one", Title: "Essay", Kind: "Essay", URL: "articles/essay.html"}
	cases := []struct {
		name    string
		entries []Entry
		count   int
		bad     bool
	}{
		{"published", []Entry{valid}, 1, false},
		{"missing", []Entry{{ID: "one", Title: "Missing", Kind: "Essay", URL: "articles/missing.html"}}, 1, true},
		{"traversal", []Entry{{ID: "one", Title: "Escape", Kind: "Essay", URL: "articles/../essay.html"}}, 1, true},
		{"duplicate", []Entry{valid, valid}, 2, true},
		{"count", []Entry{valid}, 2, true},
		{"script", []Entry{{ID: "one", Title: "Unsafe", Kind: "Podcast", URL: "javascript:alert(1)"}}, 1, true},
		{"credentials", []Entry{{ID: "one", Title: "Unsafe", Kind: "Podcast", URL: "https://user:pass@example.org"}}, 1, true},
		{"source", []Entry{{ID: "one", Title: "Source", Kind: "Podcast", URL: "https://example.org/podcast"}}, 1, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validate(root, Catalog{Version: 1, Count: tc.count, Entries: tc.entries})
			if (err != nil) != tc.bad {
				t.Fatalf("unexpected validation result: %v", err)
			}
		})
	}
}

func TestSymlinkEscape(t *testing.T) {
	root := t.TempDir()
	os.Mkdir(filepath.Join(root, "articles"), 0755)
	outside := filepath.Join(t.TempDir(), "private.html")
	os.WriteFile(outside, []byte("private"), 0644)
	if err := os.Symlink(outside, filepath.Join(root, "articles", "escape.html")); err != nil {
		t.Skip(err)
	}
	c := Catalog{Version: 1, Count: 1, Entries: []Entry{{ID: "escape", Title: "Escape", Kind: "Essay", URL: "articles/escape.html"}}}
	if err := validate(root, c); err == nil {
		t.Fatal("symlink escape accepted")
	}
}
