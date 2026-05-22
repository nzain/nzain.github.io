(function (global) {
  "use strict";

  function metaPair(label, value) {
    if (!value) {
      return "";
    }
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>";
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
    var metaRow1 =
      metaPair(SCG_I18N.t("castingTime"), spell.castTime) +
      metaPair(SCG_I18N.t("range"), spell.range);
    if (metaRow1) {
      var row1 = document.createElement("div");
      row1.className = "card-meta-row";
      row1.innerHTML = metaRow1;
      meta.appendChild(row1);
    }
    var metaRow2 = metaPair(SCG_I18N.t("duration"), spell.duration);
    if (metaRow2) {
      var row2 = document.createElement("div");
      row2.className = "card-meta-row";
      row2.innerHTML = metaRow2;
      meta.appendChild(row2);
    }
    if (spell.components) {
      var row3 = document.createElement("div");
      row3.className = "card-meta-row";
      row3.innerHTML = metaPair(SCG_I18N.t("components"), spell.components);
      meta.appendChild(row3);
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
      if (spell.classes) {
        var classesEl = document.createElement("span");
        classesEl.className = "card-footer-classes";
        classesEl.textContent = spell.classes;
        footer.appendChild(classesEl);
      }
      if (spell.school) {
        var schoolEl = document.createElement("span");
        schoolEl.className = "card-footer-school";
        schoolEl.textContent = spell.school;
        footer.appendChild(schoolEl);
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

  function renderGrid(container, spells, options) {
    options = options || {};
    var levelMin = options.levelMin != null ? options.levelMin : 0;
    var levelMax = options.levelMax != null ? options.levelMax : 9;
    container.innerHTML = "";

    var filtered = spells.filter(function (s) {
      return s.level >= levelMin && s.level <= levelMax;
    });

    if (!filtered.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = SCG_I18N.t("noSpells");
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
