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

// Fonction pour remplacer les mots sur les autres sites
function replaceWords(blacklist) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  let localBlockedCount = 0;
  let node;

  while ((node = walker.nextNode())) {
    let text = node.nodeValue;
    blacklist.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        localBlockedCount += matches.length;
      }
      node.nodeValue = text.replace(regex, "❤️");
    });
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

  chrome.storage.local.get("blockedCount", (data) => {
    const currentBlockedCount = data.blockedCount || 0;
    const updatedBlockedCount = currentBlockedCount + newBlockedCount;
    chrome.storage.local.set({ blockedCount: updatedBlockedCount }, () => {
      chrome.runtime.sendMessage({
        action: "updateBlockedCount",
        count: updatedBlockedCount,
      });
    });
  });
}

function initializeBlocker(isBlockingEnabled, blacklist) {
  const isTwitter = window.location.hostname.includes("x.com");

  if (isBlockingEnabled) {
    updateBlockedCount(blacklist, isTwitter);
    startObserver(blacklist, isTwitter);
  } else {
    if (observer) {
      observer.disconnect();
    }
    chrome.storage.local.set({ blockedCount: 0 });
  }
}

// Charger l'état et la liste des mots blacklistés au démarrage
chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
  const isBlockingEnabled = data.isBlockingEnabled || false;
  const userBlacklist = data.blacklist || [];
  const blacklist = mergeBlacklists(userBlacklist);
  initializeBlocker(isBlockingEnabled, blacklist);
});

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBlockedCount") {
    chrome.storage.local.get("blockedCount", (data) => {
      sendResponse({ count: data.blockedCount || 0 });
    });
    return true; // Indicates that the response is asynchronous
  }
});
