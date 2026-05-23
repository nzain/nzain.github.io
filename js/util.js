(function (global) {
  "use strict";

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function mapHasTruthy(map) {
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key) && map[key]) {
        return true;
      }
    }
    return false;
  }

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }

  function stripDescriptionLineBreaks(text) {
    if (text == null) {
      return "";
    }
    return String(text).replace(/\r\n|\r|\n/g, "");
  }

  function highlightDescriptionHtml(text) {
    var escaped = escapeHtml(text == null ? "" : String(text));
    return escaped.replace(/&lt;\/?[\w-]+(?:\s[^&]*)?\/?&gt;/g, function (tag) {
      return '<span class="html-tag">' + tag + "</span>";
    });
  }

  global.SCG_Util = {
    escapeHtml: escapeHtml,
    mapHasTruthy: mapHasTruthy,
    readJson: readJson,
    writeJson: writeJson,
    stripDescriptionLineBreaks: stripDescriptionLineBreaks,
    highlightDescriptionHtml: highlightDescriptionHtml,
  };
})(typeof window !== "undefined" ? window : this);
