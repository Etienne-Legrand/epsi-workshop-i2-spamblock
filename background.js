chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isBlockingEnabled: true,
    blacklist: [],
  });
  chrome.storage.local.set({
    blockedCount: 0,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockedCount") {
    chrome.storage.local.set({ blockedCount: request.count }, () => {
      chrome.runtime.sendMessage({
        action: "blockedCountUpdated",
        count: request.count,
      });
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    chrome.tabs.sendMessage(tabId, { action: "tabUpdated" });
  }
});
