chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isBlockingEnabled: true,
    blacklist: ["photo", "clio"],
  });
});
