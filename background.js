chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["neon.css"]
    });
  });
  