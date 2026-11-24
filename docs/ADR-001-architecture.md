# ADR-001 — Architecture de MyClub

- **Statut :** acceptée
- **Date :** 4 novembre 2026

## Contexte

MyClub doit proposer un portail public et un espace de gestion sécurisé pour les membres, adhésions, rôles, projets, tâches, événements, présences, annonces et notifications. Les données doivent rester cohérentes et relationnelles, et les changements de schéma doivent pouvoir être déployés et revus.

## Décision

- Utiliser **React 19, Vite et Tailwind CSS 4** pour une interface responsive et statique.
- Utiliser **Django 6 et Django REST Framework** pour l'API REST, versionnée sous `/api/v1/`.
- Utiliser **PostgreSQL exclusivement** pour les données de développement et de production, via le Django ORM et des migrations versionnées. SQLite en mémoire est réservé aux tests unitaires rapides.
- Utiliser **Simple JWT** avec une durée d'accès courte, rotation des refresh tokens et liste noire des jetons révoqués.
- Modéliser les comptes et les domaines métier dans des tables relationnelles ; contrôler rôles, capacités et accès aux ressources côté serveur.
- Utiliser Vitest et React Testing Library côté interface, et la suite Django côté API.

## Options examinées

- **Base documentaire :** non retenue, car les relations entre membres, rôles, projets, tâches et présences exigent des contraintes et transactions relationnelles.
- **SQLite en développement ou production :** non retenue pour l'application ; elle ne permet pas de valider les contraintes et verrous PostgreSQL réellement visés.
- **Génération d'API dans le frontend :** non retenue, afin de garder validation, authentification et permissions sous contrôle du serveur.

## Conséquences

- PostgreSQL doit être disponible pour appliquer les migrations et démarrer l'application hors du mode de test isolé.
- Les changements de modèles passent par des migrations Django versionnées.
- Les tests rapides restent exécutables sans serveur de base de données ; une validation d'intégration PostgreSQL distincte est requise avant livraison.
- Les secrets et fichiers de données locaux restent dans des variables d'environnement ignorées par Git.
