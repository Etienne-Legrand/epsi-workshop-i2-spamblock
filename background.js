// Fonction pour mettre à jour le badge en fonction de l'état de isBlockingEnabled
function updateBadge(isBlockingEnabled) {
  if (isBlockingEnabled) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" }); // Vert pour ON
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#F44336" }); // Rouge pour OFF
  }
}

// Lorsque l'extension est installée, initialise les valeurs par défaut
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isBlockingEnabled: true,
    blacklist: [],
  });
  chrome.storage.local.set({
    blockedCount: 0,
  });

  // Initialiser le badge à ON par défaut
  updateBadge(true);
});

// Met à jour le badge lorsque l'état change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.isBlockingEnabled) {
    const isBlockingEnabled = changes.isBlockingEnabled.newValue || false;
    updateBadge(isBlockingEnabled);
  }
});

// Écouter les messages et mettre à jour le compteur de mots bloqués
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
