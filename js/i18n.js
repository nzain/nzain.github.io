(function (global) {
  "use strict";

  var LOCALES = {
    en: {
      appTitle: "Spell Card Generator",
      openCsv: "Open CSV…",
      exportCsv: "Export CSV…",
      uiLanguage: "UI language",
      levelFilter: "Levels:",
      filterAll: "All",
      filterNone: "None",
      cardWidth: "Card width (mm)",
      cardHeight: "Card height (mm)",
      print: "Print",
      printCards: "Print {printed}/{total} cards",
      cantrip: "Cantrip",
      levelN: "Level {n}",
      school: "School",
      castingTime: "Cast",
      range: "Range",
      duration: "Duration",
      components: "Comp.",
      classes: "Classes",
      ritual: "Ritual",
      overflow: "Overflow",
      noSpells: "Open a CSV file to load spells.",
      openHint: "Click Open CSV to load a spell list.",
      loaded: "Loaded {n} spells from {file}",
      exported: "Exported {file}",
      parseErrors: "Parse warnings",
      clearSelection: "Clear selection",
      editDescription: "Edit spell",
      saveDescription: "Save",
      cancel: "Cancel",
      descriptionHtml: "Description (HTML)",
      preview: "Preview",
      levelLabel: "Level",
      nameLabel: "Name",
      componentsInvalid: "Use V/G/M (or V/S/M), comma separated, optionally followed by (material).",
      descriptionHelp:
        "Allowed tags: br, strong/b, em/i, span, a, table, thead, tbody, tr, th, td\n" +
        "Attributes: class=\"nameref\" on span; href=\"123\" on a (numeric spell index)\n" +
        "Preview applies sanitization — scripts and other tags are stripped.\n" +
        "Example: <br/><br/><table><tr><th>Col</th></tr><tr><td>…</td></tr></table>",
      selectionHint: "Click cards to choose what to print. Clear selection to print all visible cards.",
      selectCsvOnly: "Please select a .csv file.",
      classFilter: "Classes:",
      classBard: "Bard",
      classCleric: "Cleric",
      classDruid: "Druid",
      classPaladin: "Paladin",
      classRanger: "Ranger",
      classSorc: "Sorcerer",
      classWarlock: "Warlock",
      classWiz: "Wizard",
      noMatchFilter: "No spells match the current filters.",
    },
    de: {
      appTitle: "Zauberkarten-Generator",
      openCsv: "CSV öffnen…",
      exportCsv: "CSV exportieren…",
      uiLanguage: "Oberflächensprache",
      levelFilter: "Zaubergrad:",
      filterAll: "Alle",
      filterNone: "Keine",
      cardWidth: "Kartenbreite (mm)",
      cardHeight: "Kartenhöhe (mm)",
      print: "Drucken",
      printCards: "Drucke {printed}/{total} Karten",
      cantrip: "Zaubertrick",
      levelN: "Grad {n}",
      school: "Schule",
      castingTime: "Zeit",
      range: "Reichw.",
      duration: "Dauer",
      components: "Kompon.",
      classes: "Klassen",
      ritual: "Ritual",
      overflow: "Überlauf",
      noSpells: "Öffne eine CSV-Datei, um Zauber zu laden.",
      openHint: "Klicke auf „CSV öffnen“, um eine Zauberliste zu laden.",
      loaded: "{n} Zauber aus {file} geladen",
      exported: "{file} exportiert",
      parseErrors: "Parse-Hinweise",
      clearSelection: "Auswahl aufheben",
      editDescription: "Zauber bearbeiten",
      saveDescription: "Speichern",
      cancel: "Abbrechen",
      descriptionHtml: "Beschreibung (HTML)",
      preview: "Vorschau",
      levelLabel: "Grad",
      nameLabel: "Name",
      componentsInvalid: "V/G/M (oder V/S/M), durch Komma getrennt, optional gefolgt von (Material).",
      descriptionHelp:
        "Erlaubte Tags: br, strong/b, em/i, span, a, table, thead, tbody, tr, th, td\n" +
        "Attribute: class=\"nameref\" auf span; href=\"123\" auf a (numerischer Zauberindex)\n" +
        "Die Vorschau wendet Sanitisierung an — Skripte und andere Tags werden entfernt.\n" +
        "Beispiel: <br/><br/><table><tr><th>Spalte</th></tr><tr><td>…</td></tr></table>",
      selectionHint: "Karten anklicken, um den Druck festzulegen. Auswahl aufheben, um alle sichtbaren Karten zu drucken.",
      selectCsvOnly: "Bitte eine .csv-Datei wählen.",
      classFilter: "Klassen:",
      classBard: "Barde",
      classCleric: "Kleriker",
      classDruid: "Druide",
      classPaladin: "Paladin",
      classRanger: "Waldläufer",
      classSorc: "Zauberer",
      classWarlock: "Hexenmeister",
      classWiz: "Magier",
      noMatchFilter: "Keine Zauber entsprechen den aktuellen Filtern.",
    },
  };

  var CLASS_IDS = [
    "bard",
    "druid",
    "cleric",
    "paladin",
    "ranger",
    "wiz",
    "sorc",
    "warlock",
  ];

  var LEVEL_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  var STORAGE_KEY = "scg-ui-lang";
  var currentLang = "en";

  function getStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "en";
    } catch (e) {
      return "en";
    }
  }

  function setLang(lang) {
    currentLang = LOCALES[lang] ? lang : "en";
    try {
      localStorage.setItem(STORAGE_KEY, currentLang);
    } catch (e) { /* ignore */ }
    document.documentElement.lang = currentLang;
    applyToDocument();
  }

  function t(key, vars) {
    var str = (LOCALES[currentLang] && LOCALES[currentLang][key]) ||
      (LOCALES.en[key]) ||
      key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
      });
    }
    return str;
  }

  function applyToDocument() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = t(key);
      }
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key) {
        el.setAttribute("aria-label", t(key));
      }
    });
  }

  function classLabel(classId) {
    var key = "class" + classId.charAt(0).toUpperCase() + classId.slice(1);
    if (classId === "sorc") {
      key = "classSorc";
    } else if (classId === "wiz") {
      key = "classWiz";
    }
    return t(key);
  }

  function formatLevel(level) {
    var n = parseInt(level, 10);
    if (n === 0 || isNaN(n)) {
      return t("cantrip");
    }
    return t("levelN", { n: n });
  }

  global.SCG_I18N = {
    t: t,
    setLang: setLang,
    getLang: function () { return currentLang; },
    applyToDocument: applyToDocument,
    classLabel: classLabel,
    CLASS_IDS: CLASS_IDS,
    LEVEL_IDS: LEVEL_IDS,
    formatLevel: formatLevel,
    init: function () {
      setLang(getStoredLang());
    },
  };
})(typeof window !== "undefined" ? window : this);
