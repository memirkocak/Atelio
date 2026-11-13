# Cahier des charges — Atelio

_Dernière mise à jour : 13/11/2026_

## 1. Présentation

**Atelio** est une application web SaaS de gestion d'activité, entièrement en français.

**Problème** : les indépendants et petites structures dispersent leurs informations (clients, projets, tâches, devis, rendez-vous) entre plusieurs logiciels.

**Solution** : une plateforme unique, simple, moderne et professionnelle, qui centralise la gestion quotidienne de l'activité.

**Public cible** : indépendants, freelances, petites entreprises, TPE, agences web et digitales.

**Contexte du projet** : projet réel destiné au portfolio professionnel de son auteur. Il doit être fonctionnel, sécurisé, connecté à une vraie base de données, accessible en ligne gratuitement et essayable en un clic par un visiteur (mode démo).

## 2. Utilisateurs et accès

- Un visiteur peut **créer un compte** (e-mail + mot de passe, confirmation par e-mail) ou **essayer la démo** sans inscription.
- À l'inscription, un **espace de travail** personnel est créé automatiquement ; l'utilisateur en est propriétaire.
- Toutes les données métier appartiennent à un espace de travail. Un utilisateur n'accède qu'aux espaces dont il est membre.
- Rôles prévus : `owner`, `admin`, `member`. En V1, un seul membre par espace ; la collaboration (invitations) est prévue en V2 sans refonte.

## 3. Modules fonctionnels

### A. Tableau de bord
- Nombre de clients, projets en cours, tâches à terminer, tâches en retard, devis en attente.
- Chiffre d'affaires suivi = **somme des devis acceptés** (montants TTC et HT), et montant du pipeline (devis envoyés non expirés).
- Graphiques d'activité et flux d'activité récente.
- Toutes les valeurs proviennent des données réelles.

### B. Clients (CRM)
- Créer, modifier, supprimer, consulter une fiche client.
- Champs : nom du contact, entreprise, e-mail, téléphone, adresse, notes internes.
- Fiche : historique des projets, devis associés.
- Recherche et filtres.
- Suppression bloquée si des devis sont rattachés (pour préserver l'historique commercial).

### C. Projets
- Créer, modifier, supprimer ; associer à un client (facultatif).
- Budget, date de début, échéance, avancement (%).
- Statuts : **À venir, En cours, En attente, Terminé, Annulé**.
- Vue tableau et vue Kanban (glisser-déposer entre statuts).

### D. Tâches
- Créer, modifier, supprimer ; associer à un projet (facultatif).
- Priorité (basse, moyenne, haute, urgente), échéance, statut (à faire, en cours, terminée).
- Marquer comme terminée en un clic.
- Filtres (statut, priorité, projet, échéance) ; mise en évidence des tâches en retard (échéance dépassée et non terminée).

### E. Devis
- Créer un devis associé à un client, avec plusieurs lignes de prestation (libellé, quantité, prix unitaire HT, taux de TVA).
- Calcul automatique des totaux HT, TVA (par taux) et TTC — **calculés et validés côté serveur**.
- Numéro unique par espace : `DEV-AAAA-NNNN`.
- Statuts : **Brouillon, Envoyé, Accepté, Refusé, Expiré**. « Expiré » est calculé : devis envoyé dont la date de validité est dépassée.
- Un devis n'est modifiable qu'en brouillon. Au passage à « Envoyé », les informations client sont figées (instantané) ; les lignes et montants sont toujours stockés tels quels.
- Génération d'un **PDF professionnel**.

### F. Calendrier
- Vue mensuelle et vue hebdomadaire.
- Affiche : rendez-vous (créés dans le calendrier), échéances des tâches, dates de début / échéances des projets, dates de validité des devis.

### G. Statistiques
- Évolution des devis (créés, acceptés, montants) dans le temps.
- Nombre de projets terminés.
- Répartition des tâches (statut, priorité).
- Évolution de l'activité.
- Indicateurs commerciaux : taux d'acceptation des devis, panier moyen, CA suivi.
- Calculées à partir des données réellement enregistrées.

### H. Paramètres
- Profil utilisateur, informations de l'espace (nom, coordonnées de l'entreprise utilisées sur les devis, mentions, taux de TVA par défaut).

### I. Mode démo
- Bouton « Essayer la démo » sur la page d'accueil, connectant à un compte de démonstration pré-rempli.
- Bandeau permanent « Mode démo » indiquant que les données sont fictives.
- Réinitialisation automatique des données chaque nuit.

## 4. Exigences non fonctionnelles

- **Sécurité** : Row Level Security sur toutes les tables privées ; opérations sensibles côté serveur ; aucun secret exposé au navigateur.
- **Intégrité** : migrations SQL versionnées, contraintes et clés étrangères, montants en centimes.
- **Design** : interface SaaS haut de gamme, minimaliste, fond blanc / gris très clair, couleurs bleu et indigo, sidebar professionnelle, typographie élégante, animations discrètes ; cohérence entre toutes les pages ; pas de look « template ».
- **Responsive** : ordinateur, tablette, mobile.
- **Qualité** : TypeScript strict, ESLint, tests unitaires (Vitest), tests de sécurité RLS, tests end-to-end (Playwright).
- **Disponibilité** : déploiement Vercel ; base Supabase maintenue active (tâche quotidienne) pour éviter la mise en pause du plan gratuit.
- **Coût** : 0 € (Vercel Hobby + Supabase Free).

## 5. Hors périmètre V1

- Facturation (factures, paiements).
- Invitations et collaboration multi-utilisateurs (le modèle de données le permet déjà).
- Connexion Google / OAuth.
- Envoi des devis par e-mail depuis l'application.
- Catalogue de prestations réutilisables.
