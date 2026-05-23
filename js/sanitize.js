(function (global) {
  "use strict";

  var ALLOWED_TAGS = [
    "br", "strong", "b", "em", "i", "span", "a",
    "table", "thead", "tbody", "tr", "th", "td",
  ];

  var ALLOWED_ATTR = ["class", "href"];

  function configurePurify() {
    if (typeof DOMPurify === "undefined") {
      return;
    }
    DOMPurify.addHook("uponSanitizeAttribute", function (node, data) {
      if (data.attrName === "href") {
        var v = String(data.attrValue || "").trim();
        if (!/^\d+$/.test(v)) {
          data.keepAttr = false;
          data.attrValue = "";
        }
      }
      if (data.attrName === "class" && node.tagName === "SPAN") {
        if (data.attrValue !== "nameref") {
          data.keepAttr = false;
        }
      }
    });
  }

  function sanitizeDescription(html) {
    if (!html) {
      return "";
    }
    if (typeof DOMPurify === "undefined") {
      return html.replace(/<[^>]+>/g, "");
    }
    var clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ALLOWED_TAGS,
      ALLOWED_ATTR: ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
    var wrap = document.createElement("div");
    wrap.innerHTML = clean;
    wrap.querySelectorAll("a[href]").forEach(function (a) {
      a.classList.add("spell-ref");
      a.removeAttribute("target");
    });
    return wrap.innerHTML;
  }

  configurePurify();

  global.SCG_Sanitize = {
    sanitizeDescription: sanitizeDescription,
  };
})(typeof window !== "undefined" ? window : this);
