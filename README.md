# SpamBlock

SpamBlock est une extension Chromium qui supprime les posts contenant des mots blacklistés sur Twitter et remplace les mots injurieux par des cœurs sur les autres sites.

## Fonctionnalités

- Supprime les posts avec des mots blacklistés sur Twitter.
- Remplace les mots injurieux par des cœurs sur les autres sites.
- Affiche le nombre total de mots bloqués.
- Permet d'ajouter des mots à la liste noire via l'interface popup.

## Installation en mode développeur

1. Clonez ce dépôt sur votre machine locale.
2. Ouvrez votre navigateur et accédez à `chrome://extensions/` sur Google Chrome.
3. Activez le **Mode développeur** en haut à droite de la page.
4. Cliquez sur le bouton **Charger l'extension non empaquetée** et sélectionnez le dossier où vous avez cloné ce dépôt.
5. L'extension devrait maintenant apparaître dans la liste des extensions installées.

## Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils de Chrome pour ouvrir l'interface popup.
2. Utilisez l'interrupteur pour activer ou désactiver le blocage.
3. Ajoutez des mots à la liste noire en utilisant le champ de saisie et le bouton "Ajouter".
4. Le nombre total de mots bloqués sera affiché dans l'interface popup.

## Structure du projet

- `manifest.json` : Le fichier de configuration de l'extension.
- `background.js` : Le script de fond qui gère les événements de l'extension.
- `content.js` : Le script de contenu qui observe et modifie les pages web.
- `popup.html` : Le fichier HTML pour l'interface popup.
- `popup.js` : Le script qui gère les interactions dans l'interface popup.
- `popup.css` : Les styles pour l'interface popup.
- `images/` : Les icônes de l'extension.
- `Examples` : Dossier qui ne fait pas partie de l'extension contenant des extensions d'exemples extraite de la documentation de Chrome.
