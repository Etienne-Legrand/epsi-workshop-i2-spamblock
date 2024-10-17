let observer = null;
const internalBlacklist = [
  // English bad words
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "damn",
  "dick",
  "piss",
  "crap",
  "whore",
  "slut",
  "faggot",
  "cunt",
  "prick",
  "wanker",
  "twat",
  "douchebag",
  "retard",
  "motherfucker",
  "nigger",
  "chink",
  "spic",

  // French bad words
  "putain",
  "merde",
  "connard",
  "salope",
  "enculé",
  "bordel",
  "bite",
  "couille",
  "con",
  "pute",
  "ta gueule",
  "fils de pute",
  "enfoiré",
  "niqué",
  "chiotte",
  "batard",
  "bouffon",
  "trou du cul",
  "branleur",
  "salopard",
  "pédé",
];

// Fonction pour fusionner les listes interne et utilisateur
function mergeBlacklists(userBlacklist) {
  return [...new Set([...internalBlacklist, ...userBlacklist])];
}

// Fonction pour filtrer les tweets sur Twitter
function filterTweets(blacklist) {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  let localBlockedCount = 0;

  tweets.forEach((tweet) => {
    const tweetText = tweet.innerText.toLowerCase();
    const regex = new RegExp(`\\b(${blacklist.join("|")})\\b`, "i");

    if (regex.test(tweetText)) {
      tweet.remove();
      localBlockedCount++;
    }
  });

  return localBlockedCount;
}

// Fonction pour remplacer les mots sur les autres sites, en ignorant les champs d'entrée
function replaceWords(blacklist) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Ignorer les nœuds texte à l'intérieur des champs de saisie
        if (
          node.parentNode &&
          (node.parentNode.nodeName === "INPUT" ||
            node.parentNode.nodeName === "TEXTAREA" ||
            node.parentNode.isContentEditable)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  let localBlockedCount = 0;
  let node;

  while ((node = walker.nextNode())) {
    let text = node.nodeValue;

    blacklist.forEach((word) => {
      const regex = new RegExp(`(\\b|\\s)(${word})(?=\\s|\\b)`, "gi");

      // Remplacer uniquement le groupe 2 (le mot en lui-même)
      text = text.replace(regex, (match, p1, p2) => {
        localBlockedCount++;
        return p1 + "♥".repeat(p2.length);
      });
    });

    node.nodeValue = text;
  }

  return localBlockedCount;
}

// Fonction pour observer les changements de la page
function startObserver(blacklist, isTwitter) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    updateBlockedCount(blacklist, isTwitter);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Met à jour le nombre de mots bloqués
function updateBlockedCount(blacklist, isTwitter) {
  const newBlockedCount = isTwitter
    ? filterTweets(blacklist)
    : replaceWords(blacklist);

  // Vérifier si l'extension est toujours active
  try {
    chrome.storage.sync.get("blockedCount", (data) => {
      const currentBlockedCount = data.blockedCount || 0;
      const updatedBlockedCount = currentBlockedCount + newBlockedCount;

      chrome.storage.sync.set({ blockedCount: updatedBlockedCount }, () => {
        // S'assurer que le contexte est valide avant d'envoyer le message
        if (chrome.runtime?.lastError) {
          console.error("Runtime error: ", chrome.runtime.lastError);
          return;
        }

        chrome.runtime.sendMessage({
          action: "updateBlockedCount",
          count: updatedBlockedCount,
        });
      });
    });
  } catch (e) {
    console.error("Extension context invalidated or another error:", e);
  }
}

// Initialiser le bloqueur de spam
function initializeBlocker(isBlockingEnabled, blacklist) {
  const isTwitter = window.location.hostname.includes("x.com");

  if (isBlockingEnabled) {
    updateBlockedCount(blacklist, isTwitter);
    startObserver(blacklist, isTwitter);
  } else {
    if (observer) {
      observer.disconnect();
    }
    chrome.storage.sync.set({ blockedCount: 0 });
  }
}

// Charger l'état et la liste des mots blacklistés au démarrage
chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
  const isBlockingEnabled = data.isBlockingEnabled || false;
  const userBlacklist = data.blacklist || [];
  const blacklist = mergeBlacklists(userBlacklist);
  initializeBlocker(isBlockingEnabled, blacklist);
});

// Mettre à jour le bloqueur de spam lorsque les paramètres changent
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.isBlockingEnabled || changes.blacklist)) {
    chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
      const isBlockingEnabled = data.isBlockingEnabled || false;
      const userBlacklist = data.blacklist || [];
      const blacklist = mergeBlacklists(userBlacklist);
      initializeBlocker(isBlockingEnabled, blacklist);
    });
  }
});

// Écouter les messages pour mettre à jour le compteur de mots bloqués
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBlockedCount") {
    chrome.storage.sync.get("blockedCount", (data) => {
      sendResponse({ count: data.blockedCount || 0 });
    });
    return true;
  }
});
