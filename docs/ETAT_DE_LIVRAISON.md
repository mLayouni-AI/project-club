# État de livraison MyClub

Date de vérification : 4 novembre 2026.

> Rapport historique. L'état actuel et les vérifications du 19 novembre 2026 figurent dans [l'audit actualisé](AUDIT_TECHNIQUE_2026-11-19.md); les résultats ci-dessous ne décrivent pas l'état le plus récent.

Ce rapport décrit les fichiers et données présents dans l'espace de travail, les changements réalisés durant cette passe et les limites réellement vérifiées. L'audit initial est conservé dans [AUDIT_TECHNIQUE.md](AUDIT_TECHNIQUE.md).

## A. Architecture

- **Frontend** : React 19, Vite 7, Tailwind CSS 4, React Router 7, Axios, Vitest et React Testing Library. L'interface utilise un contexte d'authentification commun et des appels HTTP à `/api/v1/`.
- **Backend** : Django 6 et Django REST Framework, Simple JWT avec rotation et liste de révocation des refresh tokens. Les routes REST et la documentation OpenAPI sont versionnées sous `/api/v1/`.
- **Base visée** : PostgreSQL exclusivement via Django ORM. Les paramètres de production/développement de `settings.py` n'ont pas de repli SQLite. SQLite est uniquement configuré dans `clubsite.test_settings` pour les tests rapides.
- **Accès** : rôles relationnels multiples et capacités vérifiées côté serveur. Les projets et événements ajoutent des vérifications par responsable, équipe ou ressource.
- **Modèles relationnels** : utilisateur, rôle, capacité, profil, demande d'adhésion, audit, projet, équipe, tâche, commentaire, jalon, fichier privé, événement, inscription, présence, annonce et notification.

Un serveur PostgreSQL écoute sur `127.0.0.1:5432` et `pg_isready` accepte les connexions. Django ne peut toutefois pas s'y authentifier : aucun mot de passe PostgreSQL n'est configuré dans `backend/.env` et aucune entrée locale de mot de passe n'est présente. Aucune migration ni écriture PostgreSQL n'a été tentée.

## B. Modifications réalisées

| Fichier / zone | Avant | Après | Motif |
|---|---|---|---|
| `frontend/package.json`, `package-lock.json`, `vite.config.js`, `index.html` | Create React App ; le manifeste de dépendances local était illisible pour npm | Scripts Vite, Tailwind v4, Vitest et RTL ; manifeste et verrou npm régénérés | Aligner le frontend sur la stack demandée et permettre tests/build reproductibles |
| `frontend/src/index.css`, composants et pages | Palette bleue et style hérité du prototype | Palette vert/blanc, composants communs, navigation responsive et pages harmonisées | Aligner l'interface sur la charte du Club DIA |
| `frontend/src/pages/Projects.jsx`, `services/api.js` | Les tâches n'étaient visibles que dans les tableaux de bord | Liste paginée des tâches accessibles, création selon les capacités et changement de statut persisté par l'API | Compléter le suivi d'équipe sans données locales fictives |
| `frontend/src/context/AuthContext.jsx`, `services/api.js` | Données fictives de repli, mutations locales et journaux de requêtes ; mot de passe et JWT écrits dans la console/localStorage | Appels API versionnés, refresh JWT, stockage de session, erreurs explicites et aucune fausse réussite | Relier l'interface au serveur et retirer les fuites de secrets et les faux succès |
| `frontend/src/App.jsx`, `components/Navbar.jsx`, `pages/Landing.jsx` | Portail public protégé ou absent ; identité « Club Dev » et nombres de démonstration | Accueil public Club DIA, routes publiques et privées, menu adaptatif par capacité | Corriger l'accès public et l'identité du produit |
| `frontend/src/pages/Projects.jsx`, `Events.jsx`, `Announcements.jsx` | Modifications locales et annonces fictives | Listes/API, propositions de projets, inscriptions et présences, publication d'annonces | Rendre les principaux parcours persistants |
| `frontend/src/pages/Members.jsx`, `MembershipRequests.jsx`, `Notifications.jsx`, `PasswordReset.jsx` | Ancien CRUD sans endpoints correspondants | Répertoire paginé, rôles, activation/désactivation, adhésions, notifications lues/non lues et réinitialisation | Utiliser les opérations réellement offertes par l'API |
| `frontend/src/pages/DashboardAdmin.jsx`, `DashboardMember.jsx` | Compteurs calculés sur des listes limitées ou du contenu statique | Indicateurs et listes reçus de l'endpoint dashboard | Ne pas présenter d'agrégats fictifs ou tronqués comme des totaux |
| `backend/apps/members/views.py`, `serializers.py`, `dashboard.py` | Tests obsolètes ; création d'adhésion ne renvoyant pas son identifiant ; profil sans état du compte | Contrat de création complet, champ d'activité, réactivation auditée et indicateurs agrégés | Corriger les parcours et faciliter leur vérification |
| `backend/apps/projects/views.py` | Une proposition non publique créée par un membre n'était plus visible par son auteur ; notifications d'affectation absentes | L'auteur voit sa proposition ; affectations et tâches créent des notifications | Corriger l'isolation tout en gardant les propositions privées et relier les notifications |
| `backend/apps/announcements/views.py` | Publication persistante mais sans notification ciblée | Une première publication notifie les comptes actifs selon l'audience ; les republis ne dupliquent pas l'envoi | Compléter le flux d'annonces |
| `backend/apps/members/tests.py`, `frontend/src/__tests__/` | Ancien test Django importait `Member`, modèle supprimé ; test frontend utilisait Jest/CRUD fictif | Tests Django API/permissions et tests Vitest/RTL sur les données API et le portail public | Tester les modèles et routes actuels |
| `.gitignore`, `.env.example`, `README.md`, `docs/` | Configuration locale et consignes de démarrage incomplètes | Fichiers d'exemple, installation, sauvegarde, migration et état de livraison documentés | Permettre une installation reproductible sans publier les secrets |

`backend/.env` et `backend/db.sqlite3` ont été retirés de l'index Git avec `git rm --cached`. Les fichiers locaux existent toujours et les règles d'ignore sont présentes ; aucune base ni valeur locale n'a été supprimée.

## C. Migration des données

### État initial vérifié

MongoDB configuré était joignable en lecture seule. Les collections de la base comptaient :

- `members` : 14 documents ; 14 e-mails uniques, aucun doublon, 14 documents avec les champs d'identité requis.
- `projects` et `events` : 0 document.
- Collections héritées en majuscules `Members`, `Projects`, `Events` : 0 document chacune.
- Collections utilisateur/groupes de compatibilité : 0 document.
- Rôles historiques : 5 `admin`, 9 `member`.
- Les 14 hashes de mots de passe utilisent `pbkdf2_sha256`, reconnu par Django.

Une archive complète compressée existe dans `backend/backups/mongodb-20261104T213013Z.json.gz` (2 104 octets). Sa décompression et son contenu ont été vérifiés : 14 membres, 14 e-mails uniques, 14 hashes PBKDF2 reconnus, 5 rôles `admin` et 9 `member`. SHA-256 : `865ee412731c4baeefcfb8b9c33a001e7f0f68ecd223d6381110d0cb90cd9bf8`. L'archive est ignorée par Git et la base source n'a pas été modifiée.

Un dump BSON produit avec `mongodump` est ?galement v?rifi? dans `backend/backups/mongo_20261104_225936_756460/`. Les collections `Members` et `Projects` (majuscules) sont s?par?es pour ?viter leur collision de noms de fichiers sous Windows. Les 16 collections source et leurs 27 documents correspondent aux fichiers BSON d?cod?s ; la collection `members` contient 14 documents, 14 e-mails uniques et 14 hashes PBKDF2 (5 r?les `admin`, 9 `member`). Ces sauvegardes sont ignor?es par Git. La source MongoDB n'a subi aucune ?criture.

SQLite contient 10 tables ; `auth_user`, `django_session` et `django_admin_log` contiennent 0 ligne. Aucun compte applicatif SQLite n'est à transférer.

### Résultat

- Données migrées vers PostgreSQL : **0** ; l'instance répond, mais l'accès exige des paramètres d'authentification absents de `backend/.env`.
- Données MongoDB conservées : **14 membres**, 0 projet, 0 événement.
- Données SQLite conservées localement : base présente ; aucun compte utilisateur trouvé.
- Archive source conservée. La commande `migrate_from_mongodb` n'a pas été lancée contre une cible PostgreSQL, et `--apply` n'a pas été utilisé.
- Le test de schéma Django indique qu'aucune migration supplémentaire n'est détectée. Les migrations d'application n'ont toutefois pas été appliquées à PostgreSQL ici.

La migration réelle et le rapprochement des 14 comptes restent à effectuer. Le script ne supprime aucune donnée source et le retrait du code de sauvegarde/migration attend la vérification de l'import.

## D. État des fonctionnalités

| Module | État | Détail |
|---|---|---|
| Portail public | Partiellement terminé | Accueil, présentation, contact explicite, projets, événements et annonces consultables ; coordonnées directes officielles non configurées. |
| Authentification | Partiellement terminé | Inscription, connexion, profil, changement/réinitialisation du mot de passe, refresh, logout et comptes désactivés côté API. SMTP et fonctionnement sur PostgreSQL non vérifiés. |
| Rôles/permissions | Partiellement terminé | Huit rôles et capacités seedés ; contrôles backend testés. Affectations métier et rôle des 5 comptes `admin` doivent être confirmés. |
| Adhésions/membres | Terminé pour le parcours MVP | Demandes, décisions, notification, historique, répertoire paginé, rôles, activation/désactivation et export CSV. Envoi d'e-mail non configuré. |
| Projets/équipes | Partiellement terminé | Propositions, visibilité, équipes et contrôles API ; interface de suivi des tâches/jalons/fichiers encore limitée. |
| Tâches/livrables | Partiellement terminé | Modèles, endpoints de tâches, commentaires, jalons et fichiers privés avec validation du format/signature ; interface complète d'équipe et de revue des livrables à poursuivre. |
| Événements/inscriptions | Partiellement terminé | Événements, capacité transactionnelle, inscriptions/annulations, participants et présence manuelle API ; interface d'inscription et de présence ajoutée, export des participants absent. |
| Annonces | Terminé pour le parcours MVP | Persistance, audience, brouillons, publication/dépublication, visibilité et notification ciblée. |
| Notifications | Partiellement terminé | Stockage, périmètre utilisateur, lecture et notifications d'adhésion, publication, affectation de projet/tâche et inscription ; rappels planifiés absents. |
| Tableaux de bord | Partiellement terminé | Agrégats issus de la base et filtrés selon les capacités ; validation PostgreSQL et vues détaillées par chaque responsabilité restent à faire. |
| Exports | Partiellement terminé | Export CSV des membres avec neutralisation des cellules de formule ; exports événements, présences, rapports projet absents. |
| IA | Non commencée | Volontairement hors MVP ; aucune fonction fictive n'est présentée. |
| PostgreSQL/déploiement | En attente d'accès | Le serveur écoute, mais il manque les paramètres de connexion locaux pour exécuter les migrations et valider la cible. |

## E. Tests et validation

Commandes exécutées sur la dernière version vérifiée :

- Backend : `python manage.py test --settings=clubsite.test_settings` — **10 réussis, 0 échec**.
- Backend : `python manage.py check --settings=clubsite.test_settings` — aucune anomalie Django signalée.
- Backend : `python manage.py makemigrations --check --dry-run --settings=clubsite.test_settings` — aucune migration nouvelle détectée.
- Frontend : `npm test` — **6 réussis, 0 échec**, dans 4 fichiers Vitest/RTL.
- Frontend : `npm run build` — build Vite réussi.
- Dépendances : `npm audit` — 0 vulnérabilité après mise à jour compatible des paquets.

Les tests backend utilisent SQLite en mémoire et ne démontrent pas la concurrence PostgreSQL du verrouillage de capacité. Les migrations, l'import des 14 comptes et la validation sur PostgreSQL restent à exécuter dès que les identifiants locaux seront configurés.

## F. Sécurité

- Mot de passe et réponses API ne contiennent pas de hash ; les journaux frontend ne consignent plus de requêtes, tokens ou mots de passe.
- Les refresh JWT tournent et sont révoqués au logout/changement de mot de passe. Le frontend conserve les jetons pour la session de l'onglet et tente un refresh après expiration.
- Les rôles/capacités sont contrôlés par le backend ; les fichiers sont servis par un endpoint protégé.
- CORS, variables d'environnement, redirection HTTPS, cookies sécurisés, HSTS et en-têtes de production sont configurés.
- Les exports CSV neutralisent les cellules susceptibles d'être interprétées comme des formules.
- `npm audit` ne signale plus de vulnérabilité.
- `backend/.env` n'est plus dans l'index et reste présent localement sous une règle d'ignore. Son historique Git n'a pas été réécrit. Si des valeurs de ce fichier ont déjà été utilisées ou partagées, elles doivent être remplacées ; l'effacement de l'historique nécessite une opération coordonnée distincte.
- Les variables de production, la configuration SMTP et la restauration PostgreSQL n'ont pas été testées en environnement de production.

## G. Installation

Les commandes complètes, variables requises, sauvegarde/restauration et lancement figurent dans [README.md](../README.md). En résumé, il faut une instance PostgreSQL, `pip install -r backend/requirements.txt`, les migrations Django, puis `npm ci` et `npm run dev` dans `frontend/`.

## H. Décisions humaines restantes

1. Confirmer que les cinq comptes historiques `admin` deviennent bien `club_admin` et que les neuf autres deviennent `member`.
2. Fixer les critères d'acceptation/refus d'une adhésion, les justificatifs éventuels et la durée de conservation des demandes.
3. Définir qui peut valider/publier les projets et événements, et si les responsables d'événement peuvent déléguer.
4. Fournir le serveur PostgreSQL de validation et approuver le rapprochement après la migration à blanc.
5. Configurer le domaine public, les origines CORS, le relais SMTP, les coordonnées de contact et les liens sociaux officiels.
6. Définir les règles de rétention des présences, audits et fichiers, ainsi que la fréquence des sauvegardes.

## Addendum — vérification du 19 novembre 2026

Cet addendum prévaut sur les états fonctionnels et résultats des tests inscrits plus haut. Les corrections, les limites actuelles, les statuts par fonction et les résultats détaillés sont dans [l'audit technique du 19 novembre](AUDIT_TECHNIQUE_2026-11-19.md). Les vérifications les plus récentes ont réussi : Django `check`, absence de changements de migrations, 18 tests backend, 11 tests frontend, le build de production Vite et `npm audit` (0 vulnérabilité). Le service PostgreSQL local ne répond pas à `127.0.0.1:5432`; aucune migration réelle ou écriture de données n'a été exécutée.
