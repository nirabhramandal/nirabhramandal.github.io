/*
 * Publications and navigation script for the academic portfolio.
 *
 * Required files:
 *   index.html
 *   publications.json
 *   script.js
 */

"use strict";

const publicationList = document.getElementById("publication-list");
const searchInput = document.getElementById("publication-search");
const resultCount = document.getElementById("result-count");
const filterButtons = Array.from(document.querySelectorAll(".filter"));

let publications = [];
let selectedType = "all";
let currentlyOpenAbstract = null;

function showPublicationMessage(message) {
  if (!publicationList) return;

  publicationList.replaceChildren();

  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  publicationList.append(element);

  if (resultCount) resultCount.textContent = "";
}

function asText(value) {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(", ");
  }

  return String(value);
}

function safeLink(url, label, options = {}) {
  let value = asText(url).trim();
  if (!value) return null;

  // Accept bare DOI values and complete DOI URLs.
  if (options.doi) {
    value = value.replace(/^doi:\s*/i, "");
    value = value.replace(
      /^https?:\/\/(?:dx\.)?doi\.org\//i,
      ""
    );
    value = `https://doi.org/${value}`;
  }

  try {
    const parsed = new URL(value, window.location.href);

    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return null;
    }

    const anchor = document.createElement("a");
    anchor.href = parsed.href;
    anchor.textContent = label;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    return anchor;
  } catch (error) {
    console.warn(`Invalid ${label} link:`, value, error);
    return null;
  }
}

function getSearchableText(publication) {
  return [
    publication.title,
    publication.authors,
    publication.venue,
    publication.year,
    publication.type,
    publication.abstract,
    publication.keywords
  ]
    .map(asText)
    .join(" ")
    .toLowerCase();
}

function normalizeType(publication) {
  const type = asText(publication.type).trim().toLowerCase();

  if (type.includes("journal")) return "journal";
  if (type.includes("conference") || type.includes("proceedings")) {
    return "conference";
  }
  if (type.includes("preprint") || type.includes("arxiv")) {
    return "preprint";
  }
  if (type.includes("workshop")) return "workshop";

  return type;
}

function renderPublications() {
  if (!publicationList) {
    console.error("Missing HTML element: #publication-list");
    return;
  }

  // Close any open abstract when the list is rerendered.
  currentlyOpenAbstract = null;

  const query = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const typeOrder = {
    preprint: 0,
    journal: 1,
    conference: 2,
    workshop: 3
  };

  const filtered = publications
    .filter((publication) => {
      const type = normalizeType(publication);
      return selectedType === "all" || type === selectedType;
    })
    .filter((publication) =>
      getSearchableText(publication).includes(query)
    )
    .sort((a, b) => {
      const typeA = normalizeType(a);
      const typeB = normalizeType(b);

      const orderA = typeOrder[typeA] ?? 4;
      const orderB = typeOrder[typeB] ?? 4;

      // When All is selected, group by type.
      if (selectedType === "all" && orderA !== orderB) {
        return orderA - orderB;
      }

      // Newest publications first within each type.
      const yearA = Number.parseInt(a.year, 10) || 0;
      const yearB = Number.parseInt(b.year, 10) || 0;

      if (yearA !== yearB) return yearB - yearA;

      return asText(a.title).localeCompare(asText(b.title));
    });

  publicationList.replaceChildren();

  if (resultCount) {
    resultCount.textContent =
      `${filtered.length} publication${filtered.length === 1 ? "" : "s"}`;
  }

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = publications.length
      ? "No publications match this search. Try another keyword or filter."
      : "No publications are listed in publications.json yet.";

    publicationList.append(empty);
    return;
  }

  filtered.forEach((publication, index) => {
    const article = document.createElement("article");
    article.className = "paper";

    // Publication type and year.
    const meta = document.createElement("div");
    meta.className = "paper-meta";

    const type = document.createElement("span");
    type.className = "paper-type";
    type.textContent = asText(publication.type) || "Publication";
    meta.append(type);

    const year = document.createElement("span");
    year.className = "paper-year";
    year.textContent = asText(publication.year);
    meta.append(year);

    // Title.
    const title = document.createElement("h3");
    title.textContent = asText(publication.title) || "Untitled paper";

    // Authors.
    const authors = document.createElement("p");
    authors.className = "authors";
    authors.textContent = asText(publication.authors);

    // Journal or conference.
    const venue = document.createElement("p");
    venue.className = "venue";
    venue.textContent = asText(publication.venue);

    article.append(meta, title, authors, venue);

    // Shared row for the abstract button and publication links.
    const actionRow = document.createElement("div");
    actionRow.className = "paper-actions";

    // Abstract panel: hidden until its button is clicked.
    const abstractText = asText(publication.abstract).trim();
    let abstractPanelForArticle = null;

    if (abstractText) {
      const abstractId = `publication-abstract-${index}`;

      const abstractButton = document.createElement("button");
      abstractButton.type = "button";
      abstractButton.className = "abstract-toggle";
      abstractButton.textContent = "Show abstract";
      abstractButton.setAttribute("aria-expanded", "false");
      abstractButton.setAttribute("aria-controls", abstractId);

      const abstractPanel = document.createElement("div");
      abstractPanel.className = "abstract-panel";
      abstractPanel.id = abstractId;
      abstractPanel.hidden = true;

      const abstract = document.createElement("p");
      abstract.className = "abstract";
      abstract.textContent = abstractText;

      abstractPanel.append(abstract);
      abstractPanelForArticle = abstractPanel;

      abstractButton.addEventListener("click", () => {
        const shouldOpen = abstractPanel.hidden;

        // Close the previously opened abstract, if any.
        if (
          currentlyOpenAbstract &&
          currentlyOpenAbstract !== abstractPanel
        ) {
          const previousButton =
            currentlyOpenAbstract._toggleButton;

          currentlyOpenAbstract.hidden = true;

          if (previousButton) {
            previousButton.textContent = "Show abstract";
            previousButton.setAttribute("aria-expanded", "false");
          }
        }

        // Toggle the selected abstract.
        abstractPanel.hidden = !shouldOpen;

        abstractButton.textContent = shouldOpen
          ? "Hide abstract"
          : "Show abstract";

        abstractButton.setAttribute(
          "aria-expanded",
          String(shouldOpen)
        );

        currentlyOpenAbstract = shouldOpen
          ? abstractPanel
          : null;
      });

      // Store the button so another abstract can close it accessibly.
      abstractPanel._toggleButton = abstractButton;

      // Add the abstract button to the shared action row.
      actionRow.append(abstractButton);

    }

    // Available publication links.
    const links = document.createElement("div");
    links.className = "paper-links";

    const linkFields = [
      ["pdf", "PDF", false],
      ["paper", "Paper", false],
      ["url", "Link", false],
      ["website", "Website", false],
      ["arxiv", "arXiv", false],
      ["doi", "DOI", true],
      ["code", "Code", false],
      ["slides", "Slides", false],
      ["poster", "Poster", false]
    ];

    // Avoid displaying the same destination more than once.
    const seenHrefs = new Set();

    linkFields.forEach(([key, label, isDoi]) => {
      const link = safeLink(publication[key], label, {
        doi: isDoi
      });

      if (link && !seenHrefs.has(link.href)) {
        seenHrefs.add(link.href);
        links.append(link);
      }
    });

    // Put links beside Show abstract in the same row.
    if (links.childElementCount > 0) {
      actionRow.append(links);
    }

    // Add the row if it contains at least one button or link.
    if (actionRow.childElementCount > 0) {
      article.append(actionRow);
    }

    // Keep the expandable abstract underneath its action row.
    if (abstractPanelForArticle) article.append(abstractPanelForArticle);

    publicationList.append(article);
  });
}

async function loadPublications() {
  if (!publicationList) return;

  // Resolve publications.json relative to the current HTML page.
  const dataUrl = new URL("publications.json", document.baseURI);

  try {
    const response = await fetch(dataUrl.href, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText} ` +
        `while loading ${dataUrl.pathname}.`
      );
    }

    const rawText = await response.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (error) {
      const looksLikeHtml = /^\s*(<!doctype html|<html)/i.test(rawText);

      throw new Error(
        looksLikeHtml
          ? `The server returned HTML instead of JSON. Check the path to ${dataUrl.pathname}.`
          : `Invalid JSON in publications.json: ${error.message}`
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "publications.json must contain an array of publication objects."
      );
    }

    publications = data.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
    );

    renderPublications();
  } catch (error) {
    console.error("Failed to load publications:", error);

    let message = "Publications could not be loaded. ";

    if (error instanceof TypeError) {
      message +=
        "The browser could not fetch publications.json. Check the file path, GitHub Pages deployment, and browser console.";
    } else {
      message += error.message || "Check the browser console for details.";
    }

    showPublicationMessage(message);
  }
}

// Publication search.
if (searchInput) {
  searchInput.addEventListener("input", renderPublications);
}

// Publication-type filters.
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedType =
      asText(button.dataset.type || "all").trim().toLowerCase() ||
      "all";

    filterButtons.forEach((candidate) => {
      const active = candidate === button;

      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });

    renderPublications();
  });
});

// Optional mobile navigation.
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Automatically update the copyright year.
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

// Load publications when the script runs.
loadPublications();


async function loadNews() {
  const newsList = document.getElementById("news-list");
  if (!newsList) return;

  try {
    const response = await fetch(new URL("news.json", document.baseURI), {
      cache: "no-cache"
    });
    if (!response.ok) {
      throw new Error(`Could not load news.json (${response.status})`);
    }

    const news = await response.json();
    if (!Array.isArray(news)) {
      throw new Error("news.json must contain a JSON array.");
    }

    const validNews = news.filter((item) =>
      item &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    );

    validNews.sort((a, b) => b.date.localeCompare(a.date));

    // Group first by year, then by month.
    const newsByYear = new Map();
    for (const item of validNews) {
      const [year, month] = item.date.split("-");
      if (!newsByYear.has(year)) newsByYear.set(year, new Map());
      const months = newsByYear.get(year);
      if (!months.has(month)) months.set(month, []);
      months.get(month).push(item);
    }

    newsList.replaceChildren();
    if (newsByYear.size === 0) {
      newsList.textContent = "No news items available yet.";
      return;
    }

    const monthFormatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "UTC"
    });

    for (const [year, months] of newsByYear) {
      const yearSection = document.createElement("section");
      yearSection.className = "news-year";

      const yearHeading = document.createElement("h3");
      yearHeading.className = "news-year-heading";
      yearHeading.textContent = year;
      yearSection.appendChild(yearHeading);

      for (const [month, items] of months) {
        const monthArticle = document.createElement("article");
        monthArticle.className = "news-month";

        const monthDate = document.createElement("time");
        monthDate.className = "news-date";
        monthDate.dateTime = `${year}-${month}`;
        monthDate.textContent = monthFormatter.format(
          new Date(Date.UTC(Number(year), Number(month) - 1, 1))
        );

        const content = document.createElement("div");
        content.className = "news-content";
        const entries = document.createElement("ul");
        entries.className = "news-entries";

        for (const item of items) {
          const entry = document.createElement("li");
          entry.className = "news-entry";

          if (item.type) {
            const type = document.createElement("strong");
            type.textContent = `${item.type}: `;
            entry.appendChild(type);
          }

          entry.appendChild(document.createTextNode(item.text || ""));

          if (item.url) {
            const link = document.createElement("a");
            link.href = item.url;
            link.textContent = ` ${item.linkText || "Read more"} ↗`;

            if (/^https?:\/\//i.test(item.url)) {
              link.target = "_blank";
              link.rel = "noopener noreferrer";
            }

            entry.appendChild(link);
          }

          entries.appendChild(entry);
        }

        content.appendChild(entries);
        monthArticle.append(monthDate, content);
        yearSection.appendChild(monthArticle);
      }

      newsList.appendChild(yearSection);
    }
  } catch (error) {
    console.error("Error loading news:", error);
    newsList.textContent = "News could not be loaded. Please try again later.";
  }
}

loadNews();


/* Teaching and professional service */
async function loadTeachingAndService() {
  const container = document.getElementById("teaching-data");
  if (!container) return;

  try {
    const response = await fetch(new URL("teaching.json", document.baseURI), {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Could not load teaching.json (${response.status})`);
    }

    const data = await response.json();
    container.replaceChildren();

    const sections = [
      {
        key: "teaching",
        title: "Teaching",
        empty: "Teaching entries will appear here when added to teaching.json.",
        render(item) {
          const heading = item.course || "Course title";
          const detail = [item.role, item.term, item.institution]
            .filter(Boolean)
            .join(" · ");

          return { heading, detail };
        }
      },
      {
        key: "professionalService",
        title: "Professional service",
        empty: "Professional service entries will appear here when added to teaching.json.",
        render(item) {
          const heading = item.activity || item.role || "Professional service";
          const detail = Array.isArray(item.items)
            ? item.items.join(" · ")
            : "";

          return { heading, detail };
        }
      }
    ];

    for (const sectionInfo of sections) {
      const section = document.createElement("section");
      section.className = "teaching-category";

      const heading = document.createElement("h2");
      heading.textContent = sectionInfo.title;
      section.appendChild(heading);

      const items = Array.isArray(data[sectionInfo.key])
        ? data[sectionInfo.key]
        : [];

      if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "teaching-empty";
        empty.textContent = sectionInfo.empty;
        section.appendChild(empty);
      } else {
        const list = document.createElement("ul");
        list.className = "teaching-list";

        for (const item of items) {
          const li = document.createElement("li");
          const rendered = sectionInfo.render(item);

          const itemHeading = document.createElement("strong");
          itemHeading.textContent = rendered.heading;
          li.appendChild(itemHeading);

          if (rendered.detail) {
            li.appendChild(
              document.createTextNode(` — ${rendered.detail}`)
            );
          }

          list.appendChild(li);
        }

        section.appendChild(list);
      }

      container.appendChild(section);
    }
  } catch (error) {
    console.error("Error loading teaching.json:", error);
    container.textContent =
      "Teaching and service information could not be loaded. Please try again later.";
  }
}

loadTeachingAndService();

