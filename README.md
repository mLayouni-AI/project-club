# MyClub — Club DIA

MyClub centralise la vie du Club DIA — Digitalisation & Intelligence Artificielle : comptes, adhésions, projets, tâches, événements, annonces et notifications.

## Architecture

- **Frontend** : React 19, Vite, Tailwind CSS 4, React Router et Axios. Vitest et React Testing Library servent aux tests.
- **Backend** : Django 6, Django REST Framework et Simple JWT. L'API REST est versionnée sous `/api/v1/`.
- **Base principale** : PostgreSQL, utilisé par Django ORM et géré par les migrations Django. La configuration active refuse les URL de base de données non PostgreSQL. SQLite en mémoire est réservé aux tests ; MongoDB sert uniquement de source aux outils de sauvegarde et de migration historiques.
- **Documentation API** : Swagger à `/api/v1/docs/` et schéma OpenAPI à `/api/v1/openapi.json`.

### Organisation du backend

Le projet Django se trouve dans `backend/`. `clubsite/` contient les paramètres, les routes racine de l'API et les points d'entrée ASGI/WSGI. Les applications Django sont séparées par domaine ; chacune regroupe ses modèles, sérialiseurs, vues, routes et migrations :

- `apps.members` : comptes, profils, demandes d'adhésion, rôles, capacités, journal d'audit et tableaux de bord.
- `apps.projects` : projets, équipes, jalons, tâches et livrables associés.
- `apps.events` : événements, inscriptions et suivi des présences.
- `apps.announcements` : annonces et notifications destinées aux utilisateurs.

### Organisation du frontend

Le client React se trouve dans `frontend/src/`. `App.jsx` assemble les routes et la mise en page ; `pages/` contient les écrans par fonctionnalité et `components/` les éléments partagés. `context/AuthContext.jsx` gère l'état de session et les capacités de l'utilisateur, tandis que `services/api.js` centralise les appels HTTP. Les tests Vitest et React Testing Library sont dans `src/__tests__/`.

### Rôles et permissions

Les migrations initialisent huit rôles métier et leurs capacités. L'API vérifie les permissions côté serveur ; les contrôles du frontend servent à adapter l'affichage et la navigation. La matrice ci-dessous résume les capacités actuellement attribuées dans le code. Elle reste provisoire jusqu'à validation avec le cahier des charges du Club DIA.

| Rôle | Capacités principales actuellement attribuées |
| --- | --- |
| `visitor` — Visiteur | Consulter les événements autorisés. |
| `member` — Membre | Consulter et proposer des projets, consulter les événements et les annonces membres. |
| `club_admin` — Administrateur du club | Toutes les capacités définies : membres et adhésions, rôles, projets, événements, annonces, audit et indicateurs. |
| `project_lead` — Chef de projet | Consulter et proposer des projets, gérer l'équipe et les tâches, examiner les livrables attribués. |
| `president` — Président du club | Consulter projets, événements et annonces membres, consulter l'audit et les indicateurs globaux. |
| `event_manager` — Responsable des événements | Consulter et gérer les événements attribués, suivre les présences et consulter les annonces membres. |
| `pedagogical_supervisor` — Encadrant pédagogique | Consulter les projets autorisés et examiner les livrables attribués. |
| `communications_manager` — Responsable de la communication | Consulter et gérer les annonces. |

### Fonctionnalités principales

- Authentification par JWT, inscription et demandes d'adhésion, connexion/déconnexion, renouvellement de session, réinitialisation du mot de passe et gestion du profil.
- Gestion des membres, examen des demandes d'adhésion et attribution contrôlée des rôles métier.
- Suivi des projets et de leurs équipes, jalons, tâches, livrables et fichiers privés.
- Publication d'événements, inscriptions et gestion des présences.
- Publication d'annonces selon leur audience, notifications et tableaux de bord adaptés aux permissions.
- Journalisation des actions sensibles et exports CSV des membres et des participants aux événements via l'API.

## Prérequis

- Python 3.12 ou ultérieur, avec pip.
- Node.js 22.13 ou ultérieur et npm.
- Une instance PostgreSQL accessible depuis Django.
- MongoDB uniquement si les données historiques doivent être sauvegardées ou migrées.

## Installation backend (PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Si `backend/.env` existe déjà, conservez-le et vérifiez localement ses paramètres sans publier ses valeurs.

Créez une base et un rôle PostgreSQL avec un outil local tel que `psql` ou pgAdmin. Exemple de commandes SQL, avec un mot de passe local à choisir :

```sql
CREATE ROLE myclub LOGIN PASSWORD 'choose-a-local-password';
CREATE DATABASE myclub OWNER myclub;
```

Configurez `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` et `DB_PORT` dans `backend/.env`. Une URL `DATABASE_URL` PostgreSQL peut remplacer ces paramètres. `backend/.env.example` ne contient que des valeurs factices.

Appliquez les migrations, puis créez le compte Django utilisé pour accéder à l'administration :

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Le serveur API local écoute sur `http://127.0.0.1:8000/`. Les migrations initialisent les huit rôles et leurs capacités. Le compte créé avec `createsuperuser` est un compte Django `is_superuser`; attribuez les rôles métier selon la politique du club.

## Installation frontend

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Vite démarre sur `http://localhost:5173`. `VITE_API_BASE_URL` permet de changer l'URL de l'API. Les jetons de session sont gardés dans `sessionStorage`; l'ancien stockage local du prototype est supprimé au chargement de l'application.

## Sauvegarde et migration MongoDB

La commande de sauvegarde crée une archive compressée et n'altère pas la source :

```powershell
cd backend
python scripts/backup_mongodb.py
```

La migration utilise l'archive JSON compressée comme source. Sans `--apply`, elle affiche un rapport prévisionnel sans écrire dans PostgreSQL :

```powershell
python manage.py migrate_from_mongodb
```

Après validation de la sauvegarde, de la base PostgreSQL et du rapport, `--apply` exécute la migration dans une transaction. Les comptes historiques `admin` ou `super_admin` nécessitent aussi l'approbation explicite du passage à `club_admin` :

```powershell
python manage.py migrate_from_mongodb --apply --confirm-legacy-admin-mapping
```

Les ObjectId sont conservés dans `legacy_id` et les mots de passe PBKDF2 reconnus par Django gardent leur hash. L'import ne se connecte pas à MongoDB et n'écrase pas les lignes cible : une ligne historique existante doit correspondre au snapshot, sinon la transaction est annulée. Les relations manquantes sont ajoutées sans remplacer les associations existantes. Les données source et l'archive ne sont jamais supprimées. Vérifiez les comptes, rôles, relations et nombres migrés avant toute décision de retrait de MongoDB.

Les sauvegardes locales de `backend/backups/` sont ignorées par Git et doivent être conservées jusqu'à la fin de la migration. Le rapport de livraison du 4 novembre 2026 consignait l'archive `mongodb-20261104T213013Z.json.gz` (2 104 octets, SHA-256 `865ee412731c4baeefcfb8b9c33a001e7f0f68ecd223d6381110d0cb90cd9bf8`) avec 14 membres, 14 e-mails uniques, 14 hashes PBKDF2 reconnus et une répartition historique de 5 comptes `admin` et 9 `member`. Il consignait aussi un dump BSON de 16 collections et 27 documents. Ces chiffres sont historiques et n'ont pas été revérifiés pendant le nettoyage ; ils ne prouvent pas l'état actuel des archives ni qu'un import PostgreSQL a eu lieu. Revalidez le snapshot et la cible avant `--apply`.

## Authentification et session

Les endpoints d'authentification sont versionnés sous `/api/v1/auth/` : `signup`, `login`, `refresh`, `logout`, `me`, `password/change`, `password/reset` et `password/reset/confirm`. L'inscription crée une demande d'adhésion ; la réinitialisation par e-mail nécessite un relais SMTP réellement configuré.

Le frontend conserve les jetons JWT dans `sessionStorage`, renouvelle l'access token après une réponse `401` et efface la session après expiration ou échec du refresh. Les autorisations sont toujours vérifiées côté API. Le smoke test optionnel `frontend/test_login.js` lit `MYCLUB_TEST_EMAIL` et `MYCLUB_TEST_PASSWORD` depuis l'environnement, n'affiche pas les jetons et doit être utilisé uniquement avec un compte de test.

## Sauvegarde PostgreSQL

Exemple de sauvegarde personnalisée :

```powershell
pg_dump --format=custom --file="myclub-backup.dump" --dbname="myclub"
```

Restauration dans une base de restauration dédiée :

```powershell
createdb myclub_restore
pg_restore --no-owner --dbname="myclub_restore" "myclub-backup.dump"
```

Vérifiez la restauration avant de remplacer une base en service. Conservez les archives de sauvegarde en dehors du dépôt Git.

## Tests et build

Depuis `backend/`, les tests Django utilisent une base SQLite en mémoire isolée :

```powershell
python manage.py check --settings=clubsite.test_settings
python manage.py makemigrations --check --dry-run --settings=clubsite.test_settings
python manage.py test --settings=clubsite.test_settings
```

Pour valider PostgreSQL, configurez `backend/.env` vers une base de test PostgreSQL dédiée puis exécutez les mêmes commandes sans `--settings=clubsite.test_settings`.

Les tests backend couvrent les huit rôles seedés, les refus d'accès, les workflows projet, les liens entre projets/tâches/jalons et l'import d'une archive MongoDB. La base SQLite en mémoire valide les tests unitaires, mais ne remplace pas les tests d'intégration PostgreSQL. Les tests frontend Vitest couvrent notamment l'inscription, les membres, les événements et les projets.

Depuis `frontend/` :

```powershell
npm test
npm run build
npm audit
```

## Configuration de production

- Définissez une clé `SECRET_KEY` aléatoire et privée dans l'environnement.
- Utilisez `DEBUG=False`, des `ALLOWED_HOSTS` explicites et des origines CORS limitées.
- Configurez PostgreSQL avec TLS selon l'hébergeur (`DB_SSLMODE`).
- Configurez SMTP avant d'utiliser la réinitialisation par e-mail.
- Servez le site et l'API derrière HTTPS. Les réglages Django de production activent la redirection HTTPS, les cookies sécurisés, HSTS et les en-têtes de sécurité.
- Configurez les sauvegardes, leur rétention et des exercices de restauration.
- Collectez les fichiers statiques avec `python manage.py collectstatic` et servez `STATIC_ROOT` par le serveur de déploiement.
- Les fichiers de projet sont privés et doivent être servis par leur endpoint authentifié, pas par un répertoire public.

## Décisions métier à confirmer

La matrice des huit rôles présentée ci-dessus décrit le code actuel et reste provisoire jusqu'à comparaison avec le cahier des charges du Club DIA. Les règles finales d'admission, la politique de publication, le mapping des comptes historiques et les coordonnées officielles du club restent à confirmer par ses responsables.
