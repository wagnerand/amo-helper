function parseQueueNumbers(doc) {
  let queues = [...doc.querySelectorAll("#main-wrapper .tabnav li a")];
  let countre = /\((\d+)\)/;
  let numbers = {};

  for (let queue of queues) {
    let queueNameParts = queue.getAttribute("href").split("/");
    let queueName = queueNameParts[queueNameParts.length - 1];
    let match = queue.textContent.match(countre);

    if (match) {
      numbers[queueName] = { total: parseInt(match[1], 10) };
    }
  }

  return numbers;
}

chrome.runtime.sendMessage({ action: "update-badge-numbers", numbers: parseQueueNumbers(document), totalonly: true });
