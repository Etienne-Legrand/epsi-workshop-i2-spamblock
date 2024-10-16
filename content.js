let observer = null;
const internalBlacklist = ["insult1", "insult2", "con"]; // Liste interne de mots injurieux

// Fonction pour fusionner les listes interne et utilisateur
function mergeBlacklists(userBlacklist) {
  return [...new Set([...internalBlacklist, ...userBlacklist])];
}

// Fonction pour filtrer les tweets sur Twitter
function filterTweets(blacklist) {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    const tweetText = tweet.innerText.toLowerCase();
    // Vérifier si le tweet contient des mots blacklistés en utilisant des expressions régulières
    const regex = new RegExp(`\\b(${blacklist.join("|")})\\b`, "i"); // 'i' pour ignorer la casse

    if (regex.test(tweetText)) {
      tweet.remove(); // Supprime le tweet
    }

    // Vérification pour les liens de phishing
    if (tweetText.includes("http")) {
      // Alerte de phishing désactivée, peut être activée plus tard
    }
  });
}

// Fonction pour remplacer les mots sur les autres sites
function replaceWords(blacklist) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  let node;
  while ((node = walker.nextNode())) {
    let text = node.nodeValue;

    blacklist.forEach((word) => {
      // Création d'une expression régulière pour le mot entier
      const regex = new RegExp(`\\b${word}\\b`, "gi"); // Le `\\b` assure que ce soit un mot entier
      node.nodeValue = node.nodeValue.replace(regex, "❤️");
    });
  }
}

// Fonction pour observer les changements de la page
function startObserver(blacklist, isTwitter) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    if (isTwitter) {
      filterTweets(blacklist);
    } else {
      replaceWords(blacklist);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Charger l'état et la liste des mots blacklistés au démarrage
chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
  const isBlockingEnabled = data.isBlockingEnabled || false;
  const userBlacklist = data.blacklist || [];
  const blacklist = mergeBlacklists(userBlacklist);

  const isTwitter = window.location.hostname.includes("x.com");

  if (isBlockingEnabled) {
    if (isTwitter) {
      filterTweets(blacklist); // Appliquer le filtre Twitter immédiatement
    } else {
      replaceWords(blacklist); // Remplacer les mots sur les autres sites immédiatement
    }
    startObserver(blacklist, isTwitter);
  }
});

// Écouter les changements dans le stockage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    if (changes.isBlockingEnabled) {
      const isBlockingEnabled = changes.isBlockingEnabled.newValue;

      chrome.storage.sync.get("blacklist", (data) => {
        const userBlacklist = data.blacklist || [];
        const blacklist = mergeBlacklists(userBlacklist);
        const isTwitter = window.location.hostname.includes("x.com");

        if (isBlockingEnabled) {
          if (isTwitter) {
            filterTweets(blacklist); // Appliquer immédiatement sur Twitter
          } else {
            replaceWords(blacklist); // Appliquer immédiatement sur les autres sites
          }
          startObserver(blacklist, isTwitter);
        } else {
          if (observer) observer.disconnect(); // Arrête l'observation
          window.location.reload(); // Recharge la page pour désactiver l'effet
        }
      });
    }

    if (changes.blacklist) {
      const newBlacklist = changes.blacklist.newValue;
      const blacklist = mergeBlacklists(newBlacklist);
      const isTwitter = window.location.hostname.includes("x.com");

      chrome.storage.sync.get("isBlockingEnabled", (data) => {
        const isBlockingEnabled = data.isBlockingEnabled || false;
        if (isBlockingEnabled) {
          if (isTwitter) {
            filterTweets(blacklist); // Appliquer sur Twitter
          } else {
            replaceWords(blacklist); // Appliquer sur les autres sites
          }
        }
      });
    }
  }
});
