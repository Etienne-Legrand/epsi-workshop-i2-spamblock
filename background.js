chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isBlockingEnabled: true,
    blacklist: [], // Liste personnalisée de l'utilisateur
  });
});
