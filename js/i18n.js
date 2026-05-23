(function (global) {
  "use strict";

  var LOCALES = {
    en: {
      appTitle: "Spell Card Generator",
      openCsv: "Open CSV…",
      exportCsv: "Export CSV…",
      uiLanguage: "UI language",
      levelFrom: "Level from",
      levelTo: "to",
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
      overflow: "Overflow",
      noSpells: "Open a CSV file to load spells.",
      openHint: "Click Open CSV to load a spell list.",
      loaded: "Loaded {n} spells from {file}",
      exported: "Exported {file}",
      parseErrors: "Parse warnings",
      clearSelection: "Clear selection",
      editDescription: "Edit description",
      selectionHint: "Click cards to choose what to print. Clear selection to print all visible cards.",
      selectCsvOnly: "Please select a .csv file.",
      classFilter: "Classes",
      classAll: "All",
      classNone: "None",
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
      levelFrom: "Grad von",
      levelTo: "bis",
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
      overflow: "Überlauf",
      noSpells: "Öffne eine CSV-Datei, um Zauber zu laden.",
      openHint: "Klicke auf „CSV öffnen“, um eine Zauberliste zu laden.",
      loaded: "{n} Zauber aus {file} geladen",
      exported: "{file} exportiert",
      parseErrors: "Parse-Hinweise",
      clearSelection: "Auswahl aufheben",
      editDescription: "Beschreibung bearbeiten",
      selectionHint: "Karten anklicken, um den Druck festzulegen. Auswahl aufheben, um alle sichtbaren Karten zu drucken.",
      selectCsvOnly: "Bitte eine .csv-Datei wählen.",
      classFilter: "Klassen",
      classAll: "Alle",
      classNone: "Keine",
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
    "cleric",
    "druid",
    "paladin",
    "ranger",
    "sorc",
    "warlock",
    "wiz",
  ];

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
    formatLevel: formatLevel,
    init: function () {
      setLang(getStoredLang());
    },
  };
})(typeof window !== "undefined" ? window : this);
