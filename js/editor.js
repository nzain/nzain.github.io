(function (global) {
  "use strict";

  var DEBOUNCE_MS = 150;
  var openIndex = null;
  var spellRef = null;
  var onSaveCb = null;
  var onCancelCb = null;
  var debounceTimer = null;
  var els = {};
  var bound = false;

  function $(id) {
    return document.getElementById(id);
  }

  function isOpen() {
    return openIndex != null;
  }

  function spellWithDescription(spell, description) {
    return {
      level: spell.level,
      name: spell.name,
      school: spell.school,
      castTime: spell.castTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      description: description,
      classes: spell.classes,
    };
  }

  function fitTextareaHeight() {
    if (!els.textarea) {
      return;
    }
    els.textarea.style.height = "auto";
    els.textarea.style.height = els.textarea.scrollHeight + "px";
  }

  function updatePreview() {
    if (!isOpen() || !spellRef || !els.previewMount) {
      return;
    }
    var draft = els.textarea.value;
    var previewSpell = spellWithDescription(spellRef, draft);
    els.previewMount.innerHTML = "";
    var card = SCG_Render.buildCard(previewSpell, openIndex);
    els.previewMount.appendChild(card);
    SCG_Render.checkOverflow(card);
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
    if (els.previewMount) {
      els.previewMount.innerHTML = "";
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
    var idx = openIndex;
    var description = els.textarea.value;
    var cb = onSaveCb;
    close();
    if (cb) {
      cb(idx, description);
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
    fitTextareaHeight();
    schedulePreview();
  }

  function onResize() {
    if (isOpen()) {
      fitTextareaHeight();
      updatePreview();
    }
  }

  function bindEvents() {
    if (bound) {
      return;
    }
    bound = true;
    els.save.addEventListener("click", save);
    els.cancel.addEventListener("click", cancel);
    els.textarea.addEventListener("input", onTextareaInput);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
  }

  function initEls() {
    els = {
      panel: $("description-editor"),
      title: $("desc-editor-title"),
      textarea: $("desc-editor-textarea"),
      previewMount: $("desc-editor-preview-mount"),
      save: $("desc-editor-save"),
      cancel: $("desc-editor-cancel"),
    };
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

    els.title.textContent = spellRef.name;
    els.textarea.value = spellRef.description != null ? String(spellRef.description) : "";
    els.panel.hidden = false;
    document.body.classList.add("is-editing-description");

    fitTextareaHeight();
    updatePreview();
    els.textarea.focus();
  }

  global.SCG_Editor = {
    open: open,
    close: close,
    isOpen: isOpen,
    refreshPreview: updatePreview,
  };
})(typeof window !== "undefined" ? window : this);
