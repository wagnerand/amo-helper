// /en-US/editors/review/<slug>
let link = document.querySelector("#main-wrapper > .section > h3 > a");
if (link) {
  let parts = link.getAttribute("href").split("/");
  let slug = parts[parts.length - 1];
  chrome.runtime.sendMessage({ action: "addonid", addonid: slug, from: "codeviewer" });
}

// /en-US/developers/addon/<slug>/file/<filenumber>/validation/annotate
link = document.querySelector("#addon-validator-suite");
if (link) {
  let parts = link.getAttribute("data-annotate-url").split("/");
  let slug = parts[4];
  chrome.runtime.sendMessage({ action: "addonid", addonid: slug, from: "validation" });
}
