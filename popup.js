document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitch = document.getElementById("toggle-switch");
  const addWordBtn = document.getElementById("add-word-btn");
  const newWordInput = document.getElementById("new-word");
  const blacklistElement = document.getElementById("blacklist");
  const blockedCountElement = document.getElementById("blocked-count");

  // Mettre à jour le compteur de mots bloqués
  function updateBlockedCount() {
    chrome.storage.local.get("blockedCount", (data) => {
      blockedCountElement.textContent = data.blockedCount || 0;
    });
  }

  // Charger les paramètres de stockage de Chrome (état du switch et mots blacklistés)
  chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
    toggleSwitch.checked = data.isBlockingEnabled || false;
    const blacklist = data.blacklist || [];
    blacklist.forEach((word) => addWordToList(word));
    updateBlockedCount();
  });

  // Activer/Désactiver le blocage
  toggleSwitch.addEventListener("change", () => {
    const isBlockingEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ isBlockingEnabled }, () => {
      if (!isBlockingEnabled) {
        chrome.storage.local.set({ blockedCount: 0 });

        // Reload the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.reload(tabs[0].id);
        });
      }
    });
  });

  // Ajouter un mot à la blacklist
  addWordBtn.addEventListener("click", () => {
    const word = newWordInput.value.trim();
    if (word) {
      chrome.storage.sync.get("blacklist", (data) => {
        const blacklist = data.blacklist || [];
        if (!blacklist.includes(word)) {
          blacklist.push(word);
          chrome.storage.sync.set({ blacklist }, () => {
            addWordToList(word);
          });
        }
        newWordInput.value = "";
      });
    }
  });

  // Ajouter un mot à la liste d'affichage avec une croix pour le supprimer
  function addWordToList(word) {
    const li = document.createElement("li");
    li.textContent = word;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "&#10006;"; // Code HTML pour une croix plus élégante
    removeBtn.className = "remove-btn";

    // Quand on clique sur la croix, on supprime le mot de la blacklist
    removeBtn.addEventListener("click", () => {
      chrome.storage.sync.get("blacklist", (data) => {
        let blacklist = data.blacklist || [];
        blacklist = blacklist.filter((item) => item !== word);
        chrome.storage.sync.set({ blacklist }, () => {
          li.remove();

          // Reload the active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.reload(tabs[0].id);
          });
        });
      });
    });

    li.appendChild(removeBtn);
    blacklistElement.appendChild(li);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blockedCountUpdated") {
      blockedCountElement.textContent = request.count;
    }
  });

  // Mettre à jour le compteur toutes les 2 secondes
  setInterval(updateBlockedCount, 2000);
});
