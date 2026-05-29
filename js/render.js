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

  var CLASS_ICON_ORDER = [
    "bard",
    "druid",
    "cleric",
    "paladin",
    "ranger",
    "wizard",
    "sorcerer",
    "warlock",
  ];

  var CLASS_TOKEN_TO_ICON = {
    bard: "bard",
    druid: "druid",
    cleric: "cleric",
    paladin: "paladin",
    ranger: "ranger",
    wiz: "wizard",
    sorc: "sorcerer",
    warlock: "warlock",
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
    return "<dt>" + SCG_Util.escapeHtml(label) + "</dt><dd>" + SCG_Util.escapeHtml(value) + "</dd>";
  }

  function formatComponentsHtml(value) {
    return SCG_Util.escapeHtml(value).replace(/\([^)]*\)/g, function (segment) {
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
      SCG_Util.escapeHtml(label) +
      '">' +
      icon +
      "</dt><dd>" +
      (ddHtml != null ? ddHtml : SCG_Util.escapeHtml(value)) +
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
      while (row.length < cols) {
        row.push(null);
      }
      row.reverse();
      out.push.apply(out, row);
    }
    return out;
  }

  function appendPrintSheetBack(sheet, spell) {
    if (spell) {
      sheet.appendChild(buildCardBack(spell));
      return;
    }
    var spacer = document.createElement("div");
    spacer.className = "print-sheet-spacer";
    spacer.setAttribute("aria-hidden", "true");
    sheet.appendChild(spacer);
  }

  function buildCardBack(spell) {
    var article = document.createElement("article");
    article.className = "spell-card spell-card--back";

    var back = document.createElement("div");
    back.className = "card-back";

    var frame = document.createElement("div");
    frame.className = "card-back-frame";

    frame.appendChild(SCG_Borders.createBorderSvg());

    var content = document.createElement("div");
    content.className = "card-back-content";

    var topWrap = document.createElement("div");
    topWrap.className = "card-back-slot card-back-slot--top";

    var levelEl = document.createElement("span");
    levelEl.className = "card-back-level";
    levelEl.textContent = String(spell.level);
    topWrap.appendChild(levelEl);

    var slug = schoolToIconSlug(spell.school);
    if (slug) {
      var schoolImg = document.createElement("img");
      schoolImg.className = "card-back-school-icon";
      schoolImg.src = ICON_BASE + "/spell/" + slug + ".svg";
      schoolImg.alt = "";
      schoolImg.setAttribute("aria-hidden", "true");
      topWrap.appendChild(schoolImg);
    }
    content.appendChild(topWrap);

    var logoWrap = document.createElement("div");
    logoWrap.className = "card-back-slot card-back-slot--logo";
    var logoImg = document.createElement("img");
    logoImg.src = DND_LOGO_PATH;
    logoImg.alt = "";
    logoImg.setAttribute("aria-hidden", "true");
    logoWrap.appendChild(logoImg);
    content.appendChild(logoWrap);

    var classesWrap = document.createElement("div");
    classesWrap.className = "card-back-slot card-back-slot--classes";
    classesWrap.appendChild(buildCardBackClassGrid(spell));
    content.appendChild(classesWrap);

    frame.appendChild(content);

    back.appendChild(frame);
    article.appendChild(back);
    return article;
  }

  function buildCardEnglishName(spell) {
    var nameEn = spell && spell.nameEn ? String(spell.nameEn).trim() : "";
    if (!nameEn) {
      return null;
    }
    var el = document.createElement("p");
    el.className = "card-english-name";
    el.textContent = nameEn;
    return el;
  }

  function buildCard(spell, index) {
    var article = document.createElement("article");
    article.className = "spell-card";
    article.dataset.index = String(index);

    var face = document.createElement("div");
    face.className = "card-face";

    var header = document.createElement("header");
    header.className = "card-header";
    var nameEl = document.createElement("h2");
    nameEl.className = "card-name";
    nameEl.textContent = String(spell.level) + " " + spell.name;
    header.appendChild(nameEl);

    var overflowBadge = document.createElement("span");
    overflowBadge.className = "card-overflow-badge";
    overflowBadge.hidden = true;

    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "card-edit-btn";
    editBtn.dataset.index = String(index);
    editBtn.setAttribute("aria-label", SCG_I18N.t("editDescription"));
    editBtn.innerHTML =
      '<svg class="card-edit-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>' +
      "</svg>";

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
      if (spell.ritual) {
        var ritualEl = document.createElement("span");
        ritualEl.className = "card-footer-ritual";
        ritualEl.textContent = " (" + SCG_I18N.t("ritual") + ")";
        footer.appendChild(ritualEl);
      }
      footer.appendChild(buildClassIconRow(spell));
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
    article.appendChild(overflowBadge);
    article.appendChild(editBtn);

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
      var badge = card.querySelector(".card-overflow-badge");
      if (badge) {
        badge.textContent = SCG_I18N.t("overflow");
        badge.hidden = false;
      }
    } else {
      card.classList.remove("overflow-warning");
      delete card.dataset.overflowLabel;
      var overflowBadge = card.querySelector(".card-overflow-badge");
      if (overflowBadge) {
        overflowBadge.hidden = true;
        overflowBadge.textContent = "";
      }
    }
  }

  function checkAllOverflow(container) {
    container.querySelectorAll(".spell-card:not(.spell-card--back)").forEach(function (card) {
      checkOverflow(card);
    });
  }

  function buildClassIconRow(spell) {
    var tokens = parseSpellClasses(spell);
    var active = {};
    tokens.forEach(function (token) {
      var slug = CLASS_TOKEN_TO_ICON[token.toLowerCase()];
      if (slug) {
        active[slug] = true;
      }
    });
    var row = document.createElement("span");
    row.className = "card-footer-classes";
    CLASS_ICON_ORDER.forEach(function (slug) {
      var img = document.createElement("img");
      img.className =
        "card-footer-class-icon" +
        (active[slug] ? "" : " card-footer-class-icon--off");
      img.src = ICON_BASE + "/class/" + slug + ".svg";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      row.appendChild(img);
    });
    return row;
  }

  function buildCardBackClassGrid(spell) {
    var tokens = parseSpellClasses(spell);
    var active = {};
    tokens.forEach(function (token) {
      var slug = CLASS_TOKEN_TO_ICON[token.toLowerCase()];
      if (slug) {
        active[slug] = true;
      }
    });
    var grid = document.createElement("div");
    grid.className = "card-back-classes-grid";
    CLASS_ICON_ORDER.forEach(function (slug) {
      var img = document.createElement("img");
      img.className =
        "card-back-class-icon" +
        (active[slug] ? "" : " card-back-class-icon--off");
      img.src = ICON_BASE + "/class/" + slug + ".svg";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      grid.appendChild(img);
    });
    return grid;
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
    var selectedLevels = options.selectedLevels || null;
    var allLevelCount =
      options.allLevelCount != null
        ? options.allLevelCount
        : SCG_I18N.LEVEL_IDS.length;
    var levelFilterActive =
      selectedLevels &&
      selectedLevels.length &&
      selectedLevels.length < allLevelCount;
    var selectedClasses = options.classes || null;
    var allClassCount =
      options.allClassCount != null
        ? options.allClassCount
        : SCG_I18N.CLASS_IDS.length;
    var classFilterActive =
      selectedClasses &&
      selectedClasses.length &&
      selectedClasses.length < allClassCount;
    var selectedIndices = options.selectedIndices || null;
    var selectionActive = !!options.selectionActive;
    container.innerHTML = "";

    var visible = spells.filter(function (s) {
      if (levelFilterActive && selectedLevels.indexOf(s.level) < 0) {
        return false;
      }
      if (classFilterActive && !spellMatchesClassFilter(s, selectedClasses, allClassCount)) {
        return false;
      }
      return true;
    });

    if (!visible.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = spells.length
        ? SCG_I18N.t("noMatchFilter")
        : SCG_I18N.t("noSpells");
      container.appendChild(empty);
      return { printed: 0, total: spells.length };
    }

    var printable = selectionActive
      ? visible.filter(function (s) {
          return selectedIndices[String(spells.indexOf(s))];
        })
      : visible.slice();

    var perPage =
      (options.cardsPerRow || 3) * (options.cardsPerCol || 3);
    var cols = options.cardsPerRow || 3;

    var preview = document.createElement("div");
    preview.className = "cards-preview";
    if (selectionActive) {
      preview.classList.add("selection-active");
    }
    visible.forEach(function (spell) {
      var pair = document.createElement("div");
      pair.className = "card-pair";
      var idx = spells.indexOf(spell);
      pair.dataset.index = String(idx);
      if (selectionActive) {
        if (selectedIndices[String(idx)]) {
          pair.classList.add("card-pair--selected");
        } else {
          pair.classList.add("card-pair--dimmed");
        }
      }
      var englishName = buildCardEnglishName(spell);
      if (englishName) {
        pair.appendChild(englishName);
      }
      pair.appendChild(buildCard(spell, idx));
      pair.appendChild(buildCardBack(spell));
      preview.appendChild(pair);
    });
    container.appendChild(preview);

    for (var p = 0; p < printable.length; p += perPage) {
      var pageSpells = printable.slice(p, Math.min(p + perPage, printable.length));

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
        appendPrintSheetBack(backSheet, spell);
      });
      container.appendChild(backSheet);
    }

    requestAnimationFrame(function () {
      checkAllOverflow(container);
    });

    return { printed: printable.length, total: spells.length };
  }

  function applyCardDimensions(widthMm, heightMm) {
    document.documentElement.style.setProperty("--card-width-mm", String(widthMm));
    document.documentElement.style.setProperty("--card-height-mm", String(heightMm));
  }

  global.SCG_Render = {
    buildCard: buildCard,
    buildCardEnglishName: buildCardEnglishName,
    buildCardBack: buildCardBack,
    renderGrid: renderGrid,
    checkOverflow: checkOverflow,
    checkAllOverflow: checkAllOverflow,
    applyCardDimensions: applyCardDimensions,
    schoolToIconSlug: schoolToIconSlug,
  };
})(typeof window !== "undefined" ? window : this);
