# MyClub — Club DIA

MyClub centralise la vie du Club DIA — Digitalisation & Intelligence Artificielle : comptes, adhésions, projets, tâches, événements, annonces et notifications.

## Architecture

La décision de pile, ses alternatives et ses conséquences sont consignées dans [ADR-001 — Architecture](docs/ADR-001-architecture.md).
Le modèle des données, la matrice RBAC provisoire, les cas d'utilisation et les routes API sont décrits dans [Architecture MyClub](docs/ARCHITECTURE.md). L'état réellement vérifié le 19 novembre 2026 figure dans [l'audit technique](docs/AUDIT_TECHNIQUE_2026-11-19.md).

- **Frontend** : React 19, Vite, Tailwind CSS 4, React Router, Axios, Vitest et React Testing Library.
- **Backend** : Django 6, Django REST Framework et Simple JWT. L'API est versionnée sous `/api/v1/`.
- **Données actives** : PostgreSQL avec Django ORM. MongoDB ne sert que de source à l'outil de sauvegarde et de migration.
- **Documentation API** : Swagger à `/api/v1/docs/` et schéma OpenAPI à `/api/v1/openapi.json`.

La configuration Django refuse les URL de base de données non PostgreSQL. Les tests rapides utilisent une base SQLite en mémoire dédiée aux tests ; elle n'est pas la base de développement ou de production.

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

## État et décisions de club

Le rapport de livraison historique est dans [docs/ETAT_DE_LIVRAISON.md](docs/ETAT_DE_LIVRAISON.md); son addendum et [l'audit du 19 novembre 2026](docs/AUDIT_TECHNIQUE_2026-11-19.md) donnent l'état actuel. Les règles finales d'admission, le cahier des huit rôles, la politique de publication, le mapping des comptes historiques et les coordonnées officielles du club restent à confirmer par ses responsables.
