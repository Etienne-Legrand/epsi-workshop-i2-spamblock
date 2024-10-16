document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitch = document.getElementById("toggleSwitch");
  const addWordBtn = document.getElementById("addWordBtn");
  const newWordInput = document.getElementById("newWord");
  const blacklistContainer = document.getElementById("blacklist");
  const status = document.getElementById("status");
  const blockedCountElement = document.getElementById("blockedCount"); // Éléments pour le compte de mots bloqués

  // Charger les paramètres de stockage de Chrome (état du switch et mots blacklistés)
  chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
    toggleSwitch.checked = data.isBlockingEnabled || false;
    const blacklist = data.blacklist || [];
    blacklist.forEach((word) => addWordToList(word));

    // Compter les mots bloqués sur la page actuelle
    countBlockedWords(blacklist);
  });

  // Activer/Désactiver le blocage
  toggleSwitch.addEventListener("change", () => {
    const isBlockingEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ isBlockingEnabled });
    status.textContent = isBlockingEnabled
      ? "Blocage activé"
      : "Blocage désactivé";

    // Mettre à jour le compte des mots bloqués après avoir changé l'état
    chrome.storage.sync.get("blacklist", (data) => {
      const blacklist = data.blacklist || [];
      countBlockedWords(blacklist);
    });
  });

  // Ajouter un mot à la blacklist
  addWordBtn.addEventListener("click", () => {
    const word = newWordInput.value.trim();
    if (word) {
      chrome.storage.sync.get("blacklist", (data) => {
        const blacklist = data.blacklist || [];
        if (!blacklist.includes(word)) {
          blacklist.push(word); // Éviter les doublons
          chrome.storage.sync.set({ blacklist }, () => {
            addWordToList(word);
            newWordInput.value = "";

            // Mettre à jour le compte des mots bloqués
            countBlockedWords(blacklist);
          });
        }
      });
    }
  });

  // Ajouter un mot à la liste d'affichage avec une croix pour le supprimer
  function addWordToList(word) {
    const li = document.createElement("li");
    li.textContent = word;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌"; // Croissant rouge
    removeBtn.style.marginLeft = "10px";
    removeBtn.style.color = "red";
    removeBtn.style.border = "none";
    removeBtn.style.background = "transparent";
    removeBtn.style.cursor = "pointer";

    // Quand on clique sur la croix, on supprime le mot de la blacklist
    removeBtn.addEventListener("click", () => {
      chrome.storage.sync.get("blacklist", (data) => {
        let blacklist = data.blacklist || [];
        blacklist = blacklist.filter((item) => item !== word); // Supprimer le mot
        chrome.storage.sync.set({ blacklist }, () => {
          li.remove(); // Retirer l'élément de la liste affichée

          // Reload the active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.reload(tabs[0].id);
          });

          // Mettre à jour le compte des mots bloqués
          countBlockedWords(blacklist);
        });
      });
    });

    li.appendChild(removeBtn);
    blacklistContainer.appendChild(li);
  }

  // Compter les mots bloqués sur la page actuelle
  function countBlockedWords(blacklist) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: (blacklist) => {
            let count = 0;
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            let node;
            while ((node = walker.nextNode())) {
              let text = node.nodeValue;

              // Compter les mots bloqués
              blacklist.forEach((word) => {
                const regex = new RegExp(`\\b${word}\\b`, "gi"); // Le `\\b` assure que ce soit un mot entier
                if (regex.test(text)) {
                  count += (text.match(regex) || []).length; // Compter les occurrences
                }
              });
            }
            return count; // Retourne le nombre total de mots bloqués
          },
          args: [blacklist],
        },
        (results) => {
          const blockedCount = results[0].result; // Récupère le nombre de mots bloqués
          blockedCountElement.textContent = blockedCount; // Met à jour l'affichage
        }
      );
    });
  }
});
