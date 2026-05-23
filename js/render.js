(function (global) {
  "use strict";

  var ICON_BASE = "Externals/tw-dnd/icons";
  var DND_LOGO_PATH = ICON_BASE + "/logo/dnd.svg";

  var SCHOOL_TO_SLUG = {
    abjuration: "abjuration",
    abwehr: "abjuration",
    bannzauber: "abjuration",
    conjuration: "conjuration",
    beschwoerung: "conjuration",
    divination: "divination",
    erkenntnis: "divination",
    enchantment: "enchantment",
    verzauberung: "enchantment",
    evocation: "evocation",
    hervorrufung: "evocation",
    illusion: "illusion",
    necromancy: "necromancy",
    nekromantie: "necromancy",
    transmutation: "transmutation",
    verwandlung: "transmutation",
  };

  var META_ICONS = {
    castingTime:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
      '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M6 4v2.5l1.75 1.25" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' +
      "</svg>",
    range:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
      '<path d="M2 6h5M6 3.5L10 6M6 8.5L10 6" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>",
    duration:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
      '<path d="M2.5 2h7L6 6l3.5 4h-7L6 6 2.5 2z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>' +
      "</svg>",
    components:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
      '<path d="M3.25 2.5h5.25v7H3.25z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M3.25 2.5v7" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M5.25 5.25h3.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' +
      "</svg>",
  };

  function metaPair(label, value) {
    if (!value) {
      return "";
    }
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>";
  }

  function metaValue(value) {
    if (!value) {
      return "";
    }
    return "<dd>" + escapeHtml(value) + "</dd>";
  }

  function formatComponentsHtml(value) {
    return escapeHtml(value).replace(/\([^)]*\)/g, function (segment) {
      return "<b>" + segment + "</b>";
    });
  }

  function metaPairIcon(kind, value, ddHtml) {
    if (!value) {
      return "";
    }
    var icon = META_ICONS[kind];
    if (!icon) {
      return metaPair(SCG_I18N.t(kind), value);
    }
    var label = SCG_I18N.t(kind);
    return (
      '<dt class="card-meta-label card-meta-label--icon" aria-label="' +
      escapeHtml(label) +
      '">' +
      icon +
      "</dt><dd>" +
      (ddHtml != null ? ddHtml : escapeHtml(value)) +
      "</dd>"
    );
  }

  function metaStatIcon(kind, value, statClass, ddHtml) {
    var pair = metaPairIcon(kind, value, ddHtml);
    if (!pair) {
      return "";
    }
    var cls = "card-meta-stat" + (statClass ? " " + statClass : "");
    return '<div class="' + cls + '">' + pair + "</div>";
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function normalizeSchoolKey(school) {
    return String(school || "")
      .trim()
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
  }

  function schoolToIconSlug(school) {
    if (!school) {
      return null;
    }
    return SCHOOL_TO_SLUG[normalizeSchoolKey(school)] || null;
  }

  function mirrorColumnsForDuplex(spells, cols) {
    var out = [];
    for (var i = 0; i < spells.length; i += cols) {
      var row = spells.slice(i, i + cols);
      out.push.apply(out, row.reverse());
    }
    return out;
  }

  function buildCardBack(spell) {
    var article = document.createElement("article");
    article.className = "spell-card spell-card--back";

    var back = document.createElement("div");
    back.className = "card-back";

    var frame = document.createElement("div");
    frame.className = "card-back-frame";

    var levelWrap = document.createElement("div");
    levelWrap.className = "card-back-slot card-back-slot--level";
    var levelEl = document.createElement("span");
    levelEl.className = "card-back-level";
    levelEl.textContent = String(spell.level);
    levelWrap.appendChild(levelEl);
    frame.appendChild(levelWrap);

    var slug = schoolToIconSlug(spell.school);
    var schoolWrap = document.createElement("div");
    schoolWrap.className = "card-back-slot card-back-slot--school";
    if (slug) {
      var schoolImg = document.createElement("img");
      schoolImg.src = ICON_BASE + "/spell/" + slug + ".svg";
      schoolImg.alt = "";
      schoolImg.setAttribute("aria-hidden", "true");
      schoolWrap.appendChild(schoolImg);
    }
    frame.appendChild(schoolWrap);

    var logoWrap = document.createElement("div");
    logoWrap.className = "card-back-slot card-back-slot--logo";
    var logoImg = document.createElement("img");
    logoImg.src = DND_LOGO_PATH;
    logoImg.alt = "";
    logoImg.setAttribute("aria-hidden", "true");
    logoWrap.appendChild(logoImg);
    frame.appendChild(logoWrap);

    back.appendChild(frame);
    article.appendChild(back);
    return article;
  }

  function buildCard(spell, index) {
    var article = document.createElement("article");
    article.className = "spell-card";
    article.dataset.index = String(index);
    if (spell.dirty) {
      article.classList.add("dirty");
    }

    var face = document.createElement("div");
    face.className = "card-face";

    var header = document.createElement("header");
    header.className = "card-header";
    var nameEl = document.createElement("h2");
    nameEl.className = "card-name";
    nameEl.textContent = String(spell.level) + " " + spell.name;
    header.appendChild(nameEl);

    var meta = document.createElement("dl");
    meta.className = "card-meta";
    var castStat = metaStatIcon("castingTime", spell.castTime);
    var rangeStat = metaStatIcon("range", spell.range, "card-meta-stat--range");
    if (castStat || rangeStat) {
      var row1 = document.createElement("div");
      row1.className = "card-meta-row card-meta-row--split";
      row1.innerHTML = castStat + rangeStat;
      meta.appendChild(row1);
    }
    var durationStat = metaStatIcon("duration", spell.duration);
    var componentsStat = metaStatIcon(
      "components",
      spell.components,
      "card-meta-stat--components",
      spell.components ? formatComponentsHtml(spell.components) : null
    );
    if (durationStat || componentsStat) {
      var row2 = document.createElement("div");
      row2.className = "card-meta-row card-meta-row--split";
      row2.innerHTML = durationStat + componentsStat;
      meta.appendChild(row2);
    }

    var body = document.createElement("div");
    body.className = "card-body";
    body.contentEditable = "true";
    body.spellcheck = true;
    body.dataset.index = String(index);
    body.innerHTML = SCG_Sanitize.sanitizeDescription(spell.description);

    var footer = null;
    if (spell.classes || spell.school) {
      footer = document.createElement("footer");
      footer.className = "card-footer";
      if (spell.school) {
        var schoolEl = document.createElement("span");
        schoolEl.className = "card-footer-school";
        schoolEl.textContent = spell.school;
        footer.appendChild(schoolEl);
      }
      if (spell.classes) {
        var classesEl = document.createElement("span");
        classesEl.className = "card-footer-classes";
        classesEl.textContent = spell.classes;
        footer.appendChild(classesEl);
      }
    }

    face.appendChild(header);
    face.appendChild(meta);
    face.appendChild(body);
    if (footer) {
      face.appendChild(footer);
    }

    var guide = document.createElement("div");
    guide.className = "card-bounds-guide";
    guide.setAttribute("aria-hidden", "true");

    article.appendChild(face);
    article.appendChild(guide);

    return article;
  }

  function checkOverflow(card) {
    if (card.classList.contains("spell-card--back")) {
      return;
    }
    var face = card.querySelector(".card-face");
    var guide = card.querySelector(".card-bounds-guide");
    if (!face || !guide) {
      return;
    }
    if (face.offsetHeight > guide.offsetHeight + 2) {
      card.classList.add("overflow-warning");
      card.dataset.overflowLabel = SCG_I18N.t("overflow");
    } else {
      card.classList.remove("overflow-warning");
      delete card.dataset.overflowLabel;
    }
  }

  function checkAllOverflow(container) {
    container.querySelectorAll(".spell-card:not(.spell-card--back)").forEach(function (card) {
      checkOverflow(card);
    });
  }

  function parseSpellClasses(spell) {
    if (!spell || !spell.classes) {
      return [];
    }
    return String(spell.classes)
      .split(",")
      .map(function (c) {
        return c.trim();
      })
      .filter(Boolean);
  }

  function spellMatchesClassFilter(spell, selectedClasses, allClassCount) {
    if (!selectedClasses || !selectedClasses.length) {
      return false;
    }
    if (selectedClasses.length >= allClassCount) {
      return true;
    }
    var spellClasses = parseSpellClasses(spell);
    if (!spellClasses.length) {
      return false;
    }
    return selectedClasses.some(function (cls) {
      return spellClasses.indexOf(cls) >= 0;
    });
  }

  function renderGrid(container, spells, options) {
    options = options || {};
    var levelMin = options.levelMin != null ? options.levelMin : 0;
    var levelMax = options.levelMax != null ? options.levelMax : 9;
    var selectedClasses = options.classes || null;
    var allClassCount =
      options.allClassCount != null
        ? options.allClassCount
        : SCG_I18N.CLASS_IDS.length;
    var classFilterActive =
      selectedClasses &&
      selectedClasses.length &&
      selectedClasses.length < allClassCount;
    container.innerHTML = "";

    var filtered = spells.filter(function (s) {
      if (s.level < levelMin || s.level > levelMax) {
        return false;
      }
      if (classFilterActive && !spellMatchesClassFilter(s, selectedClasses, allClassCount)) {
        return false;
      }
      return true;
    });

    if (!filtered.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = spells.length
        ? SCG_I18N.t("noMatchFilter")
        : SCG_I18N.t("noSpells");
      container.appendChild(empty);
      return { shown: 0, total: spells.length };
    }

    var perPage =
      (options.cardsPerRow || 3) * (options.cardsPerCol || 3);
    var cols = options.cardsPerRow || 3;
    for (var p = 0; p < filtered.length; p += perPage) {
      var pageSpells = filtered.slice(p, Math.min(p + perPage, filtered.length));

      var frontSheet = document.createElement("div");
      frontSheet.className = "print-sheet print-sheet--front";
      pageSpells.forEach(function (spell) {
        var idx = spells.indexOf(spell);
        frontSheet.appendChild(buildCard(spell, idx));
      });
      container.appendChild(frontSheet);

      var backSheet = document.createElement("div");
      backSheet.className = "print-sheet print-sheet--back";
      mirrorColumnsForDuplex(pageSpells, cols).forEach(function (spell) {
        backSheet.appendChild(buildCardBack(spell));
      });
      container.appendChild(backSheet);
    }

    requestAnimationFrame(function () {
      checkAllOverflow(container);
    });

    return { shown: filtered.length, total: spells.length };
  }

  function applyCardDimensions(widthMm, heightMm) {
    document.documentElement.style.setProperty("--card-width-mm", String(widthMm));
    document.documentElement.style.setProperty("--card-height-mm", String(heightMm));
  }

  global.SCG_Render = {
    buildCard: buildCard,
    buildCardBack: buildCardBack,
    renderGrid: renderGrid,
    checkOverflow: checkOverflow,
    checkAllOverflow: checkAllOverflow,
    applyCardDimensions: applyCardDimensions,
    schoolToIconSlug: schoolToIconSlug,
  };
})(typeof window !== "undefined" ? window : this);
