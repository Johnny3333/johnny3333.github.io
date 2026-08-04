(function () {
  "use strict";

  const DATA_URL = "assets/data/proclip-pages.json";
  const PDF_URL = "assets/docs/ProCLIP.pdf";
  const input = document.getElementById("paperSearch");
  const results = document.getElementById("paperResults");
  const summary = document.getElementById("searchSummary");
  const frame = document.getElementById("paperFrame");
  const pageLabel = document.getElementById("readerPage");
  const sectionLabel = document.getElementById("readerSection");
  const shareButton = document.getElementById("shareSearch");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = themeToggle.querySelector("i");
  let pageData = [];
  let activePage = 1;
  let debounceTimer = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalize(value) {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function termsFromQuery(query) {
    const matches = query.match(/"[^"]+"|\S+/g) || [];
    return matches
      .map(function (term) {
        return term.replace(/^"|"$/g, "").trim();
      })
      .filter(Boolean);
  }

  function countOccurrences(haystack, needle) {
    let count = 0;
    let cursor = 0;
    while (needle && (cursor = haystack.indexOf(needle, cursor)) !== -1) {
      count += 1;
      cursor += Math.max(needle.length, 1);
    }
    return count;
  }

  function createSnippet(text, terms) {
    const normalizedText = normalize(text);
    let firstIndex = -1;
    terms.forEach(function (term) {
      const index = normalizedText.indexOf(normalize(term));
      if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
        firstIndex = index;
      }
    });

    const radius = 155;
    const start = Math.max(0, firstIndex === -1 ? 0 : firstIndex - radius);
    const end = Math.min(text.length, start + radius * 2 + 80);
    let snippet = text.slice(start, end).trim();
    if (start > 0) snippet = "…" + snippet;
    if (end < text.length) snippet += "…";

    let safe = escapeHtml(snippet);
    terms
      .slice()
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .forEach(function (term) {
        if (!term) return;
        safe = safe.replace(
          new RegExp("(" + escapeRegExp(escapeHtml(term)) + ")", "gi"),
          "<mark>$1</mark>"
        );
      });
    return safe;
  }

  function setTheme(isDark) {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    themeIcon.classList.toggle("fa-sun", isDark);
    themeIcon.classList.toggle("fa-moon", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  function setReaderPage(page, section, shouldFocus) {
    activePage = Number(page) || 1;
    frame.src = PDF_URL + "#page=" + activePage + "&view=FitH";
    pageLabel.textContent = "Page " + activePage + " of " + pageData.length;
    sectionLabel.textContent = section || "ProCLIP";
    document.querySelectorAll(".paper-result").forEach(function (button) {
      button.classList.toggle(
        "is-active",
        Number(button.getAttribute("data-page")) === activePage
      );
    });

    const params = new URLSearchParams(window.location.search);
    if (input.value.trim()) params.set("q", input.value.trim());
    else params.delete("q");
    params.set("page", String(activePage));
    window.history.replaceState({}, "", window.location.pathname + "?" + params);

    if (shouldFocus && window.innerWidth <= 1040) {
      document.querySelector(".paper-reader").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function renderOverview() {
    summary.textContent = "Search all 11 pages, including references.";
    results.innerHTML =
      '<div class="paper-empty">' +
      '<i class="fa-solid fa-book-open" aria-hidden="true"></i>' +
      "<strong>Explore the paper</strong>" +
      "<p>Enter a method, protein, dataset, metric, or author name. Try one of the suggested topics above.</p>" +
      "</div>";
  }

  function renderNoResults(query) {
    summary.innerHTML = 'No matches for <strong>“' + escapeHtml(query) + '”</strong>.';
    results.innerHTML =
      '<div class="paper-empty">' +
      '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      "<strong>No exact match</strong>" +
      "<p>Try a shorter term, remove quotation marks, or search for a related method or dataset.</p>" +
      "</div>";
  }

  function search(query) {
    const cleanQuery = query.trim();
    const terms = termsFromQuery(cleanQuery);
    if (!terms.length) {
      renderOverview();
      const params = new URLSearchParams(window.location.search);
      params.delete("q");
      params.set("page", String(activePage));
      window.history.replaceState({}, "", window.location.pathname + "?" + params);
      return;
    }

    const normalizedTerms = terms.map(normalize);
    const matches = pageData
      .map(function (page) {
        const searchable = normalize(page.section + " " + page.text);
        if (!normalizedTerms.every(function (term) { return searchable.includes(term); })) {
          return null;
        }
        const score = normalizedTerms.reduce(function (total, term) {
          return total + countOccurrences(searchable, term) * (term.includes(" ") ? 3 : 1);
        }, 0);
        return { page: page, score: score };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.score - a.score || a.page.page - b.page.page;
      });

    if (!matches.length) {
      renderNoResults(cleanQuery);
      return;
    }

    const matchLabel = matches.length === 1 ? "page" : "pages";
    summary.innerHTML =
      '<strong>' + matches.length + "</strong> matching " + matchLabel +
      ' for “' + escapeHtml(cleanQuery) + '”.';
    results.innerHTML = matches
      .map(function (match) {
        return (
          '<button class="paper-result" type="button" data-page="' +
          match.page.page +
          '">' +
          '<span class="paper-result-top">' +
          '<span class="paper-result-page">Page ' +
          match.page.page +
          "</span>" +
          '<span class="paper-result-section">' +
          escapeHtml(match.page.section) +
          "</span>" +
          "</span>" +
          "<p>" +
          createSnippet(match.page.text, terms) +
          "</p>" +
          "</button>"
        );
      })
      .join("");

    results.querySelectorAll(".paper-result").forEach(function (button) {
      button.addEventListener("click", function () {
        const page = Number(button.getAttribute("data-page"));
        const item = pageData.find(function (entry) { return entry.page === page; });
        setReaderPage(page, item ? item.section : "ProCLIP", true);
      });
    });

    const params = new URLSearchParams(window.location.search);
    params.set("q", cleanQuery);
    params.set("page", String(activePage));
    window.history.replaceState({}, "", window.location.pathname + "?" + params);
  }

  function initialize(data) {
    pageData = data.pages || [];
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";
    const requestedPage = Math.min(
      Math.max(Number(params.get("page")) || 1, 1),
      pageData.length || 1
    );
    const requested = pageData.find(function (page) {
      return page.page === requestedPage;
    });

    input.value = initialQuery;
    setReaderPage(requestedPage, requested ? requested.section : "ProCLIP", false);
    search(initialQuery);
  }

  input.addEventListener("input", function () {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(function () {
      search(input.value);
    }, 120);
  });

  document.querySelectorAll(".suggestion-chip").forEach(function (button) {
    button.addEventListener("click", function () {
      input.value = button.getAttribute("data-query") || button.textContent;
      search(input.value);
      input.focus();
    });
  });

  document.getElementById("jumpToSearch").addEventListener("click", function () {
    document.getElementById("searchWorkspace").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(function () { input.focus(); }, 350);
  });

  shareButton.addEventListener("click", function () {
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        shareButton.setAttribute("title", "Link copied");
        shareButton.setAttribute("aria-label", "Link copied");
        window.setTimeout(function () {
          shareButton.setAttribute("title", "Copy search link");
          shareButton.setAttribute("aria-label", "Copy search link");
        }, 1600);
      });
    } else {
      window.prompt("Copy this link:", url);
    }
  });

  themeToggle.addEventListener("click", function () {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(!isDark);
  });

  document.addEventListener("keydown", function (event) {
    const tagName = document.activeElement && document.activeElement.tagName;
    if (event.key === "/" && tagName !== "INPUT" && tagName !== "TEXTAREA") {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape" && document.activeElement === input) {
      input.value = "";
      search("");
      input.blur();
    }
  });

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme ? savedTheme === "dark" : prefersDark);

  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) throw new Error("Search data could not be loaded.");
      return response.json();
    })
    .then(initialize)
    .catch(function (error) {
      summary.textContent = "Search index unavailable.";
      results.innerHTML =
        '<div class="paper-empty"><strong>Search could not start</strong><p>' +
        escapeHtml(error.message) +
        "</p></div>";
    });
})();
