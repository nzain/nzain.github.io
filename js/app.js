(function () {
  "use strict";

  var spells = [];
  var activeFilename = "";
  var parseErrors = [];
  var selectedClasses = {};
  var hasClassTags = false;

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.className = "status" + (isError ? " error" : "");
  }

  function setLog(errors) {
    if (!errors || !errors.length) {
      els.logPanel.hidden = true;
      els.logPanel.innerHTML = "";
      return;
    }
    els.logPanel.hidden = false;
    els.logPanel.innerHTML =
      "<strong>" + SCG_I18N.t("parseErrors") + ":</strong>" +
      errors.map(function (e) {
        return '<div class="log-line">' + escapeHtml(e) + "</div>";
      }).join("");
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function loadSettings() {
    try {
      var w = localStorage.getItem("scg-card-width");
      var h = localStorage.getItem("scg-card-height");
      var lang = localStorage.getItem("scg-ui-lang");
      if (w) {
        els.cardWidth.value = w;
      }
      if (h) {
        els.cardHeight.value = h;
      }
      if (lang) {
        els.uiLang.value = lang;
      }
    } catch (e) { /* ignore */ }
    applyDimensions();
  }

  function saveSettings() {
    try {
      localStorage.setItem("scg-card-width", els.cardWidth.value);
      localStorage.setItem("scg-card-height", els.cardHeight.value);
    } catch (e) { /* ignore */ }
    applyDimensions();
  }

  function applyDimensions() {
    var w = parseInt(els.cardWidth.value, 10) || 63;
    var h = parseInt(els.cardHeight.value, 10) || 88;
    SCG_Render.applyCardDimensions(w, h);
    if (els.grid) {
      requestAnimationFrame(function () {
        SCG_Render.checkAllOverflow(els.grid);
      });
    }
  }

  function spellsHaveClassTags(list) {
    return list.some(function (s) {
      return s.classes && String(s.classes).trim();
    });
  }

  function loadClassFilterState() {
    SCG_I18N.CLASS_IDS.forEach(function (id) {
      selectedClasses[id] = true;
    });
    try {
      var raw = localStorage.getItem("scg-class-filter");
      if (!raw) {
        return;
      }
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") {
        return;
      }
      SCG_I18N.CLASS_IDS.forEach(function (id) {
        if (Object.prototype.hasOwnProperty.call(saved, id)) {
          selectedClasses[id] = !!saved[id];
        }
      });
    } catch (e) { /* ignore */ }
  }

  function saveClassFilterState() {
    try {
      localStorage.setItem("scg-class-filter", JSON.stringify(selectedClasses));
    } catch (e) { /* ignore */ }
  }

  function getSelectedClassIds() {
    return SCG_I18N.CLASS_IDS.filter(function (id) {
      return selectedClasses[id];
    });
  }

  function syncClassChipStates() {
    if (!els.classFilterChips) {
      return;
    }
    els.classFilterChips.querySelectorAll(".class-chip-input").forEach(function (input) {
      input.checked = !!selectedClasses[input.dataset.classId];
    });
  }

  function buildClassFilterChips() {
    els.classFilterChips.innerHTML = "";
    SCG_I18N.CLASS_IDS.forEach(function (id) {
      var label = document.createElement("label");
      label.className = "class-chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "class-chip-input";
      input.dataset.classId = id;
      input.checked = !!selectedClasses[id];
      var text = document.createElement("span");
      text.className = "class-chip-label";
      text.textContent = SCG_I18N.classLabel(id);
      input.addEventListener("change", function () {
        selectedClasses[id] = input.checked;
        saveClassFilterState();
        render();
      });
      label.appendChild(input);
      label.appendChild(text);
      els.classFilterChips.appendChild(label);
    });
  }

  function setAllClassSelection(on) {
    SCG_I18N.CLASS_IDS.forEach(function (id) {
      selectedClasses[id] = on;
    });
    saveClassFilterState();
    syncClassChipStates();
    render();
  }

  function updateClassFilterVisibility() {
    if (!els.classFilterRow) {
      return;
    }
    els.classFilterRow.hidden = !hasClassTags;
  }

  function getRenderOptions() {
    return {
      levelMin: parseInt(els.levelMin.value, 10) || 0,
      levelMax: parseInt(els.levelMax.value, 10) || 9,
      classes: getSelectedClassIds(),
      allClassCount: SCG_I18N.CLASS_IDS.length,
    };
  }

  function updateSpellCount(stats) {
    els.spellCount.textContent = SCG_I18N.t("spellCount", {
      shown: stats.shown,
      total: stats.total,
    });
  }

  function updateActiveFileLabel() {
    if (activeFilename) {
      els.activeFile.textContent = activeFilename;
      els.activeFile.hidden = false;
    } else {
      els.activeFile.textContent = "";
      els.activeFile.hidden = true;
    }
  }

  function render() {
    var stats = SCG_Render.renderGrid(els.grid, spells, getRenderOptions());
    updateSpellCount(stats);
    requestAnimationFrame(function () {
      SCG_Render.checkAllOverflow(els.grid);
    });
  }

  function setSpells(newSpells, errors, filename) {
    spells = newSpells;
    parseErrors = errors || [];
    hasClassTags = spellsHaveClassTags(spells);
    if (filename) {
      activeFilename = filename;
    }
    setLog(parseErrors);
    updateActiveFileLabel();
    updateClassFilterVisibility();
    render();
    els.btnExport.disabled = !spells.length;
  }

  function onOpenClick() {
    els.fileInput.click();
  }

  function onFileSelected(ev) {
    var file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus(SCG_I18N.t("selectCsvOnly"), true);
      return;
    }
    SCG_CSV.decodeFile(file)
      .then(function (text) {
        var parsed = SCG_CSV.parseCsvText(text);
        setSpells(parsed.spells, parsed.errors, file.name);
        setStatus(SCG_I18N.t("loaded", { n: parsed.spells.length, file: file.name }));
      })
      .catch(function (err) {
        setStatus(String(err && err.message ? err.message : err), true);
      });
  }

  function onBodyEdit(ev) {
    var body = ev.target.closest(".card-body");
    if (!body) {
      return;
    }
    var idx = parseInt(body.dataset.index, 10);
    if (isNaN(idx) || !spells[idx]) {
      return;
    }
    spells[idx].description = body.innerHTML;
    if (!spells[idx].dirty) {
      spells[idx].dirty = true;
      body.closest(".spell-card").classList.add("dirty");
    }
    SCG_Render.checkOverflow(body.closest(".spell-card"));
  }

  function getExportSpells() {
    return spells.slice();
  }

  function onExport() {
    if (!spells.length) {
      return;
    }
    var out = SCG_CSV.exportBlob(getExportSpells(), activeFilename || "spells.csv");
    var url = URL.createObjectURL(out.blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = out.filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(SCG_I18N.t("exported", { file: out.filename }));
  }

  function onPrint() {
    SCG_Render.checkAllOverflow(els.grid);
    window.print();
  }

  function bindEvents() {
    els.btnOpen.addEventListener("click", onOpenClick);
    els.fileInput.addEventListener("change", onFileSelected);
    els.btnPrint.addEventListener("click", onPrint);
    els.btnExport.addEventListener("click", onExport);

    els.uiLang.addEventListener("change", function () {
      SCG_I18N.setLang(els.uiLang.value);
      buildClassFilterChips();
      render();
      updateActiveFileLabel();
    });

    els.levelMin.addEventListener("change", render);
    els.levelMax.addEventListener("change", render);
    els.classAll.addEventListener("click", function () {
      setAllClassSelection(true);
    });
    els.classNone.addEventListener("click", function () {
      setAllClassSelection(false);
    });
    els.cardWidth.addEventListener("change", saveSettings);
    els.cardHeight.addEventListener("change", saveSettings);

    els.grid.addEventListener("input", onBodyEdit);

    window.addEventListener("resize", function () {
      SCG_Render.checkAllOverflow(els.grid);
    });
  }

  function initEls() {
    els = {
      status: $("status"),
      logPanel: $("log-panel"),
      grid: $("cards-grid"),
      btnOpen: $("btn-open"),
      btnExport: $("btn-export"),
      fileInput: $("file-input"),
      activeFile: $("active-file"),
      uiLang: $("ui-lang"),
      levelMin: $("level-min"),
      levelMax: $("level-max"),
      cardWidth: $("card-width"),
      cardHeight: $("card-height"),
      btnPrint: $("btn-print"),
      spellCount: $("spell-count"),
      classFilterRow: $("class-filter-row"),
      classFilterChips: $("class-filter-chips"),
      classAll: $("class-all"),
      classNone: $("class-none"),
    };
  }

  function boot() {
    initEls();
    SCG_I18N.init();
    els.uiLang.value = SCG_I18N.getLang();
    loadSettings();
    loadClassFilterState();
    buildClassFilterChips();
    bindEvents();
    setStatus(SCG_I18N.t("openHint"));
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
