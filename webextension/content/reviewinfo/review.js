// TODO the prefs won't update on upgrade. Figure out something smart
const DEFAULT_DANGEROUS_PERMISSIONS = [
  "webRequest",
  "cookies",
  "history",
  "logins",
  "nativeMessaging"
].join(", ");

const DEFAULT_DANGEROUS_MESSAGES = [
  "Unsafe assignment to outerHTML",
  "Unsafe call to insertAdjacentHTML",
  "Unsafe assignment to innerHTML",
  "The Function constructor is eval."
].join(", ");

const SKIP_MESSAGES = new Set([
  "We allow and encourage an upgrade but you cannot reverse this process. Once your users have" +
  " the WebExtension installed, they will not be able to install a legacy add-on."
]);

async function initLayout() {
  // Put latest permissions at top.
  await initTopPermissions();

  // Load validation report
  await retrieveValidation();

  // Scroll to the end of the header.
  window.scroll(0, document.querySelector(".addon").offsetTop - 10);
}

async function initTopPermissions() {
  // Lets assume people don't use different permissions per platform and just get one
  let prefs = await browser.storage.local.get({
    "reviewinfo-dangerous-permissions": DEFAULT_DANGEROUS_PERMISSIONS,
    "reviewinfo-show-permissions": false
  });
  let permissionsNode = document.querySelector("#review-files .listing-body:last-child .file-info div strong");
  if (!permissionsNode || !prefs["reviewinfo-show-permissions"]) {
    return;
  }

  let dangerous = new Set(prefs["reviewinfo-dangerous-permissions"].split(/,\s*/));

  let permissions = permissionsNode.nextSibling.textContent.trim().split(", ");
  permissions.sort((a, b) => {
    let isHostA = a.includes("://"), isHostB = b.includes("://");
    let dangerousA = dangerous.has(a), dangerousB = dangerous.has(b);

    if (dangerousA && !dangerousB) {
      return -1;
    } else if (dangerousB && !dangerousA) {
      return 1;
    } else if (isHostA && !isHostB) {
      return 1;
    } else if (isHostB && !isHostA) {
      return -1;
    } else {
      return (a > b) - (b > a);
    }
  });

  createSummaryRow("amoqueue-permissions-list", "Latest Permissions", permissions, dangerous);
}


async function retrieveValidation() {
  let prefs = await browser.storage.local.get({
    "reviewinfo-dangerous-messages": DEFAULT_DANGEROUS_MESSAGES,
    "reviewinfo-show-validator": false
  });

  if (!prefs["reviewinfo-show-validator"]) {
    return;
  }

  let validationNode = document.querySelector("#review-files .listing-body:last-child .file-info a[href$='validation']");
  let validationUrl = new URL(validationNode.getAttribute("href") + ".json", document.location);
  let dangerous = new Set(prefs["reviewinfo-dangerous-messages"].split(/,\s*/));

  let response = await fetch(validationUrl.href);
  let data = await response.json();

  let messageMap = new Map();

  for (let msg of data.validation.messages) {
    if (msg.type == "notice" || SKIP_MESSAGES.has(msg.message)) {
      continue;
    }

    let container = messageMap.get(msg.message);
    if (!container) {
      container = document.createElement("div");
      container.message = msg.message;
      let label = container.appendChild(document.createElement("div"));
      label.textContent = msg.message.replace(/&#34;/g, '"');

      if (dangerous.has(msg.message)) {
        label.setAttribute("dangerous", "true");
      }

      container.files = new Set();
      messageMap.set(msg.message, container);
    }

    if (!container.files.has(msg.file)) {
      container.files.add(msg.file);
      let locspan = document.createElement("span");
      locspan.className = "amoqueue-file";
      locspan.textContent = msg.file || "<all>";
      container.appendChild(locspan);
    }
  }

  let messages = [...messageMap.values()];
  messages.sort((a, b) => {
    let dangerousA = dangerous.has(a.message), dangerousB = dangerous.has(b.message);

    if (dangerousA && !dangerousB) {
      return -1;
    } else if (dangerousB && !dangerousA) {
      return 1;
    } else {
      return (a.message > b.message) - (b.message > a.message);
    }
  });

  createSummaryRow("amoqueue-validator-list", "Validator Messages Summary", messages);
}

function createSummaryRow(className, label, values, dangerous=null) {
  let tbody = document.querySelector("#addon-summary table tbody");
  let row = tbody.appendChild(document.createElement("tr"));
  let head = row.appendChild(document.createElement("th"));
  let cell = row.appendChild(document.createElement("td"));

  head.textContent = label;
  let list = cell.appendChild(document.createElement("ul"));
  list.className = className;
  for (let value of values) {
    let listitem = list.appendChild(document.createElement("li"));
    if (typeof value == "string") {
      listitem.textContent = value;
    } else {
      listitem.appendChild(value);
    }

    if (dangerous && dangerous.has(value)) {
      listitem.setAttribute("dangerous", "true");
    }
  }
}

initLayout();
