# Audit initial avant refonte MyClub

Date de l'audit : 2 novembre 2026.

Ce document décrit l'état observé avant les changements de refonte. L'état et les résultats vérifiés le 3 novembre 2026 sont consignés dans [ETAT_DE_LIVRAISON.md](ETAT_DE_LIVRAISON.md).

## Architecture actuelle constatée

- Frontend React 19 avec Create React App (`react-scripts`), React Router, Axios et Redux. Tailwind est référencé dans la configuration/CSS, mais n'est pas une dépendance directe installée ; Vite est absent.
- Backend Django 6.0, Django REST Framework et Simple JWT. Les membres, projets et événements utilisent encore MongoEngine ; Django utilise SQLite pour l'authentification et les sessions.
- MongoDB local est joignable. La base configurée contient 14 documents dans `members`, zéro dans `projects` et `events`, et des collections de compatibilité vides. La collection `Members` (casse différente) est vide. Les 14 e-mails sont uniques ; leurs champs `password` utilisent tous `pbkdf2_sha256`.
- SQLite contient les tables Django et migrations, mais aucun utilisateur, groupe, journal d'administration ou session.
- PostgreSQL, son service local, ses outils CLI et le pilote Python ne sont pas présents dans l'environnement inspecté.

## État fonctionnel vérifié par lecture du code

- Inscription et connexion existent, mais utilisent des documents MongoEngine et génèrent les JWT manuellement.
- Les routes membres/projets/événements contiennent des réponses de secours fictives. Certaines opérations annoncent un succès même lorsque MongoDB est indisponible.
- Les annonces et certains changements de membres/projets vivent uniquement dans l'état React. Le frontend retombe sur `dummyData` en cas d'erreur réseau.
- Les rôles sont un champ texte limité à `admin`/`member`; plusieurs vérifications reposent sur les revendications du JWT, qui deviennent obsolètes après un changement de droits.
- Le journal contient des exemples d'identifiants de démonstration obsolètes et affirme que les flux n'ont pas été vérifiés. `AUTHENTICATION_COMPLETE.md` surévalue l'état réel.
- Aucun modèle ORM relationnel de domaine ni migration d'application n'est présent.

## Tableau des modules

| Module | État actuel | Problèmes | Modifications nécessaires |
|---|---|---|---|
| Configuration | Django + SQLite + MongoEngine | secret de secours, DEBUG actif par défaut, exception Mongo imprimée, base mixte | variables d'environnement, PostgreSQL seul, aucun secret dans les logs |
| Comptes | MongoEngine + JWT faits main | pas de modèle Django utilisateur, validation faible, désactivation et révocation absentes | utilisateur Django email, JWT standard avec rotation/révocation, profil séparé |
| Rôles | champ `role` | trois valeurs anciennes, droits inclus dans le JWT, pas de cumul | rôles relationnels multiples et contrôles serveur |
| Adhésions | absentes | aucun cycle de demande/décision | statuts, historique, décideur et permissions |
| Projets | document MongoEngine | seulement titre/description/statut/IDs texte ; secours fictifs | relations ORM, membres, jalons et tâches |
| Événements | document MongoEngine | participants en chaînes, pas de capacité ni présence | inscription transactionnelle, capacité et présence unique |
| Annonces/notifications | annonces factices côté React | aucune persistance | API et modèles Django |
| Tableaux de bord | composants existants | compteurs/données simulés | agrégats issus de la base et filtrés par droits |
| Frontend | CRA, composants React existants | pas de Vite, dépendances Tailwind manquantes, erreurs réseau converties en mutations locales | Vite/Tailwind, conserver les pages utiles, supprimer les faux succès |
| Tests | fichiers présents | tests membres couplés à MongoEngine ; build et tests non prouvés | tests API réels et build après refonte |
| Migration | aucune | 14 membres Mongo à conserver ; aucun serveur PostgreSQL disponible | sauvegarde, commande idempotente, correspondance d'anciens IDs, validation sur PostgreSQL |

## Risques de migration

- Les comptes Mongo ont des hashes Django PBKDF2 ; il faut les copier sans les exposer et sans réinitialiser les mots de passe.
- Les identifiants Mongo sont des ObjectId : ils ne doivent pas être transposés dans les PK entiers PostgreSQL. Une colonne `legacy_id` conserve la correspondance.
- Les documents membres ont les champs `first_name`, `last_name`, `email`, `password`, `role`, `date_of_joining`; aucune donnée projet ou événement n'est à migrer selon les comptages observés.
- La base SQLite existante n'a aucune donnée utilisateur à transférer. Elle sera conservée localement et ignorée par Git ; aucune suppression n'est effectuée.
- L'application des migrations, la migration des données et les tests PostgreSQL restent conditionnés à l'installation/démarrage d'un serveur PostgreSQL.

## Plan priorisé

1. Sauvegarder MongoDB et rendre les fichiers locaux contenant des données/secrets non versionnables.
2. Créer le modèle utilisateur dès la première migration, puis les rôles et domaines relationnels.
3. Configurer PostgreSQL, JWT révocable, permissions et API versionnée.
4. Ajouter une commande MongoDB idempotente avec conservation PBKDF2/IDs et rapport de rapprochement.
5. Retirer les réponses factices, connecter les pages existantes aux API et compléter Vite/Tailwind.
6. Ajouter des tests d'API, puis exécuter migrations, tests et build dans un environnement PostgreSQL.
7. Documenter installation, sauvegarde, restauration, limites observées et décisions métier restantes.

## Périmètre restant à valider

Le passage à PostgreSQL ne sera déclaré effectif qu'après exécution sur un serveur PostgreSQL et vérification des 14 comptes, relations et connexions. Les règles de validation d'une adhésion, les rôles initiaux à attribuer aux comptes existants et les workflows de publication devront être confirmés par le responsable du club ; la migration conserve seulement les rôles historiques `admin`/`member`.
