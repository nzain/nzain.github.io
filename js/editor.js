(function (global) {
  "use strict";

  var DEBOUNCE_MS = 150;
  // Components: at least one of V/G/M (DE) or V/S/M (EN), comma separated,
  // optionally followed by a parenthesized material clause.
  var COMPONENTS_RE =
    /^\s*[VGSM](\s*,\s*[VGSM])*(\s*\([^)]+\))?\s*$/i;

  var openIndex = null;
  var spellRef = null;
  var onSaveCb = null;
  var onCancelCb = null;
  var debounceTimer = null;
  var els = {};
  var bound = false;
  var schoolOptions = [];

  function $(id) {
    return document.getElementById(id);
  }

  function isOpen() {
    return openIndex != null;
  }

  function getClassesFromChips() {
    if (!els.classChips) {
      return "";
    }
    var inputs = els.classChips.querySelectorAll(".filter-chip-input");
    var out = [];
    inputs.forEach(function (input) {
      if (input.checked) {
        out.push(input.dataset.classId);
      }
    });
    return out.join(",");
  }

  function getDraftSpell() {
    var levelRaw = els.level ? els.level.value : "0";
    var level = parseInt(levelRaw, 10);
    if (isNaN(level)) {
      level = 0;
    }
    return {
      level: level,
      name: els.name ? els.name.value : "",
      school: els.school ? els.school.value : "",
      castTime: els.castTime ? els.castTime.value : "",
      range: els.range ? els.range.value : "",
      components: els.components ? els.components.value : "",
      duration: els.duration ? els.duration.value : "",
      description: SCG_Util.stripDescriptionLineBreaks(
        els.textarea ? els.textarea.value : ""
      ),
      classes: getClassesFromChips(),
      ritual: !!(els.ritual && els.ritual.checked),
      nameEn:
        spellRef && spellRef.nameEn != null ? String(spellRef.nameEn) : "",
    };
  }

  function updateHighlight() {
    if (!els.highlightCode || !els.textarea) {
      return;
    }
    els.highlightCode.innerHTML =
      SCG_Util.highlightDescriptionHtml(els.textarea.value) + "\n";
  }

  function syncHighlightScroll() {
    if (!els.highlight || !els.textarea) {
      return;
    }
    els.highlight.scrollTop = els.textarea.scrollTop;
    els.highlight.scrollLeft = els.textarea.scrollLeft;
  }

  function getMinEditorHeight() {
    if (els.previewMount) {
      var card = els.previewMount.querySelector(".spell-card");
      if (card && card.offsetHeight) {
        return card.offsetHeight;
      }
    }
    var mm =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--card-height-mm")
      ) || 90;
    return mm * (96 / 25.4);
  }

  function fitEditorHeight() {
    if (!els.textarea) {
      return;
    }
    els.textarea.style.height = "auto";
    var minH = getMinEditorHeight();
    els.textarea.style.height = Math.max(minH, els.textarea.scrollHeight) + "px";
    updateHighlight();
    syncHighlightScroll();
  }

  function isComponentsValid(value) {
    var v = value == null ? "" : String(value).trim();
    if (!v) {
      return true;
    }
    return COMPONENTS_RE.test(v);
  }

  function updateComponentsValidity() {
    if (!els.components || !els.componentsError) {
      return true;
    }
    var ok = isComponentsValid(els.components.value);
    els.components.classList.toggle("editor-field-input--invalid", !ok);
    els.componentsError.textContent = ok ? "" : SCG_I18N.t("componentsInvalid");
    els.componentsError.hidden = ok;
    if (els.save) {
      els.save.disabled = !ok;
    }
    return ok;
  }

  function updatePreview() {
    if (!isOpen() || !els.previewMount) {
      return;
    }
    var draft = getDraftSpell();
    els.previewMount.innerHTML = "";
    var englishName = SCG_Render.buildCardEnglishName(draft);
    if (englishName) {
      els.previewMount.appendChild(englishName);
    }
    var card = SCG_Render.buildCard(draft, openIndex);
    els.previewMount.appendChild(card);
    SCG_Render.checkOverflow(card);
    fitEditorHeight();
  }

  function schedulePreview() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      updatePreview();
    }, DEBOUNCE_MS);
  }

  function close() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    openIndex = null;
    spellRef = null;
    onSaveCb = null;
    onCancelCb = null;
    if (els.panel) {
      els.panel.hidden = true;
    }
    if (els.textarea) {
      els.textarea.value = "";
      els.textarea.style.height = "";
    }
    if (els.highlightCode) {
      els.highlightCode.innerHTML = "";
    }
    if (els.previewMount) {
      els.previewMount.innerHTML = "";
    }
    if (els.componentsError) {
      els.componentsError.hidden = true;
      els.componentsError.textContent = "";
    }
    if (els.components) {
      els.components.classList.remove("editor-field-input--invalid");
    }
    if (els.save) {
      els.save.disabled = false;
    }
    document.body.classList.remove("is-editing-description");
  }

  function cancel() {
    if (!isOpen()) {
      return;
    }
    var cb = onCancelCb;
    close();
    if (cb) {
      cb();
    }
  }

  function save() {
    if (!isOpen()) {
      return;
    }
    if (!updateComponentsValidity()) {
      return;
    }
    var idx = openIndex;
    var draft = getDraftSpell();
    var cb = onSaveCb;
    close();
    if (cb) {
      cb(idx, draft);
    }
  }

  function onKeyDown(ev) {
    if (!isOpen()) {
      return;
    }
    if (ev.key === "Escape") {
      ev.preventDefault();
      cancel();
    }
  }

  function onTextareaInput() {
    fitEditorHeight();
    schedulePreview();
  }

  function onTextareaScroll() {
    syncHighlightScroll();
  }

  function onResize() {
    if (isOpen()) {
      updatePreview();
    }
  }

  function onFieldChange() {
    schedulePreview();
  }

  function onComponentsInput() {
    updateComponentsValidity();
    schedulePreview();
  }

  function buildLevelOptions() {
    if (!els.level) {
      return;
    }
    els.level.innerHTML = "";
    for (var i = 0; i < SCG_I18N.LEVEL_IDS.length; i++) {
      var lvl = SCG_I18N.LEVEL_IDS[i];
      var opt = document.createElement("option");
      opt.value = String(lvl);
      opt.textContent = SCG_I18N.formatLevel(lvl);
      els.level.appendChild(opt);
    }
  }

  function buildSchoolOptions(currentValue) {
    if (!els.school) {
      return;
    }
    els.school.innerHTML = "";
    var values = schoolOptions.slice();
    if (currentValue && values.indexOf(currentValue) < 0) {
      values.unshift(currentValue);
    }
    if (!values.length && currentValue) {
      values.push(currentValue);
    }
    values.forEach(function (school) {
      var opt = document.createElement("option");
      opt.value = school;
      opt.textContent = school;
      els.school.appendChild(opt);
    });
    if (currentValue) {
      els.school.value = currentValue;
    }
  }

  function parseClassesString(classes) {
    if (!classes) {
      return {};
    }
    var map = {};
    String(classes)
      .split(",")
      .map(function (c) { return c.trim(); })
      .filter(Boolean)
      .forEach(function (c) {
        map[c] = true;
      });
    return map;
  }

  function buildClassChips(classesString) {
    if (!els.classChips) {
      return;
    }
    els.classChips.innerHTML = "";
    var selected = parseClassesString(classesString);
    SCG_I18N.CLASS_IDS.forEach(function (id) {
      var label = document.createElement("label");
      label.className = "filter-chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "filter-chip-input";
      input.dataset.classId = id;
      input.checked = !!selected[id];
      input.addEventListener("change", onFieldChange);
      var text = document.createElement("span");
      text.className = "filter-chip-label";
      text.textContent = SCG_I18N.classLabel(id);
      label.appendChild(input);
      label.appendChild(text);
      els.classChips.appendChild(label);
    });
  }

  function bindEvents() {
    if (bound) {
      return;
    }
    bound = true;
    els.save.addEventListener("click", save);
    els.cancel.addEventListener("click", cancel);
    els.textarea.addEventListener("input", onTextareaInput);
    els.textarea.addEventListener("scroll", onTextareaScroll);
    if (els.level) {
      els.level.addEventListener("change", onFieldChange);
    }
    if (els.name) {
      els.name.addEventListener("input", onFieldChange);
    }
    if (els.school) {
      els.school.addEventListener("change", onFieldChange);
    }
    if (els.ritual) {
      els.ritual.addEventListener("change", onFieldChange);
    }
    if (els.castTime) {
      els.castTime.addEventListener("input", onFieldChange);
    }
    if (els.range) {
      els.range.addEventListener("input", onFieldChange);
    }
    if (els.duration) {
      els.duration.addEventListener("input", onFieldChange);
    }
    if (els.components) {
      els.components.addEventListener("input", onComponentsInput);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
  }

  function initEls() {
    els = {
      panel: $("description-editor"),
      codeWrap: document.querySelector(".description-editor-code-wrap"),
      highlight: document.querySelector(".description-editor-highlight"),
      highlightCode: $("desc-editor-highlight"),
      textarea: $("desc-editor-textarea"),
      previewMount: $("desc-editor-preview-mount"),
      save: $("desc-editor-save"),
      cancel: $("desc-editor-cancel"),
      level: $("editor-level"),
      name: $("editor-name"),
      school: $("editor-school"),
      ritual: $("editor-ritual"),
      castTime: $("editor-cast-time"),
      range: $("editor-range"),
      duration: $("editor-duration"),
      components: $("editor-components"),
      componentsError: $("editor-components-error"),
      classChips: $("editor-class-chips"),
    };
    buildLevelOptions();
    bindEvents();
  }

  function open(options) {
    if (!options || options.index == null || !options.spell) {
      return;
    }
    if (!els.panel) {
      initEls();
    }
    if (isOpen()) {
      close();
    }
    openIndex = options.index;
    spellRef = options.spell;
    onSaveCb = options.onSave || null;
    onCancelCb = options.onCancel || null;
    schoolOptions = Array.isArray(options.schoolOptions)
      ? options.schoolOptions.slice()
      : [];

    if (els.level) {
      els.level.value = String(spellRef.level != null ? spellRef.level : 0);
    }
    if (els.name) {
      els.name.value = spellRef.name != null ? String(spellRef.name) : "";
    }
    buildSchoolOptions(spellRef.school != null ? String(spellRef.school) : "");
    if (els.ritual) {
      els.ritual.checked = !!spellRef.ritual;
    }
    if (els.castTime) {
      els.castTime.value = spellRef.castTime != null ? String(spellRef.castTime) : "";
    }
    if (els.range) {
      els.range.value = spellRef.range != null ? String(spellRef.range) : "";
    }
    if (els.duration) {
      els.duration.value = spellRef.duration != null ? String(spellRef.duration) : "";
    }
    if (els.components) {
      els.components.value = spellRef.components != null ? String(spellRef.components) : "";
    }
    buildClassChips(spellRef.classes != null ? String(spellRef.classes) : "");
    els.textarea.value = spellRef.description != null ? String(spellRef.description) : "";
    els.panel.hidden = false;
    document.body.classList.add("is-editing-description");

    updateComponentsValidity();
    updatePreview();
    if (els.name) {
      els.name.focus();
      els.name.select();
    } else {
      els.textarea.focus();
    }
  }

  global.SCG_Editor = {
    open: open,
    close: close,
    isOpen: isOpen,
    getOpenIndex: function () {
      return openIndex;
    },
    setOpenIndex: function (idx) {
      openIndex = idx;
    },
    refreshPreview: updatePreview,
  };
})(typeof window !== "undefined" ? window : this);
