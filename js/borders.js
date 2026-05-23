(function (global) {
  "use strict";

  var VIEWBOX = "0 0 63 88";
  var STROKE = "1.4";

  var TOME_MARKUP =
    '<rect x="2.5" y="2.5" width="58" height="83" rx="1.5" fill="none" stroke="currentColor" stroke-width="' +
    STROKE +
    '"/>' +
    '<rect x="6" y="6" width="51" height="76" rx="1" fill="none" stroke="currentColor" stroke-width="0.8"/>' +
    '<path d="M2.5 14 Q2.5 8 8 6 M55 6 Q60.5 8 60.5 14" fill="none" stroke="currentColor" stroke-width="0.9"/>' +
    '<path d="M2.5 74 Q2.5 80 8 82 M55 82 Q60.5 80 60.5 74" fill="none" stroke="currentColor" stroke-width="0.9"/>' +
    '<circle cx="6" cy="6" r="1.6" fill="currentColor"/>' +
    '<circle cx="57" cy="6" r="1.6" fill="currentColor"/>' +
    '<circle cx="6" cy="82" r="1.6" fill="currentColor"/>' +
    '<circle cx="57" cy="82" r="1.6" fill="currentColor"/>';

  function createBorderSvg(className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", VIEWBOX);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", className || "card-back-border-svg");
    svg.innerHTML = TOME_MARKUP;
    return svg;
  }

  global.SCG_Borders = {
    createBorderSvg: createBorderSvg,
  };
})(typeof window !== "undefined" ? window : this);
