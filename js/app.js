(function () {
  "use strict";

  var spells = [];
  var activeFilename = "";
  var parseErrors = [];
  var selectedClasses = {};
  var selectedLevels = {};
  var hasClassTags = false;
  var selectedIndices = {};
  var editingIndex = null;
  var contextMenuIndex = null;

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    if (els.statusMessage) {
      els.statusMessage.textContent = msg;
    }
    els.status.className = "status" + (isError ? " error" : "");
  }

  function showDefaultStatus() {
    if (els.statusMessage) {
      els.statusMessage.textContent = spells.length
        ? SCG_I18N.t("selectionHint")
        : SCG_I18N.t("openHint");
    }
    els.status.className = "status";
    updateSelectionUi();
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
      els.cardWidth.value = w || String(SCG_Config.DEFAULT_CARD_WIDTH_MM);
      els.cardHeight.value = h || String(SCG_Config.DEFAULT_CARD_HEIGHT_MM);
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
    var w = parseInt(els.cardWidth.value, 10) || SCG_Config.DEFAULT_CARD_WIDTH_MM;
    var h = parseInt(els.cardHeight.value, 10) || SCG_Config.DEFAULT_CARD_HEIGHT_MM;
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

  function loadLevelFilterState() {
    SCG_I18N.LEVEL_IDS.forEach(function (level) {
      selectedLevels[String(level)] = true;
    });
    try {
      var raw = localStorage.getItem("scg-level-filter");
      if (!raw) {
        return;
      }
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") {
        return;
      }
      SCG_I18N.LEVEL_IDS.forEach(function (level) {
        var key = String(level);
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
          selectedLevels[key] = !!saved[key];
        }
      });
    } catch (e) { /* ignore */ }
  }

  function saveLevelFilterState() {
    try {
      localStorage.setItem("scg-level-filter", JSON.stringify(selectedLevels));
    } catch (e) { /* ignore */ }
  }

  function getSelectedLevels() {
    return SCG_I18N.LEVEL_IDS.filter(function (level) {
      return selectedLevels[String(level)];
    });
  }

  function syncLevelChipStates() {
    if (!els.levelFilterChips) {
      return;
    }
    els.levelFilterChips.querySelectorAll(".filter-chip-input").forEach(function (input) {
      input.checked = !!selectedLevels[input.dataset.level];
    });
  }

  function buildLevelFilterChips() {
    els.levelFilterChips.innerHTML = "";
    SCG_I18N.LEVEL_IDS.forEach(function (level) {
      var key = String(level);
      var label = document.createElement("label");
      label.className = "filter-chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "filter-chip-input";
      input.dataset.level = key;
      input.checked = !!selectedLevels[key];
      var text = document.createElement("span");
      text.className = "filter-chip-label";
      text.textContent = SCG_I18N.levelChipLabel(level);
      input.addEventListener("change", function () {
        selectedLevels[key] = input.checked;
        saveLevelFilterState();
        render();
      });
      label.appendChild(input);
      label.appendChild(text);
      els.levelFilterChips.appendChild(label);
    });
  }

  function setAllLevelSelection(on) {
    SCG_I18N.LEVEL_IDS.forEach(function (level) {
      selectedLevels[String(level)] = on;
    });
    saveLevelFilterState();
    syncLevelChipStates();
    render();
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
    els.classFilterChips.querySelectorAll(".filter-chip-input").forEach(function (input) {
      input.checked = !!selectedClasses[input.dataset.classId];
    });
  }

  function buildClassFilterChips() {
    els.classFilterChips.innerHTML = "";
    SCG_I18N.CLASS_IDS.forEach(function (id) {
      var label = document.createElement("label");
      label.className = "filter-chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "filter-chip-input";
      input.dataset.classId = id;
      input.checked = !!selectedClasses[id];
      var text = document.createElement("span");
      text.className = "filter-chip-label";
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

  function isSelectionActive() {
    for (var key in selectedIndices) {
      if (Object.prototype.hasOwnProperty.call(selectedIndices, key) && selectedIndices[key]) {
        return true;
      }
    }
    return false;
  }

  function toggleSelection(idx) {
    var key = String(idx);
    if (selectedIndices[key]) {
      delete selectedIndices[key];
    } else {
      selectedIndices[key] = true;
    }
  }

  function clearSelection() {
    selectedIndices = {};
    showDefaultStatus();
    render();
  }

  function updateSelectionUi() {
    if (els.btnClearSelection) {
      var visible = isSelectionActive();
      els.btnClearSelection.classList.toggle("is-visible", visible);
      els.btnClearSelection.setAttribute("aria-hidden", visible ? "false" : "true");
      els.btnClearSelection.tabIndex = visible ? 0 : -1;
    }
  }

  function getRenderOptions() {
    return {
      selectedLevels: getSelectedLevels(),
      allLevelCount: SCG_I18N.LEVEL_IDS.length,
      classes: getSelectedClassIds(),
      allClassCount: SCG_I18N.CLASS_IDS.length,
      selectedIndices: selectedIndices,
      editingIndex: editingIndex,
    };
  }

  function updatePrintButton(stats) {
    els.btnPrint.textContent = SCG_I18N.t("printCards", {
      printed: stats.printed,
      total: stats.total,
    });
    els.btnPrint.disabled = stats.printed === 0;
  }

  function focusEditingBody() {
    if (editingIndex == null) {
      return;
    }
    requestAnimationFrame(function () {
      var body = els.grid.querySelector(
        '.card-body[data-index="' + editingIndex + '"]'
      );
      if (!body) {
        return;
      }
      body.focus();
      var range = document.createRange();
      range.selectNodeContents(body);
      range.collapse(false);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }

  function render() {
    var stats = SCG_Render.renderGrid(els.grid, spells, getRenderOptions());
    updatePrintButton(stats);
    updateSelectionUi();
    requestAnimationFrame(function () {
      SCG_Render.checkAllOverflow(els.grid);
      if (editingIndex != null) {
        focusEditingBody();
      }
    });
  }

  function setSpells(newSpells, errors, filename) {
    spells = newSpells;
    parseErrors = errors || [];
    hasClassTags = spellsHaveClassTags(spells);
    selectedIndices = {};
    editingIndex = null;
    hideContextMenu();
    if (filename) {
      activeFilename = filename;
    }
    setLog(parseErrors);
    updateClassFilterVisibility();
    showDefaultStatus();
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
      })
      .catch(function (err) {
        setStatus(String(err && err.message ? err.message : err), true);
      });
  }

  function saveEditingBody(body) {
    if (!body) {
      return;
    }
    var idx = parseInt(body.dataset.index, 10);
    if (isNaN(idx) || !spells[idx]) {
      return;
    }
    spells[idx].description = body.innerHTML;
    SCG_Render.checkOverflow(body.closest(".spell-card"));
  }

  function exitEditMode() {
    if (editingIndex == null) {
      return;
    }
    var body = els.grid.querySelector(
      '.card-body[data-index="' + editingIndex + '"]'
    );
    if (body) {
      saveEditingBody(body);
    }
    editingIndex = null;
    render();
  }

  function startEditMode(idx) {
    if (editingIndex != null && editingIndex !== idx) {
      var prevBody = els.grid.querySelector(
        '.card-body[data-index="' + editingIndex + '"]'
      );
      if (prevBody) {
        saveEditingBody(prevBody);
      }
    }
    editingIndex = idx;
    render();
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
    SCG_Render.checkOverflow(body.closest(".spell-card"));
  }

  function hideContextMenu() {
    if (els.cardContextMenu) {
      els.cardContextMenu.hidden = true;
    }
    contextMenuIndex = null;
  }

  function showContextMenu(x, y, idx) {
    contextMenuIndex = idx;
    els.cardContextMenu.hidden = false;
    els.cardContextMenu.style.left = x + "px";
    els.cardContextMenu.style.top = y + "px";
  }

  function onGridClick(ev) {
    if (ev.target.closest("#card-context-menu")) {
      return;
    }
    hideContextMenu();

    var body = ev.target.closest(".card-body");
    if (body && editingIndex != null && parseInt(body.dataset.index, 10) === editingIndex) {
      return;
    }

    var pair = ev.target.closest(".card-pair");
    if (!pair) {
      return;
    }
    var idx = parseInt(pair.dataset.index, 10);
    if (isNaN(idx)) {
      return;
    }
    toggleSelection(idx);
    render();
  }

  function onGridContextMenu(ev) {
    var pair = ev.target.closest(".card-pair");
    if (!pair) {
      hideContextMenu();
      return;
    }
    ev.preventDefault();
    var idx = parseInt(pair.dataset.index, 10);
    if (isNaN(idx)) {
      return;
    }
    showContextMenu(ev.clientX, ev.clientY, idx);
  }

  function onContextMenuAction(ev) {
    var btn = ev.target.closest("[data-context-action]");
    if (!btn || contextMenuIndex == null) {
      return;
    }
    hideContextMenu();
    if (btn.dataset.contextAction === "edit") {
      startEditMode(contextMenuIndex);
    }
  }

  function onGridKeyDown(ev) {
    if (ev.key === "Escape") {
      if (!els.cardContextMenu.hidden) {
        hideContextMenu();
        ev.preventDefault();
        return;
      }
      if (editingIndex != null) {
        exitEditMode();
        ev.preventDefault();
      }
    }
  }

  function onDocumentClick(ev) {
    if (!ev.target.closest("#card-context-menu")) {
      hideContextMenu();
    }
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
    if (els.btnPrint.disabled) {
      return;
    }
    SCG_Render.checkAllOverflow(els.grid);
    window.print();
  }

  function bindEvents() {
    els.btnOpen.addEventListener("click", onOpenClick);
    els.fileInput.addEventListener("change", onFileSelected);
    els.btnPrint.addEventListener("click", onPrint);
    els.btnExport.addEventListener("click", onExport);
    els.btnClearSelection.addEventListener("click", clearSelection);

    els.uiLang.addEventListener("change", function () {
      SCG_I18N.setLang(els.uiLang.value);
      buildLevelFilterChips();
      buildClassFilterChips();
      render();
      if (!els.status.classList.contains("error")) {
        showDefaultStatus();
      }
    });

    els.levelAll.addEventListener("click", function () {
      setAllLevelSelection(true);
    });
    els.levelNone.addEventListener("click", function () {
      setAllLevelSelection(false);
    });
    els.classAll.addEventListener("click", function () {
      setAllClassSelection(true);
    });
    els.classNone.addEventListener("click", function () {
      setAllClassSelection(false);
    });
    els.cardWidth.addEventListener("change", saveSettings);
    els.cardHeight.addEventListener("change", saveSettings);

    els.grid.addEventListener("input", onBodyEdit);
    els.grid.addEventListener("click", onGridClick);
    els.grid.addEventListener("contextmenu", onGridContextMenu);
    els.grid.addEventListener("keydown", onGridKeyDown);
    els.grid.addEventListener("focusout", function (ev) {
      if (editingIndex == null) {
        return;
      }
      var body = ev.target.closest(".card-body");
      if (!body || parseInt(body.dataset.index, 10) !== editingIndex) {
        return;
      }
      var related = ev.relatedTarget;
      if (related && body.contains(related)) {
        return;
      }
      exitEditMode();
    });
    els.cardContextMenu.addEventListener("click", onContextMenuAction);
    document.addEventListener("click", onDocumentClick);

    window.addEventListener("resize", function () {
      SCG_Render.checkAllOverflow(els.grid);
    });
  }

  function initEls() {
    els = {
      status: $("status"),
      statusMessage: $("status-message"),
      logPanel: $("log-panel"),
      grid: $("cards-grid"),
      btnOpen: $("btn-open"),
      btnExport: $("btn-export"),
      fileInput: $("file-input"),
      uiLang: $("ui-lang"),
      cardWidth: $("card-width"),
      cardHeight: $("card-height"),
      btnPrint: $("btn-print"),
      btnClearSelection: $("btn-clear-selection"),
      levelFilterChips: $("level-filter-chips"),
      levelAll: $("level-all"),
      levelNone: $("level-none"),
      classFilterRow: $("class-filter-row"),
      classFilterChips: $("class-filter-chips"),
      classAll: $("class-all"),
      classNone: $("class-none"),
      cardContextMenu: $("card-context-menu"),
    };
  }

  function boot() {
    initEls();
    SCG_I18N.init();
    els.uiLang.value = SCG_I18N.getLang();
    loadSettings();
    loadLevelFilterState();
    loadClassFilterState();
    buildLevelFilterChips();
    buildClassFilterChips();
    bindEvents();
    showDefaultStatus();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
