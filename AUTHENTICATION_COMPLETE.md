# Authentification et autorisations MyClub

Les comptes MyClub utilisent le modèle utilisateur Django, un e-mail normalisé comme identifiant, le hachage de mots de passe Django et des rôles relationnels reliés à des capacités.

## API

- `POST /api/v1/auth/signup/` crée un compte et une demande d'adhésion.
- `POST /api/v1/auth/login/` délivre les jetons JWT access et refresh.
- `POST /api/v1/auth/refresh/` renouvelle l'access token et fait tourner le refresh token.
- `POST /api/v1/auth/logout/` inscrit le refresh token sur la liste noire.
- `GET /api/v1/auth/me/` retourne le compte authentifié et ses capacités.
- Les routes de changement et de réinitialisation du mot de passe sont versionnées sous `/api/v1/auth/password/`.

Les permissions sont vérifiées par l'API à chaque requête. Les vues React contrôlent l'affichage et la navigation, mais ne remplacent pas les autorisations serveur.

## Session navigateur

Le frontend conserve les jetons dans `sessionStorage`, les renouvelle après une réponse `401` et les supprime après révocation ou expiration. Les jetons et mots de passe ne sont pas écrits dans les journaux. Le script `frontend/test_login.js` lit les identifiants depuis l'environnement et n'affiche jamais les jetons.

La réinitialisation par e-mail exige un relais SMTP configuré dans `backend/.env`. Les détails d'installation et de validation figurent dans [README.md](README.md) et [TESTING_GUIDE.md](TESTING_GUIDE.md).
