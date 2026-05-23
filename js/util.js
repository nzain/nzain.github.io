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

  global.SCG_Util = {
    escapeHtml: escapeHtml,
    mapHasTruthy: mapHasTruthy,
    readJson: readJson,
    writeJson: writeJson,
  };
})(typeof window !== "undefined" ? window : this);
