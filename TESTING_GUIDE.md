# Guide de validation MyClub

Les commandes ci-dessous servent à valider l'état courant du dépôt. Les résultats datés et leurs limites figurent dans [docs/AUDIT_TECHNIQUE_2026-11-19.md](docs/AUDIT_TECHNIQUE_2026-11-19.md).

## Backend Django

Depuis `backend/`, activez l'environnement virtuel puis lancez les contrôles rapides. Ils utilisent une base SQLite en mémoire isolée pour les tests unitaires.

```powershell
python manage.py check --settings=clubsite.test_settings
python manage.py makemigrations --check --dry-run --settings=clubsite.test_settings
python manage.py test --settings=clubsite.test_settings
```

La validation d'intégration doit utiliser une base PostgreSQL réservée aux tests, configurée dans `backend/.env`. Vérifiez d'abord le nom de la base et son contenu. Appliquez les migrations avant de lancer l'API.

Les tests API couvrent les huit rôles seedés, les accès refusés, les workflows de projet, l'intégrité des liens entre projet/tâche/jalon et l'import depuis une archive MongoDB. Ils utilisent la base SQLite en mémoire isolée et ne remplacent pas une validation PostgreSQL.

## Frontend React/Vite

Depuis `frontend/` :

```powershell
npm ci
npm test
npm run build
npm audit
```

Le contrôle manuel de connexion utilise les variables d'environnement `MYCLUB_TEST_EMAIL` et `MYCLUB_TEST_PASSWORD`. Il ne contient pas d'identifiants intégrés et n'affiche pas les jetons reçus :

```powershell
$env:MYCLUB_TEST_EMAIL = "compte-de-test@example.org"
$env:MYCLUB_TEST_PASSWORD = "mot-de-passe-du-compte-de-test"
node .\test_login.js
```

N'utilisez pas un compte de production pour les tests automatisés. Le script retourne un code d'erreur si les variables manquent ou si l'API ne fournit pas les deux jetons.
