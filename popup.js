document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitch = document.getElementById("toggleSwitch");
  const addWordBtn = document.getElementById("addWordBtn");
  const newWordInput = document.getElementById("newWord");
  const blacklistContainer = document.getElementById("blacklist");
  const status = document.getElementById("status");

  // Charger les paramètres de stockage de Chrome (état du switch et mots blacklistés)
  chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
    toggleSwitch.checked = data.isBlockingEnabled || false;
    const blacklist = data.blacklist || [];
    blacklist.forEach((word) => addWordToList(word));
  });

  // Activer/Désactiver le blocage
  toggleSwitch.addEventListener("change", () => {
    const isBlockingEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ isBlockingEnabled });
    status.textContent = isBlockingEnabled
      ? "Blocage activé"
      : "Blocage désactivé";
  });

  // Ajouter un mot à la blacklist
  addWordBtn.addEventListener("click", () => {
    const word = newWordInput.value.trim();
    if (word) {
      chrome.storage.sync.get("blacklist", (data) => {
        const blacklist = data.blacklist || [];
        blacklist.push(word);
        chrome.storage.sync.set({ blacklist }, () => {
          addWordToList(word);
          newWordInput.value = "";
        });
      });
    }
  });

  // Ajouter un mot à la liste d'affichage
  function addWordToList(word) {
    const li = document.createElement("li");
    li.textContent = word;
    blacklistContainer.appendChild(li);
  }
});
