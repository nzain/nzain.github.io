(function (global) {
  "use strict";

  var DELIMITER = ";";

  function decodeBuffer(buffer) {
    var utf8 = new TextDecoder("utf-8").decode(buffer);
    if (
      utf8.indexOf("\uFFFD") !== -1 ||
      /[\u00C3\u00C2\u0393][\u0080-\u00BF]/.test(utf8) ||
      /\uFFFD/.test(utf8)
    ) {
      try {
        return new TextDecoder("windows-1252").decode(buffer);
      } catch (e) {
        return utf8;
      }
    }
    return utf8;
  }

  function decodeFile(file) {
    return file.arrayBuffer().then(decodeBuffer);
  }

  function isHeaderRow(row) {
    if (!row || !row.length) {
      return false;
    }
    var first = String(row[0]).trim().toLowerCase();
    return first === "level" || first === "stufe" || first === "grad";
  }

  function rowToSpell(row, rowIndex) {
    var level = parseInt(String(row[0]).trim(), 10);
    if (isNaN(level)) {
      return { error: "Row " + (rowIndex + 1) + ": invalid level" };
    }
    return {
      level: level,
      name: (row[1] || "").trim(),
      school: (row[2] || "").trim(),
      castTime: (row[3] || "").trim(),
      range: (row[4] || "").trim(),
      components: (row[5] || "").trim(),
      duration: (row[6] || "").trim(),
      description: row[7] != null ? String(row[7]) : "",
      classes: (row[8] || "").trim(),
      ritual: /^(r|1|x|y|true|ritual)$/i.test(String(row[9] || "").trim()),
    };
  }

  function parseCsvText(text) {
    var errors = [];
    var result = Papa.parse(text, {
      delimiter: DELIMITER,
      quoteChar: '"',
      skipEmptyLines: true,
    });

    if (result.errors && result.errors.length) {
      result.errors.forEach(function (e) {
        errors.push("CSV line " + (e.row != null ? e.row + 1 : "?") + ": " + e.message);
      });
    }

    var rows = result.data || [];
    var spells = [];

    rows.forEach(function (row, i) {
      if (!row || row.every(function (c) { return !String(c).trim(); })) {
        return;
      }
      if (i === 0 && isHeaderRow(row)) {
        return;
      }
      var spell = rowToSpell(row, i);
      if (spell.error) {
        errors.push(spell.error);
        return;
      }
      if (!spell.name) {
        errors.push("Row " + (i + 1) + ": missing name");
        return;
      }
      spells.push(spell);
    });

    return { spells: spells, errors: errors };
  }

  function spellToRow(spell) {
    return [
      spell.level,
      spell.name,
      spell.school,
      spell.castTime,
      spell.range,
      spell.components,
      spell.duration,
      SCG_Util.stripDescriptionLineBreaks(spell.description),
      spell.classes || "",
      spell.ritual ? "R" : "",
    ];
  }

  function exportCsvText(spells) {
    var rows = spells.map(spellToRow);
    return Papa.unparse(rows, {
      delimiter: DELIMITER,
      quotes: true,
      quoteChar: '"',
    });
  }

  function exportBlob(spells, filename) {
    var text = exportCsvText(spells);
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    return { blob: blob, filename: filename || "spells.csv" };
  }

  global.SCG_CSV = {
    decodeBuffer: decodeBuffer,
    decodeFile: decodeFile,
    parseCsvText: parseCsvText,
    exportCsvText: exportCsvText,
    exportBlob: exportBlob,
    DELIMITER: DELIMITER,
  };
})(typeof window !== "undefined" ? window : this);
