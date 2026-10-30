
#!/usr/bin/env python3
"""Convert publications.bib into publications.json for an academic website."""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import bibtexparser
    from bibtexparser.bparser import BibTexParser
except ImportError:
    sys.exit("Install the dependency first: python -m pip install bibtexparser")


def clean_text(value):
    """Remove common LaTeX formatting and decode common accented characters."""
    if value is None:
        return ""

    text = str(value).strip()

    # Decode common accents found in author names and titles.
    replacements = {
        r"{\'\i}": "í", r"\'e": "é",
        r"\'{a}": "á", r"\'{e}": "é", r"\'{i}": "í",
        r"\'{o}": "ó", r"\'{u}": "ú",
        r"\'{A}": "Á", r"\'{E}": "É", r"\'{I}": "Í",
        r"\'{o}": "ó",
        r"\~{n}": "ñ", r"\~n": "ñ",
        r'\"{a}': "ä", r'\"{o}': "ö", r'\"{u}': "ü",
        r"\c{c}": "ç",
        r"{\ss}": "ß",
        r"\&": "&", r"\%": "%", r"\_": "_",
        r"\#": "#", r"\$": "$",
        "~": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Preserve the contents of common LaTeX formatting commands.
    text = re.sub(
        r"\\(?:textbf|textit|emph|mathrm|mathbf|textsc|textrm)"
        r"\s*\{([^{}]*)\}",
        r"\1",
        text,
    )

    # Remove braces used to protect capitalization, e.g., {LTI}.
    text = text.replace("{", "").replace("}", "")
    return re.sub(r"\s+", " ", text).strip()


def parse_authors(author_string):
    """Convert BibTeX's 'and'-separated authors into a JSON array."""
    if not author_string:
        return []

    return [
        clean_text(author)
        for author in re.split(r"\s+and\s+", author_string)
        if author.strip()
    ]


def publication_type(entry_type):
    """Map BibTeX entry types to consistent website categories."""
    types = {
        "article": "journal",
        "inproceedings": "conference",
        "conference": "conference",
        "incollection": "book_chapter",
        "inbook": "book_chapter",
        "book": "book",
        "phdthesis": "thesis",
        "mastersthesis": "thesis",
        "techreport": "technical_report",
        "unpublished": "preprint",
        "misc": "other",
    }
    entry_type = entry_type.lower()
    return types.get(entry_type, entry_type)


def convert_entry(entry):
    """Convert one BibTeX entry into a website-friendly dictionary."""
    fields = {
        key.lower(): value
        for key, value in entry.items()
        if key not in ("ID", "ENTRYTYPE")
    }

    def get(name):
        return clean_text(fields.get(name, ""))

    year_match = re.search(r"\d{4}", get("year"))
    year = int(year_match.group()) if year_match else None

    publication = {
        "id": entry.get("ID", ""),
        "type": publication_type(entry.get("ENTRYTYPE", "misc")),
        "title": get("title"),
        "authors": parse_authors(str(fields.get("author", ""))),
        "year": year,
        "venue": get("journal") or get("booktitle"),
        "journal": get("journal"),
        "booktitle": get("booktitle"),
        "volume": get("volume"),
        "number": get("number"),
        "pages": get("pages"),
        "month": get("month"),
        "address": get("address"),
        "publisher": get("publisher") or get("organization"),
        "note": get("note"),
        "doi": get("doi"),
        "url": get("url"),
        "abstract": get("abstract"),
    }

    # Omit empty fields; keep year 0 and other valid numeric values.
    return {
        key: value
        for key, value in publication.items()
        if value not in ("", [], None)
    }


def convert_bibtex_to_json(input_path, output_path):
    """Read BibTeX, resolve string macros, and write sorted JSON."""
    input_path = Path(input_path)
    output_path = Path(output_path)

    if not input_path.is_file():
        raise FileNotFoundError(f"Cannot find input file: {input_path}")

    parser = BibTexParser(common_strings=True)
    parser.interpolate_strings = True

    with input_path.open("r", encoding="utf-8") as bib_file:
        database = bibtexparser.load(bib_file, parser=parser)

    publications = [convert_entry(entry) for entry in database.entries]

    # Newest publications first; unknown years appear last.
    publications.sort(
        key=lambda item: (
            item.get("year") is None,
            -(item.get("year") or 0),
            item.get("title", "").casefold(),
        )
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as json_file:
        json.dump(publications, json_file, indent=2, ensure_ascii=False)
        json_file.write("\n")

    print(
        f"Converted {len(publications)} publications "
        f"from {input_path} to {output_path}"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Convert a BibTeX bibliography to website JSON."
    )
    parser.add_argument(
        "input", nargs="?", default="publications.bib",
        help="Input BibTeX file (default: publications.bib)",
    )
    parser.add_argument(
        "output", nargs="?", default="publications.json",
        help="Output JSON file (default: publications.json)",
    )
    args = parser.parse_args()

    try:
        convert_bibtex_to_json(args.input, args.output)
    except (OSError, ValueError) as error:
        sys.exit(f"Error: {error}")


if __name__ == "__main__":
    main()
