(function (global) {
  "use strict";

  var STRINGS = {
    appTitle: "Zauberkarten-Generator",
    openCsv: "CSV öffnen…",
    addSpell: "Zauber anlegen…",
    exportCsv: "CSV exportieren…",
    overview: "Übersicht…",
    overviewTitle: "Zauberübersicht",
    overviewClose: "Schließen",
    levelFilter: "Zaubergrad:",
    filterAll: "Alle",
    filterNone: "Keine",
    cardWidth: "Kartenbreite (mm)",
    cardHeight: "Kartenhöhe (mm)",
    sortBy: "Sortierung",
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

  function t(key, vars) {
    var str = STRINGS[key] || key;
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
    applyToDocument: applyToDocument,
    classLabel: classLabel,
    CLASS_IDS: CLASS_IDS,
    LEVEL_IDS: LEVEL_IDS,
    formatLevel: formatLevel,
    init: function () {
      document.documentElement.lang = "de";
      applyToDocument();
    },
  };
})(typeof window !== "undefined" ? window : this);
