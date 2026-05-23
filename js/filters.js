(function (global) {
  "use strict";

  function createChipFilter(options) {
    var storageKey = options.storageKey;
    var ids = options.ids;
    var keyOf = options.keyOf || String;
    var dataAttr = options.dataAttr;
    var getLabel = options.getLabel;
    var onChange = options.onChange;
    var chipContainer = null;
    var state = {};

    function load() {
      ids.forEach(function (id) {
        state[keyOf(id)] = true;
      });
      var saved = SCG_Util.readJson(storageKey);
      if (!saved) {
        return;
      }
      ids.forEach(function (id) {
        var key = keyOf(id);
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
          state[key] = !!saved[key];
        }
      });
    }

    function save() {
      SCG_Util.writeJson(storageKey, state);
    }

    function getSelected() {
      return ids.filter(function (id) {
        return state[keyOf(id)];
      });
    }

    function syncChips() {
      if (!chipContainer) {
        return;
      }
      chipContainer.querySelectorAll(".filter-chip-input").forEach(function (input) {
        input.checked = !!state[input.dataset[dataAttr]];
      });
    }

    function buildChips(container) {
      chipContainer = container;
      chipContainer.innerHTML = "";
      ids.forEach(function (id) {
        var key = keyOf(id);
        var label = document.createElement("label");
        label.className = "filter-chip";
        var input = document.createElement("input");
        input.type = "checkbox";
        input.className = "filter-chip-input";
        input.dataset[dataAttr] = key;
        input.checked = !!state[key];
        var text = document.createElement("span");
        text.className = "filter-chip-label";
        text.textContent = getLabel(id);
        input.addEventListener("change", function () {
          state[key] = input.checked;
          save();
          if (onChange) {
            onChange();
          }
        });
        label.appendChild(input);
        label.appendChild(text);
        chipContainer.appendChild(label);
      });
    }

    function setAll(on) {
      ids.forEach(function (id) {
        state[keyOf(id)] = on;
      });
      save();
      syncChips();
      if (onChange) {
        onChange();
      }
    }

    return {
      load: load,
      getSelected: getSelected,
      buildChips: buildChips,
      setAll: setAll,
    };
  }

  global.SCG_Filters = {
    createChipFilter: createChipFilter,
  };
})(typeof window !== "undefined" ? window : this);
