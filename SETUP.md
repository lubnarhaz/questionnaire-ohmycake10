# Setup — Questionnaire OhMyCake10 + Google Apps Script

## Etape 1 : Creer le Google Apps Script

1. Va sur **https://script.google.com**
2. Clique **Nouveau projet**
3. Renomme le projet : `Questionnaire OhMyCake10`
4. Supprime tout le contenu du fichier `Code.gs`
5. Copie-colle le contenu du fichier `Code.gs` de ce repo
6. Verifie que `OWNER_EMAIL` correspond a ton adresse Gmail

## Etape 2 : Deployer comme Web App

1. Dans Apps Script, clique **Deployer** > **Nouveau deploiement**
2. Clique l'icone engrenage a cote de "Type" et selectionne **Application Web**
3. Configure :
   - **Description** : Questionnaire OhMyCake10
   - **Executer en tant que** : Moi (ton compte)
   - **Qui a acces** : Tout le monde
4. Clique **Deployer**
5. La premiere fois il te demandera d'autoriser les permissions (Gmail, Drive, Sheets) — clique **Autoriser**
6. **Copie l'URL du deploiement** (elle ressemble a `https://script.google.com/macros/s/AKfyc.../exec`)

## Etape 3 : Connecter le HTML au Apps Script

1. Ouvre le fichier `index.html`
2. Cherche la ligne :
   ```javascript
   const APPS_SCRIPT_URL = 'COLLE_TON_URL_ICI';
   ```
3. Remplace `COLLE_TON_URL_ICI` par l'URL copiee a l'etape 2
4. Sauvegarde le fichier

## Etape 4 : Deployer le HTML sur GitHub Pages

```bash
cd ~/Desktop/L-BOOST/questionnaire-ohmycake10
git add -A
git commit -m "Add Apps Script integration + PDF + WhatsApp"
git push
```

Le site sera mis a jour sur : https://lubnarhaz.github.io/questionnaire-ohmycake10/

## Etape 5 : Tester

1. Ouvre https://lubnarhaz.github.io/questionnaire-ohmycake10/
2. Remplis le formulaire (au moins les champs obligatoires marques d'un losange dore)
3. Clique "Envoyer mes reponses"
4. Verifie que :
   - [x] L'ecran de succes s'affiche
   - [x] Un PDF se telecharge localement
   - [x] WhatsApp s'ouvre avec le message pre-rempli
   - [x] Tu recois un Gmail avec le PDF en piece jointe
   - [x] Un fichier PDF apparait dans Google Drive > dossier "Questionnaires OhMyCake10"
   - [x] Une ligne a ete ajoutee dans le Google Sheet "Questionnaires OhMyCake10"

## En cas de probleme

### Erreur CORS
- Verifie que le deploiement est en mode "Tout le monde" pour l'acces
- Verifie que l'URL se termine par `/exec` (pas `/dev`)

### Le mail n'arrive pas
- Verifie le quota Gmail (100 mails/jour en Apps Script gratuit)
- Regarde les logs : Apps Script > Executions

### Le Sheet n'est pas cree
- Ouvre Apps Script > Executions et verifie les erreurs
- La premiere execution doit avoir les permissions Drive + Sheets

### Mettre a jour le code Apps Script
1. Modifie le code dans l'editeur Apps Script
2. **Deployer** > **Gerer les deploiements** > **Modifier** (icone crayon)
3. Change la version en **Nouveau version**
4. Clique **Deployer**
