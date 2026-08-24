# 📅 Calendrier Semestriel

Un calendrier semestriel interactif, responsive et imprimable inspiré des calendriers muraux traditionnels, intégrant les dates officielles des vacances scolaires françaises et des jours fériés.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Vanilla-JS-yellow.svg)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![Responsive](https://img.shields.io/badge/Design-Responsive-brightgreen.svg)](#)

---

## 🌟 Fonctionnalités

- **Vue semestrielle murale** : Affichage clair par semestre (6 mois par vue) avec navigation temporelle vers le passé ou le futur.
- **Vacances scolaires officielles** : Intégration par code couleur des zones :
    - **Zone A** (Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers)
    - **Zone B** (Aix-Marseille, Amiens, Caen, Lille, Nancy-Metz, Nantes, Nice, Orléans-Tours, Reims, Rennes, Rouen, Strasbourg)
    - **Zone C** (Créteil, Montpellier, Paris, Toulouse, Versailles)
    - **Corse**
    - **Guadeloupe**
    - **Martinique**
    - **Guyane**
    - **La Réunion**
    - **Mayotte**
- **Survol informatif** : Affichage au survol de la liste complète des académies concernées par chaque zone.
- **100% Responsive** : Adaptation automatique sur écrans étroits et smartphones (affichage des mois sur une seule colonne).
- **Prêt pour l'impression** : Optimisé pour une impression propre sur format A4 paysage.
- **Respect de la vie privée** : Aucun traceur publicitaire. Utilisation exclusive du stockage local pour mémoriser les préférences d'affichage.

---

## 📁 Structure du Projet

Le projet a été développé en **HTML / CSS / JavaScript vanilla** sans dépendances externes lourdes pour garantir des performances optimales et une maintenance facile.

```text
.
├── index.html          # Page principale
├── css/
│   └── style.css       # Feuilles de styles et règles responsive
│   └── popup.css       # Feuilles de styles pour la popup d'informations
├── js/
│   └── app.js          # Logique de calcul du calendrier et interactions
│   └── saints.js       # Affichage des saints du calendrier
├── config/
│   └── vacances.json   # Données des vacances et jours fériés
├── img/                # Icônes (favicon), images et prévisualisations
├── LICENSE             # Licence open source (MIT)
└── README.md           # Documentation du projet