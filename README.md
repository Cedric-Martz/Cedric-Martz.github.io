# Portfolio

Hello, this is my portfolio. Style and animations made by Copilot AI. You can see it [here](# 🎮 Portfolio de Cédric Martz

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-success)](https://cedric-martz.github.io/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real%20Time-orange)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![HTML5](https://img.shields.io/badge/HTML5-Canvas-red)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

> Portfolio personnel avec jeux multijoueurs en temps réel utilisant WebSockets Python

## 🌐 Site web

**Accès direct :** [https://cedric-martz.github.io/](https://cedric-martz.github.io/)

## 📁 Structure du projet

```
📦 Cedric-Martz.github.io/
├── 🏠 index.html                 # Page d'accueil
├── 📋 projets.html               # Portfolio des projets
├── 📞 contact.html               # Page de contact
├── 
├── 🎨 css/
│   └── style.css                 # Styles principaux
├── 
├── 🎮 games/
│   ├── 🟩 splix/                # Jeu Splix.io clone
│   │   ├── index.html
│   │   ├── splix.js             # Client WebSocket
│   │   └── splix.css
│   └── 🏁 tron/                 # Jeu Tron Legacy
│       ├── index.html
│       ├── tron.js
│       └── tron.css
├── 
├── 🐍 server/
│   └── splix_server.py          # Serveur WebSocket Python
├── 
├── 📂 assets/
│   ├── 🖼️ images/               # Logos, favicons, captures
│   └── 📄 documents/            # CV et présentations PDF
└── 
└── 📚 README.md                 # Ce fichier
```

## 🎯 Projets principaux

### 🟩 **Splix WebSocket**
- **Type :** Jeu multijoueur en temps réel (clone de Splix.io)
- **Tech :** Python WebSocket + HTML5 Canvas + JavaScript ES6
- **Fonctionnalités :**
  - ⚡ Temps réel avec WebSockets
  - 👥 Jusqu'à 4 joueurs simultanés
  - 🎨 Interface moderne avec animations CSS
  - 🔄 Reconnexion automatique
  - 📱 Design responsive

### 🏁 **Tron Legacy** 
- **Type :** Jeu arcade rétro
- **Tech :** HTML5 Canvas + JavaScript
- **Fonctionnalités :**
  - 🎮 Mode solo et multijoueur local
  - 🎨 Graphismes style néon cyberpunk
  - 📱 Contrôles tactiles pour mobile
  - ⏸️ Système de pause intégré

### 🤖 **VIDOQ AI**
- **Type :** Système d'intelligence artificielle
- **Tech :** Python + Machine Learning
- **Description :** Projet d'IA avancé pour l'analyse et la prise de décision

## 🚀 Installation et utilisation

### Prérequis
```bash
# Python 3.8+ requis
python --version

# Installation des dépendances WebSocket
pip install websockets
```

### 🎮 Lancer Splix (mode multijoueur)

1. **Démarrer le serveur WebSocket :**
   ```bash
   cd server/
   python splix_server.py
   ```

2. **Démarrer le serveur HTTP :**
   ```bash
   # Dans un autre terminal
   python -m http.server 8000
   ```

3. **Jouer :**
   - Ouvrir [localhost:8000/games/splix/](http://localhost:8000/games/splix/)
   - Attendre qu'un autre joueur se connecte
   - Utiliser les flèches ou WASD pour jouer

### 🏁 Lancer Tron (mode local)
- Ouvrir [localhost:8000/games/tron/](http://localhost:8000/games/tron/)
- Choisir le mode solo ou multijoueur local

## 🛠️ Technologies utilisées

### Frontend
- ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) **HTML5** - Structure et Canvas
- ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat-square&logo=css3) **CSS3** - Animations et responsive design
- ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) **JavaScript ES6+** - Logique client et WebSocket

### Backend
- ![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white) **Python 3.8+** - Serveur WebSocket
- ![WebSocket](https://img.shields.io/badge/-WebSocket-010101?style=flat-square) **WebSockets** - Communication temps réel

### Outils et déploiement
- ![GitHub Pages](https://img.shields.io/badge/-GitHub%20Pages-181717?style=flat-square&logo=github) **GitHub Pages** - Hébergement statique
- ![Git](https://img.shields.io/badge/-Git-F05032?style=flat-square&logo=git&logoColor=white) **Git** - Contrôle de version

## 🎨 Fonctionnalités spéciales

- **🎯 Responsive Design :** Optimisé pour desktop, tablette et mobile
- **🌙 Dark Theme :** Interface sombre cyberpunk avec effets néon
- **⚡ Real-time Gaming :** Jeux multijoueurs synchronisés
- **🔄 Auto-reconnect :** Reconnexion automatique en cas de déconnexion
- **🎵 Interactive UI :** Animations et effets visuels immersifs

## 📊 Métriques du projet

- **🎮 2 jeux** interactifs fonctionnels
- **🐍 1 serveur** WebSocket Python complet
- **📱 100% responsive** design
- **⚡ Temps réel** avec latence < 50ms
- **👥 Multijoueur** jusqu'à 4 joueurs simultanés

## 📞 Contact

- **👨‍💻 Développeur :** Cédric Martz
- **🌐 Portfolio :** [cedric-martz.github.io](https://cedric-martz.github.io/)
- **📧 Contact :** Via le formulaire sur le site
- **🔗 LinkedIn :** [Profil LinkedIn](https://www.linkedin.com/in/cédric-martz-29a80b251/)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

<div align="center">
  <strong>🚀 Fait avec passion par Cédric Martz</strong><br>
  <em>Portfolio interactif avec jeux multijoueurs temps réel</em>
</div>).
