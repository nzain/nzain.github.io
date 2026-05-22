(function (global) {
  "use strict";

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

  function metaPairIcon(kind, value) {
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
      escapeHtml(value) +
      "</dd>"
    );
  }

  function metaStatIcon(kind, value, statClass) {
    var pair = metaPairIcon(kind, value);
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
    var componentsStat = "";
    if (spell.components) {
      componentsStat =
        '<div class="card-meta-stat card-meta-stat--components">' +
        metaValue(spell.components) +
        "</div>";
    }
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
    container.querySelectorAll(".spell-card").forEach(function (card) {
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
    for (var p = 0; p < filtered.length; p += perPage) {
      var sheet = document.createElement("div");
      sheet.className = "print-sheet";
      for (var i = p; i < Math.min(p + perPage, filtered.length); i++) {
        var idx = spells.indexOf(filtered[i]);
        sheet.appendChild(buildCard(filtered[i], idx));
      }
      container.appendChild(sheet);
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
    renderGrid: renderGrid,
    checkOverflow: checkOverflow,
    checkAllOverflow: checkAllOverflow,
    applyCardDimensions: applyCardDimensions,
  };
})(typeof window !== "undefined" ? window : this);
