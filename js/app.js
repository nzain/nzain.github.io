(function () {
  "use strict";

  var STORAGE_KEY_SPELLS = "scg-spells-v1";
  var STORAGE_KEY_FILENAME = "scg-spells-filename-v1";
  var STORAGE_KEY_SORT_MODE = "scg-sort-mode";

  var spells = [];
  var activeFilename = "";
  var parseErrors = [];
  var hasClassTags = false;
  var selectedIndices = {};
  var contextMenuIndex = null;
  var scrollRestoreIndex = null;
  var sortMode = "name";
  var levelFilter;
  var classFilter;

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
        return '<div class="log-line">' + SCG_Util.escapeHtml(e) + "</div>";
      }).join("");
  }

  function loadSettings() {
    try {
      var w = localStorage.getItem("scg-card-width");
      var h = localStorage.getItem("scg-card-height");
      els.cardWidth.value = w || String(SCG_Config.DEFAULT_CARD_WIDTH_MM);
      els.cardHeight.value = h || String(SCG_Config.DEFAULT_CARD_HEIGHT_MM);
      sortMode = localStorage.getItem(STORAGE_KEY_SORT_MODE) || "name";
      if (sortMode !== "name" && sortMode !== "nameEn") {
        sortMode = "name";
      }
      if (els.sortMode) {
        els.sortMode.value = sortMode;
      }
    } catch (e) { /* ignore */ }
    applyDimensions();
  }

  function saveSortMode() {
    sortMode = els.sortMode.value === "nameEn" ? "nameEn" : "name";
    try {
      localStorage.setItem(STORAGE_KEY_SORT_MODE, sortMode);
    } catch (e) { /* ignore */ }
  }

  function applySort() {
    var editIdx = SCG_Editor.isOpen() ? SCG_Editor.getOpenIndex() : null;
    var editSpell = editIdx != null ? spells[editIdx] : null;
    SCG_Util.sortSpells(spells, sortMode);
    if (editSpell != null) {
      SCG_Editor.setOpenIndex(spells.indexOf(editSpell));
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem("scg-card-width", els.cardWidth.value);
      localStorage.setItem("scg-card-height", els.cardHeight.value);
    } catch (e) { /* ignore */ }
    applyDimensions();
  }

  function clearPersistedSpells() {
    try {
      localStorage.removeItem(STORAGE_KEY_SPELLS);
      localStorage.removeItem(STORAGE_KEY_FILENAME);
    } catch (e) { /* ignore */ }
  }

  function persistSpells() {
    try {
      if (!spells || !spells.length) {
        clearPersistedSpells();
        return;
      }
      var payload = JSON.stringify(spells);
      localStorage.setItem(STORAGE_KEY_SPELLS, payload);
      localStorage.setItem(STORAGE_KEY_FILENAME, activeFilename || "");
    } catch (e) {
      // Quota exceeded, storage unavailable, or serialization failure.
      // Drop any stale entry so a refresh shows the empty state instead of
      // restoring an out-of-date snapshot.
      clearPersistedSpells();
    }
  }

  function loadPersistedSpells() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_SPELLS);
      if (!raw) {
        return null;
      }
      var data = JSON.parse(raw);
      if (!Array.isArray(data) || !data.length) {
        return null;
      }
      var allValid = data.every(function (s) {
        return s && typeof s === "object" && typeof s.name === "string";
      });
      if (!allValid) {
        return null;
      }
      var filename = "";
      try {
        filename = localStorage.getItem(STORAGE_KEY_FILENAME) || "";
      } catch (e) { /* ignore */ }
      return { spells: data, filename: filename };
    } catch (e) {
      return null;
    }
  }

  function applyDimensions() {
    var w = parseInt(els.cardWidth.value, 10) || SCG_Config.DEFAULT_CARD_WIDTH_MM;
    var h = parseInt(els.cardHeight.value, 10) || SCG_Config.DEFAULT_CARD_HEIGHT_MM;
    SCG_Render.applyCardDimensions(w, h);
    if (els.grid) {
      requestAnimationFrame(function () {
        SCG_Render.checkAllOverflow(els.grid);
        if (SCG_Editor.isOpen()) {
          SCG_Editor.refreshPreview();
        }
      });
    }
  }

  function spellsHaveClassTags(list) {
    return list.some(function (s) {
      return s.classes && String(s.classes).trim();
    });
  }

  function updateClassFilterVisibility() {
    if (els.classFilterRow) {
      els.classFilterRow.hidden = !hasClassTags;
    }
  }

  function clearSelection() {
    selectedIndices = {};
    showDefaultStatus();
    render();
  }

  function updateSelectionUi() {
    if (!els.btnClearSelection) {
      return;
    }
    var visible = SCG_Util.mapHasTruthy(selectedIndices);
    els.btnClearSelection.classList.toggle("is-visible", visible);
    els.btnClearSelection.setAttribute("aria-hidden", visible ? "false" : "true");
    els.btnClearSelection.tabIndex = visible ? 0 : -1;
  }

  function getRenderOptions() {
    return {
      selectedLevels: levelFilter.getSelected(),
      allLevelCount: SCG_I18N.LEVEL_IDS.length,
      classes: classFilter.getSelected(),
      allClassCount: SCG_I18N.CLASS_IDS.length,
      selectedIndices: selectedIndices,
      selectionActive: SCG_Util.mapHasTruthy(selectedIndices),
    };
  }

  function getFilterOptions() {
    return {
      selectedLevels: levelFilter.getSelected(),
      allLevelCount: SCG_I18N.LEVEL_IDS.length,
      classes: classFilter.getSelected(),
      allClassCount: SCG_I18N.CLASS_IDS.length,
    };
  }

  function updateSpellDependentButtons() {
    var hasSpells = spells.length > 0;
    els.btnExport.disabled = !hasSpells;
    els.btnOverview.disabled = !hasSpells;
  }

  function updatePrintButton(stats) {
    els.btnPrint.textContent = SCG_I18N.t("printCards", {
      printed: stats.printed,
      total: stats.total,
    });
    els.btnPrint.disabled = stats.printed === 0;
  }

  function scrollSpellIntoView(idx) {
    if (idx == null || !els.grid) {
      return;
    }
    var pair = els.grid.querySelector('.card-pair[data-index="' + idx + '"]');
    if (pair) {
      pair.scrollIntoView({ block: "center" });
    }
  }

  function render() {
    var stats = SCG_Render.renderGrid(els.grid, spells, getRenderOptions());
    updatePrintButton(stats);
    updateSelectionUi();
    requestAnimationFrame(function () {
      SCG_Render.checkAllOverflow(els.grid);
      if (scrollRestoreIndex != null) {
        var restoreIdx = scrollRestoreIndex;
        scrollRestoreIndex = null;
        scrollSpellIntoView(restoreIdx);
      }
    });
  }

  function setSpells(newSpells, errors, filename) {
    spells = newSpells;
    applySort();
    parseErrors = errors || [];
    hasClassTags = spellsHaveClassTags(spells);
    selectedIndices = {};
    SCG_Editor.close();
    hideContextMenu();
    if (filename) {
      activeFilename = filename;
    }
    setLog(parseErrors);
    updateClassFilterVisibility();
    showDefaultStatus();
    render();
    updateSpellDependentButtons();
    persistSpells();
  }

  function openOverview() {
    if (!spells.length || !els.overviewDialog) {
      return;
    }
    var visible = SCG_Render.getVisibleSpells(spells, getFilterOptions());
    SCG_Render.renderOverview(els.overviewBody, visible, spells.length);
    els.overviewDialog.showModal();
  }

  function closeOverview() {
    if (els.overviewDialog && els.overviewDialog.open) {
      els.overviewDialog.close();
    }
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

  function collectSchoolOptions() {
    var seen = {};
    var out = [];
    spells.forEach(function (s) {
      var school = s && s.school != null ? String(s.school).trim() : "";
      if (!school || seen[school]) {
        return;
      }
      seen[school] = true;
      out.push(school);
    });
    out.sort(function (a, b) {
      return a.localeCompare(b);
    });
    return out;
  }

  function startEditMode(idx) {
    if (!spells[idx]) {
      return;
    }
    SCG_Editor.open({
      index: idx,
      spell: spells[idx],
      schoolOptions: collectSchoolOptions(),
      onSave: function (index, updatedSpell) {
        spells[index] = updatedSpell;
        applySort();
        scrollRestoreIndex = spells.indexOf(updatedSpell);
        hasClassTags = spellsHaveClassTags(spells);
        updateClassFilterVisibility();
        render();
        persistSpells();
      },
      onCancel: function () {
        requestAnimationFrame(function () {
          scrollSpellIntoView(idx);
        });
      },
    });
  }

  function makeBlankSpell() {
    return {
      level: 0,
      name: "",
      school: "",
      castTime: "",
      range: "",
      components: "",
      duration: "",
      description: "",
      classes: "",
      ritual: false,
      nameEn: "",
    };
  }

  function startAddSpell() {
    var newIdx = spells.length;
    var draft = makeBlankSpell();
    spells.push(draft);
    SCG_Editor.open({
      index: newIdx,
      spell: draft,
      schoolOptions: collectSchoolOptions(),
      onSave: function (index, updatedSpell) {
        spells[index] = updatedSpell;
        applySort();
        scrollRestoreIndex = spells.indexOf(updatedSpell);
        hasClassTags = spellsHaveClassTags(spells);
        updateClassFilterVisibility();
        updateSpellDependentButtons();
        render();
        persistSpells();
      },
      onCancel: function () {
        spells.splice(newIdx, 1);
        hasClassTags = spellsHaveClassTags(spells);
        updateClassFilterVisibility();
        updateSpellDependentButtons();
        render();
        persistSpells();
      },
    });
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

    var editBtn = ev.target.closest(".card-edit-btn");
    if (editBtn) {
      var editIdx = parseInt(editBtn.dataset.index, 10);
      if (!isNaN(editIdx)) {
        startEditMode(editIdx);
      }
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
    var key = String(idx);
    if (selectedIndices[key]) {
      delete selectedIndices[key];
    } else {
      selectedIndices[key] = true;
    }
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
    var idx = contextMenuIndex;
    hideContextMenu();
    if (btn.dataset.contextAction === "edit") {
      startEditMode(idx);
    }
  }

  function onGridKeyDown(ev) {
    if (ev.key === "Escape" && !els.cardContextMenu.hidden) {
      hideContextMenu();
      ev.preventDefault();
    }
  }

  function onDocumentClick(ev) {
    if (!ev.target.closest("#card-context-menu")) {
      hideContextMenu();
    }
  }

  function onExport() {
    if (!spells.length) {
      return;
    }
    var out = SCG_CSV.exportBlob(spells, activeFilename || "spells.csv");
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

  function initFilters() {
    levelFilter = SCG_Filters.createChipFilter({
      storageKey: "scg-level-filter",
      ids: SCG_I18N.LEVEL_IDS,
      dataAttr: "level",
      getLabel: String,
      onChange: render,
    });
    classFilter = SCG_Filters.createChipFilter({
      storageKey: "scg-class-filter",
      ids: SCG_I18N.CLASS_IDS,
      dataAttr: "classId",
      getLabel: SCG_I18N.classLabel,
      onChange: render,
    });
  }

  function onSortModeChange() {
    saveSortMode();
    selectedIndices = {};
    applySort();
    showDefaultStatus();
    render();
  }

  function bindEvents() {
    els.btnOpen.addEventListener("click", onOpenClick);
    els.btnAddSpell.addEventListener("click", startAddSpell);
    els.fileInput.addEventListener("change", onFileSelected);
    els.btnPrint.addEventListener("click", onPrint);
    els.btnExport.addEventListener("click", onExport);
    els.btnOverview.addEventListener("click", openOverview);
    els.btnClearSelection.addEventListener("click", clearSelection);

    els.levelAll.addEventListener("click", function () {
      levelFilter.setAll(true);
    });
    els.levelNone.addEventListener("click", function () {
      levelFilter.setAll(false);
    });
    els.classAll.addEventListener("click", function () {
      classFilter.setAll(true);
    });
    els.classNone.addEventListener("click", function () {
      classFilter.setAll(false);
    });
    els.cardWidth.addEventListener("change", saveSettings);
    els.cardHeight.addEventListener("change", saveSettings);
    els.sortMode.addEventListener("change", onSortModeChange);

    els.grid.addEventListener("click", onGridClick);
    els.grid.addEventListener("contextmenu", onGridContextMenu);
    els.grid.addEventListener("keydown", onGridKeyDown);
    els.cardContextMenu.addEventListener("click", onContextMenuAction);
    document.addEventListener("click", onDocumentClick);

    if (els.overviewClose) {
      els.overviewClose.addEventListener("click", closeOverview);
    }

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
      btnAddSpell: $("btn-add-spell"),
      btnExport: $("btn-export"),
      btnOverview: $("btn-overview"),
      fileInput: $("file-input"),
      cardWidth: $("card-width"),
      cardHeight: $("card-height"),
      sortMode: $("sort-mode"),
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
      overviewDialog: $("spell-overview"),
      overviewBody: $("spell-overview-body"),
      overviewClose: $("spell-overview-close"),
    };
  }

  function boot() {
    initEls();
    initFilters();
    SCG_I18N.init();
    loadSettings();
    levelFilter.load();
    classFilter.load();
    levelFilter.buildChips(els.levelFilterChips);
    classFilter.buildChips(els.classFilterChips);
    bindEvents();
    var restored = loadPersistedSpells();
    if (restored) {
      setSpells(restored.spells, [], restored.filename);
    } else {
      showDefaultStatus();
      render();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
