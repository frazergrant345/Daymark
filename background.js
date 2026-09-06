chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-daymark') chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});