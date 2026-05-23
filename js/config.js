(function (global) {
  "use strict";

  var SCG_Config = {
    DEFAULT_CARD_WIDTH_MM: 63,
    DEFAULT_CARD_HEIGHT_MM: 90,
  };

  var root = document.documentElement;
  root.style.setProperty("--card-width-mm", String(SCG_Config.DEFAULT_CARD_WIDTH_MM));
  root.style.setProperty("--card-height-mm", String(SCG_Config.DEFAULT_CARD_HEIGHT_MM));

  global.SCG_Config = SCG_Config;
})(typeof window !== "undefined" ? window : this);
