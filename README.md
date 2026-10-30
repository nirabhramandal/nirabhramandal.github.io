# Academic Portfolio Website

A responsive static academic website for GitHub Pages. It uses plain HTML, CSS, JavaScript, and JSON—**no Jekyll or build step is required**.

## Main files

- `index.html` — About page and recent news timeline
- `publications.html` — searchable, filterable publications
- `teaching.html` — Teaching, Professional Service, and Selected Awards
- `contact.html` — contact information
- `styles.css` — website styling
- `script.js` — navigation, publications, news, and teaching/service rendering
- `publications.json` — publication records
- `news.json` — news entries, grouped automatically by year and month
- `teaching.json` — teaching, professional service, and award entries
- `assets/` — profile photo and CV
- `publications.bib` and `scripts/bibtex_to_json.py` — BibTeX source and conversion helper

## Preview locally (no Jekyll)

Because the website loads JSON files using `fetch`, do not open `index.html` directly as a `file://` URL.

1. Open Terminal and change directory to this website folder.
2. Run:

   ```bash
   python3 -m http.server 8000
   ```

3. Open <http://localhost:8000/> in your browser.
4. Press `Ctrl+C` in Terminal when you want to stop the server.

## Update recent news

Edit `news.json`. Each entry needs a date in `YYYY-MM-DD` format, a short type, and a description. `url` and `linkText` are optional.

```json
{
  "date": "2026-10-15",
  "type": "Publication",
  "text": "Our paper was accepted at Example Conference.",
  "url": "https://example.com/paper",
  "linkText": "Read more"
}
```

The page automatically sorts entries newest-first, groups them by year, then by month, and lists all entries from each month under the month heading.

## Update teaching, professional service, and awards

Edit `teaching.json`. It has three arrays:

### Teaching

Each entry can use `course`, `role`, `term`, and `institution`.

```json
{
  "course": "Course title",
  "role": "Teaching Assistant",
  "term": "Fall 2026",
  "institution": "Purdue University"
}
```

### Professional service

Each entry can use `activity`, `organization`, `year`, and `details`. For example, `activity` could be `Journal reviewer`, `Conference reviewer`, or `Session chair`.

```json
{
  "activity": "Journal reviewer",
  "organization": "Journal name",
  "year": 2026,
  "details": "Optional additional detail"
}
```

### Selected awards

Each entry can use `award`, `organization`, and `year`.

```json
{
  "award": "Award name",
  "organization": "Awarding organization",
  "year": 2026
}
```

Use valid JSON syntax: double quotes around keys and text values, and no trailing comma after the final item. The three arrays can remain empty until you add your entries.

## Update publications

Edit `publications.json`. Each publication can include fields such as `title`, `authors`, `year`, `type`, `venue`, `abstract`, `doi`, `url`, `pdf`, `paper`, `arxiv`, `code`, `slides`, and `poster`. Optional fields can be omitted. Supported types include `Preprint`, `Journal`, `Conference`, and `Workshop`.

When **All** is selected, publications are grouped in this order: preprints, journals, conferences, then any other types. Within each type, the newest year appears first. The Workshop filter button is not displayed.

## Publish on GitHub Pages

Upload the contents of this folder to the root of your GitHub Pages repository and configure **Settings → Pages** to deploy from your chosen branch and root folder. Since the site is plain static HTML/CSS/JavaScript, no Jekyll templates or custom build step are needed.

GitHub Pages serves the website publicly. Do not place private data, credentials, or confidential drafts in this repository.
