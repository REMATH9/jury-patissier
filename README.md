# Jury Pâtisserie – Révision

Application statique/PWA pour préparer le Jury central Boulanger-Pâtissier en Wallonie.

## Fonctionnalités
- 172 questions couvrant tout le livret
- Révision par thème
- Sessions mixtes de 10 ou 25 questions
- Examen blanc de 30 questions
- Explication après chaque réponse
- Questions ratées automatiquement ajoutées à « À revoir »
- Progression et séries sauvegardées localement
- Mode clair/sombre
- Installable sur téléphone
- Fonctionne hors ligne après la première visite

## Mise en ligne avec GitHub Pages
1. Créer un dépôt GitHub, par exemple `jury-patisserie`.
2. Envoyer tous les fichiers de ce dossier à la racine du dépôt.
3. Dans GitHub : **Settings → Pages**.
4. Dans **Build and deployment**, choisir **Deploy from a branch**.
5. Choisir la branche `main` et le dossier `/ (root)`, puis **Save**.
6. Après publication, GitHub affiche l'URL du site.

## Installer sur téléphone
### iPhone
Ouvrir le site dans Safari → Partager → **Sur l’écran d’accueil**.

### Android
Ouvrir le site dans Chrome → menu ⋮ → **Ajouter à l’écran d’accueil** ou **Installer l’application**.

## Modifier les questions
Toutes les questions sont dans `questions.js`.

## V2 – Mode Fiches
- nouvel onglet **Fiches**
- question seule au recto
- toucher la carte pour afficher réponse + explication
- boutons **Je sais** / **À revoir**
- progression des fiches sauvegardée localement
- interface optimisée smartphone

Pour mettre à jour une V1 déjà publiée, remplace tous les fichiers par ceux de ce ZIP.


## V3 – Thème « Valeurs clés 🔢 »
La base contient maintenant **214 questions** au total.

Le nouveau thème regroupe les chiffres à mémoriser :
- Jury central : score, délais, frais, code examen
- AFSCA : froid, chaud, surgelés, friture, durées de conservation
- pâtisserie : crème anglaise et tempérage du chocolat
- boulangerie : hydratation et quelques repères de température

Les explications distinguent les **valeurs réglementaires** des **repères techniques**.

### Sources principales vérifiées en septembre 2026
- SPW Économie – Jury central boulanger-pâtissier et inscription au Jury central
- AFSCA – températures de conservation et Guide d’autocontrôle boulangerie-pâtisserie G-026
- AFSCA – circulaire sur les dérogations de température (viennoiseries à crème pâtissière, tarte au riz)
- École Valrhona – tempérage du chocolat et crème anglaise
- Lesaffre France – gestion de la fermentation par fortes chaleurs


## V4 – QCM difficile
- bonne réponse A/B/C/D mélangée à chaque affichage
- mode **Difficile** activé par défaut
- mode **Classique** toujours disponible
- 154 questions techniques disposent de distracteurs experts réécrits manuellement
- les questions « Valeurs clés » utilisent leurs valeurs proches puis sont mélangées
- l’onglet Fiches reste inchangé : aucune proposition visible avant retournement

## V5 – correction GitHub Pages / cache
Cette version force le rechargement de `style.css`, `app.js` et `questions.js`
grâce à un numéro de version dans les URLs et à un service worker `network-first`.

Après publication :
1. attendre 1–2 minutes ;
2. ouvrir le site dans le navigateur ;
3. vérifier que `V5` apparaît sur l'accueil ;
4. fermer puis rouvrir l'app installée sur l'écran d'accueil si nécessaire.


## V6 – contenu uniquement
- suppression complète du thème **Examen & méthode**
- suppression des valeurs purement administratives du Jury :
  score minimum, frais d'inscription, délai avant nouvelle tentative,
  convocation, résultats, code d'examen et accès par expérience
- conservation des valeurs réellement utiles au métier :
  températures, temps de conservation, HACCP, chocolat, crème anglaise,
  hydratation, froid/chaud, etc.
- **197 questions** restantes, centrées sur la matière à connaître
