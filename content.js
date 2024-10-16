let observer = null;

// Fonction pour filtrer les tweets en fonction de la blacklist
function filterTweets(blacklist) {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    const tweetText = tweet.innerText.toLowerCase();

    // Vérifier s'il y a des mots blacklistés
    blacklist.forEach((word) => {
      if (tweetText.includes(word.toLowerCase())) {
        // alert(`Ce tweet contient un mot inapproprié : ${word}`);
        tweet.remove(); // Supprime le tweet
      }
    });

    // Vérifier les liens de phishing
    if (tweetText.includes("http")) {
      // alert("Ce tweet contient un lien suspect, attention au phishing !");
    }
  });
}

// Fonction pour observer les changements dans la page
function startObserver(blacklist) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    filterTweets(blacklist);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Charger l'état du blocage et la liste de mots blacklistés au démarrage
chrome.storage.sync.get(["isBlockingEnabled", "blacklist"], (data) => {
  const isBlockingEnabled = data.isBlockingEnabled || false;
  const blacklist = data.blacklist || [];

  if (isBlockingEnabled) {
    startObserver(blacklist);
  }
});

// Écouter les changements dans le stockage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    // Si l'état du blocage change
    if (changes.isBlockingEnabled) {
      const isBlockingEnabled = changes.isBlockingEnabled.newValue;

      if (isBlockingEnabled) {
        // Si le blocage est activé, démarrer l'observation avec la blacklist actuelle
        chrome.storage.sync.get("blacklist", (data) => {
          const blacklist = data.blacklist || [];
          filterTweets(blacklist); // Filtre les tweets existants immédiatement
          startObserver(blacklist); // Démarrer l'observateur
        });
      } else {
        // Si le blocage est désactivé, arrêter l'observateur et recharger la page
        if (observer) observer.disconnect(); // Arrête l'observateur avant de recharger la page
        window.location.reload();
      }
    }

    // Si la blacklist change
    if (changes.blacklist) {
      const newBlacklist = changes.blacklist.newValue;

      // Vérifier si le blocage est activé avant de filtrer les tweets
      chrome.storage.sync.get("isBlockingEnabled", (data) => {
        const isBlockingEnabled = data.isBlockingEnabled || false;
        if (isBlockingEnabled) {
          // Si le blocage est activé, appliquer la nouvelle blacklist immédiatement
          filterTweets(newBlacklist);
        }
      });
    }
  }
});
