# Audit technique MyClub — 19 novembre 2026

## Périmètre et méthode

Audit du dépôt tel qu'il se trouve dans l'espace de travail le 19 novembre 2026 : inventaire des sources, configuration, migrations, parcours API/UI, sauvegardes présentes par nom et taille, puis exécution des contrôles disponibles. Les fichiers de configuration locaux et les archives contenant des données personnelles n'ont pas été ouverts ni copiés. Aucun changement de schéma, aucune migration de données et aucune écriture dans une base n'ont été faits pendant cet audit.

Le dépôt comportait déjà des changements suivis et non suivis, dont des suppressions mises en scène de `backend/.env` et `backend/db.sqlite3`. Les fichiers locaux correspondants existent toujours. Cet audit n'a ni restauré ni annulé ces changements.

## État observé

- **Frontend** : React 19, Vite 7, Tailwind CSS 4, React Router 7, Axios, Vitest et React Testing Library. Les appels sont centralisés dans `frontend/src/services/api.js`; les jetons sont stockés dans `sessionStorage`.
- **Backend** : Django 6, Django REST Framework, Simple JWT, django-filter, CORS et Swagger/OpenAPI sous `/api/v1/`.
- **Données** : modèles Django relationnels dans `members`, `projects`, `events` et `announcements`. Les paramètres d'exécution normaux imposent PostgreSQL. SQLite est limité à la configuration de tests.
- **Domaines présents** : comptes, rôles/capacités, profils, demandes d'adhésion, audit, projets, équipes, tâches, commentaires, jalons, fichiers privés, événements, inscriptions, présences, annonces, notifications et indicateurs.
- **Migrations** : migrations présentes pour les quatre applications ; `makemigrations --check` ne trouve aucun changement de modèle non migré.
- **Sources et sauvegardes** : plusieurs archives JSON compressées et dossiers BSON sont présents sous `backend/backups/`, ainsi qu'une base SQLite locale. Leur intégrité ou leur contenu n'a pas été revalidé dans cette passe. Le rapport du 4 novembre 2026 décrit historiquement 14 membres MongoDB et une sauvegarde vérifiée ; cette donnée n'est pas une vérification actuelle.
- **PostgreSQL** : le contrôle local `pg_isready -h 127.0.0.1 -p 5432` retourne « no response ». La connexion Django, les migrations et les tests PostgreSQL ne sont donc pas disponibles à cette date. Aucun état de données PostgreSQL ne peut être affirmé.

## Éléments déjà opérationnels dans le code

| Domaine | État constaté |
|---|---|
| Authentification | Inscription, connexion, JWT rotatif, révocation des refresh tokens, profil, changement/réinitialisation du mot de passe. L'envoi de réinitialisation dépend de SMTP correctement configuré. |
| RBAC | Les huit codes `visitor`, `member`, `club_admin`, `project_lead`, `president`, `event_manager`, `pedagogical_supervisor`, `communications_manager` et leurs capacités sont semés par migration; les permissions sont vérifiées côté API. Les définitions restent à confirmer contre le cahier des charges initial absent du dépôt. |
| Adhésions | Création, consultation de l'historique, acceptation, refus, demande d'informations, notification et audit. Les états « suspendue » et « archivée » ne sont pas modélisés comme états de membre/d'adhésion. |
| Projets et tâches | Propositions, visibilité, équipes, tâches, affectations, commentaires, jalons et dépôt/téléchargement protégé de fichiers. La liste de tâches est une liste avec sélecteur d'état, pas un tableau Kanban. Aucun historique complet des changements de tâche n'est modélisé. |
| Événements et présence | Création, publication par état, inscriptions avec capacité transactionnelle, annulation, liste et export CSV des participants, présence unique par personne/événement. Les règles de délégation de responsabilité restent à confirmer. |
| Annonces et notifications | Annonces persistées et ciblées, lecture/non-lu et compteur sur le dashboard. Les rappels d'événements planifiés ne sont pas présents. |
| Dashboards | Résumés calculés depuis l'ORM; certaines sections sont conditionnées aux capacités. Il ne s'agit pas encore de huit dashboards distincts et tous les indicateurs du cahier des charges ne sont pas fournis. |
| Interface | Pages authentifiées et publiques, états d'erreur/chargement, navigation responsive et feuilles de style Tailwind. Pas de mode sombre, de bibliothèque Lucide/Recharts, ni de système complet de composants documenté. |

## Problèmes relevés et corrections prioritaires

1. **Visibilité des projets** — pour un utilisateur connecté non administrateur, la liste incluait tout projet marqué public, y compris les propositions non approuvées. Le contrôle objet des détails refusait ces mêmes projets, créant une fuite dans l'API de liste.
2. **Attribution d'un événement** — un responsable d'événements pouvait créer ou réattribuer un événement à n'importe quel compte; celui-ci pouvait ne pas avoir la permission de le gérer, et l'événement devenait orphelin.
3. **Compte superutilisateur** — Django accordait toutes les capacités côté API, mais la réponse d'authentification ne transmettait pas `is_superuser`; l'interface traitait donc mal le compte créé par `createsuperuser`.
4. **Formulaire d'inscription** — le contrôle serveur exige au moins 10 caractères alors que le champ HTML et son aide annonçaient 4.
5. **Matrice RBAC** — seuls quelques rôles sont exercés par les tests actuels; aucun test ne couvre les huit rôles ni les refus d'accès associés.
6. **Validation PostgreSQL et migration** — le serveur local ne répond pas. La migration MongoDB ne doit pas être appliquée avant de vérifier la sauvegarde, de démarrer une cible PostgreSQL dédiée et de comparer son contenu préexistant.
7. **Décisions fonctionnelles** — les statuts suspendu/archivé, les huit rôles issus du cahier initial, la délégation événementielle, la politique de conservation et le mappage des rôles Mongo historiques ne sont pas justifiés par une source métier présente dans le dépôt.

## Plan priorisé

1. Corriger les deux contrôles d'accès et l'attribution d'événement, puis exposer correctement l'état superutilisateur à l'interface.
2. Aligner la validation d'inscription sur la politique serveur et ajouter des tests de refus/autorisation pour chaque rôle seedé.
3. Publier la matrice provisoire de capacités et le modèle ERD/API; garder visibles les décisions métier à confirmer.
4. Reprendre le Kanban, les états suspendu/archivé, l'historique des tâches et les rappels planifiés après validation des règles métier.
5. Rendre PostgreSQL disponible, sauvegarder et inspecter la cible en lecture seule, produire un rapport de migration à blanc, puis faire approuver le rapprochement avant toute écriture.
6. Compléter les contrôles de production, la configuration SMTP, la vérification des fichiers et les tests sur PostgreSQL avant de revendiquer une livraison SaaS prête à déployer.

## Vérifications exécutées le 19 novembre 2026

| Vérification | Résultat |
|---|---|
| `python manage.py check --settings=clubsite.test_settings` | Réussi, aucune anomalie signalée. |
| `python manage.py makemigrations --check --dry-run --settings=clubsite.test_settings` | Réussi, aucune migration manquante détectée. |
| `python manage.py test --settings=clubsite.test_settings` | Réussi, 10 tests. Base SQLite en mémoire. |
| `npm test -- --reporter=dot` | Réussi, 6 tests dans 4 fichiers. |
| `npm run build` | Réussi avec Vite 7.3.7. |
| `pg_isready -h 127.0.0.1 -p 5432` | Échec de disponibilité : aucune réponse. |

Les réussites ci-dessus valident le code et les parcours couverts par les tests; elles ne valident ni PostgreSQL, ni l'import des données MongoDB, ni la configuration de production.

## Corrections et vérifications finales

| Point relevé | État après correction |
|---|---|
| La liste de projets exposait des propositions publiques non approuvées. | Corrigé : les listes et les détails appliquent désormais le même ensemble de statuts publics. Test API ajouté. |
| Un responsable d'événements pouvait transférer ou abandonner sa responsabilité. | Corrigé : seuls les administrateurs du club peuvent déléguer à un compte habilité; les tests couvrent refus et délégation autorisée. |
| L'interface ne reconnaissait pas les comptes `createsuperuser`. | Corrigé : `is_superuser` est transmis par la connexion et `/auth/me/`. Test API ajouté. |
| Le mot de passe annonçait quatre caractères alors que le serveur en demande dix. | Corrigé dans le contrôle HTML et l'aide de saisie; test frontend ajouté. |
| Les actions par rôle n'étaient pas couvertes et une personne visiteuse pouvait être ajoutée directement à une équipe. | Corrigé : l'API exige un compte actif ayant un rôle membre du club; la suite vérifie les huit rôles sur les endpoints sensibles. |
| Les écrans de détail projet n'étaient pas routés et plusieurs appels envoyaient des chemins ou corps incorrects. | Corrigé : détail accessible depuis les cartes; équipe, jalons, commentaires et fichiers utilisent leurs endpoints dédiés. Les téléchargements passent par l'API authentifiée. |
| Les fichiers de tâche/jalon pouvaient être liés à un autre projet; les jalons n'avaient pas d'action de fin. | Corrigé par validation des relations et actions terminer/rouvrir. Tests API ajoutés. |
| La migration exigeait un fichier de sauvegarde mais relisait MongoDB et pouvait écraser des lignes PostgreSQL. | Corrigé : le snapshot JSON compressé est la source; les conflits arrêtent la transaction, les reruns identiques ne modifient pas les lignes et les rôles historiques admin exigent une option de confirmation. Tests de commande ajoutés. Aucune migration n'a été appliquée à la vraie base. |
| Compteurs d'inscription par événement et jalons à venir. | Corrigé : le décompte d'événements utilise l'annotation existante et le dashboard compte les jalons, pas les projets qui en ont un. |

### Résultats finaux

- `python manage.py check --settings=clubsite.test_settings` : réussi, aucune anomalie.
- `python manage.py makemigrations --check --dry-run --settings=clubsite.test_settings` : réussi, aucune migration manquante.
- `python manage.py test --settings=clubsite.test_settings` : **18 réussis**.
- `npm test -- --reporter=dot` : **11 réussis dans 6 fichiers**.
- Test ciblé après retrait d'un import dynamique : **3 réussis dans `ProjectDetail.test.jsx`**.
- `npm run build` : réussi, Vite a transformé 120 modules sans avertissement.
- `npm audit` : réussi, **0 vulnérabilité** dans les dépendances frontend verrouillées.
- `pg_isready -h 127.0.0.1 -p 5432` : aucune réponse. Les migrations PostgreSQL et les tests d'intégration PostgreSQL restent à faire.

### État fonctionnel actualisé

| Fonction | État | Suite nécessaire |
|---|---|---|
| Inscription, connexion, JWT, profil, changement/réinitialisation de mot de passe | Partiel | Configurer et valider un service SMTP; vérifier les parcours dans un environnement déployé. |
| Huit rôles/capacités backend | Partiel | Tests des routes ajoutés pour les huit rôles; responsables du club doivent confirmer que les huit définitions actuelles correspondent au cahier initial. |
| Demandes et répertoire membres | Partiel | États suspendu/archivé et règles de conservation à définir avant évolution du modèle. |
| Projets, équipe et détail projet | Partiel | Contrôles et liens API réparés; historique exhaustif des changements et règles de délégation de co-chef non définis. |
| Tâches et Kanban | Partiel | Tableau par statut et mise à jour persistée disponibles; historique des transitions, glisser-déposer et vues de revue dédiées absents. |
| Jalons, commentaires et livrables | Partiel | Création, complétion, commentaires et fichiers reliés à l'API; examiner la conservation des fichiers en production. |
| Événements, inscriptions, présences et export | Partiel | Parcours API couverts; test de concurrence réel PostgreSQL et notifications de rappel planifiées absents. |
| Annonces et notifications | Partiel | Publication et marquage lu/non lu disponibles; envois externes et rappels planifiés absents. |
| Dashboards/statistiques | Partiel | Données ORM et agrégats corrigés; pas encore huit compositions de dashboard distinctes ni l'ensemble des statistiques souhaitées. |
| Design system | Partiel | Styles responsive présents; mode sombre, bibliothèque Lucide/Recharts, vérification visuelle multi-appareils et composants complets absents. |
| PostgreSQL/migration | Bloqué par environnement | Le service local ne répond pas; pas de migration réelle, d'import des données ou de comptage PostgreSQL vérifié. |
| Déploiement production | Partiel | Variables et durcissement documentés; aucun environnement, relais SMTP, HTTPS, sauvegarde restaurée ou monitoring de production validé. |

Les archives MongoDB et la base SQLite locales sont présentes, mais leur contenu et leur intégrité n'ont pas été relus dans cette passe. Les contrôles n'ont pas touché ces fichiers ni écrit dans une base persistante.
