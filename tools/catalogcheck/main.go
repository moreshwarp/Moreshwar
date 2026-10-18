// catalogcheck validates the public discovery artifact without network access.
package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type Entry struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Kind  string `json:"kind"`
	URL   string `json:"url"`
}
type Catalog struct {
	Version int     `json:"version"`
	Count   int     `json:"count"`
	Entries []Entry `json:"entries"`
}

func validate(root string, catalog Catalog) error {
	if catalog.Version != 1 || catalog.Count != len(catalog.Entries) || catalog.Count == 0 {
		return fmt.Errorf("invalid catalog version/count")
	}
	seen := map[string]bool{}
	for _, e := range catalog.Entries {
		if strings.TrimSpace(e.ID) == "" || strings.TrimSpace(e.Title) == "" || seen[e.ID] {
			return fmt.Errorf("empty or duplicate entry: %q", e.ID)
		}
		seen[e.ID] = true
		u, err := url.Parse(e.URL)
		if err != nil {
			return fmt.Errorf("invalid URL for %s", e.ID)
		}
		switch e.Kind {
		case "Essay":
			clean := filepath.ToSlash(filepath.Clean(u.Path))
			if u.IsAbs() || u.Host != "" || u.RawQuery != "" || u.Fragment != "" || clean != e.URL || !strings.HasPrefix(clean, "articles/") || !strings.HasSuffix(clean, ".html") {
				return fmt.Errorf("unsafe article path: %s", e.URL)
			}
			file := filepath.Join(root, filepath.FromSlash(clean))
			resolved, err := filepath.EvalSymlinks(file)
			base, baseErr := filepath.EvalSymlinks(filepath.Join(root, "articles"))
			if baseErr == nil {
				base, baseErr = filepath.Abs(base)
			}
			if err != nil || baseErr != nil {
				return fmt.Errorf("missing article: %s", e.URL)
			}
			resolved, err = filepath.Abs(resolved)
			rel, relErr := filepath.Rel(base, resolved)
			info, statErr := os.Stat(resolved)
			if err != nil || relErr != nil || strings.HasPrefix(rel, "..") || statErr != nil || !info.Mode().IsRegular() {
				return fmt.Errorf("article outside content root: %s", e.URL)
			}
		case "Podcast":
			if u.Scheme != "https" || u.Hostname() == "" || u.User != nil {
				return fmt.Errorf("unsafe source URL: %s", e.URL)
			}
		default:
			return fmt.Errorf("unknown catalog kind: %s", e.Kind)
		}
	}
	return nil
}
func main() {
	root := "."
	if len(os.Args) > 1 {
		root = os.Args[1]
	}
	raw, err := os.ReadFile(filepath.Join(root, "data/research-catalog.json"))
	if err == nil {
		var c Catalog
		err = json.Unmarshal(raw, &c)
		if err == nil {
			err = validate(root, c)
			if err == nil {
				fmt.Printf("Validated %d research entries\n", c.Count)
			}
		}
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
