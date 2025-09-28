# 🛠️ Guide du développeur - Portfolio Cédric Martz

## 📁 Architecture du projet

Le portfolio suit une architecture modulaire et professionnelle :

```
📦 Racine/
├── 🌐 Pages principales
│   ├── index.html          # Page d'accueil
│   ├── projets.html        # Portfolio des projets  
│   └── contact.html        # Formulaire de contact
│
├── 🎨 Styles et assets
│   ├── css/
│   │   └── style.css       # Styles principaux (Orbitron font, cyberpunk theme)
│   └── assets/
│       ├── images/         # Logos, favicons, captures d'écran
│       └── documents/      # CV PDF et présentations
│
├── 🎮 Jeux interactifs
│   ├── splix/              # Jeu Splix multijoueur WebSocket
│   │   ├── index.html      # Interface de jeu
│   │   ├── splix.js        # Client WebSocket (SplixClient class)
│   │   └── splix.css       # Styles spécifiques au jeu
│   └── tron/               # Jeu Tron Legacy arcade
│       ├── index.html      # Interface Tron
│       ├── tron.js         # Logique de jeu Tron
│       └── tron.css        # Styles cyberpunk Tron
│
└── 🐍 Backend
    ├── splix_server.py     # Serveur WebSocket Python (SplixGame class)
    └── start_servers.py    # Lanceur automatique de tous les serveurs
```

## 🔧 Technologies et patterns utilisés

### Frontend
- **HTML5 Canvas** : Rendu graphique des jeux
- **CSS3 Grid/Flexbox** : Layout responsive professionnel
- **JavaScript ES6+** : Classes, async/await, WebSocket API
- **Design Patterns** : Observer pattern pour WebSocket, Module pattern

### Backend  
- **Python asyncio** : Programmation asynchrone
- **WebSockets** : Communication temps réel bidirectionnelle
- **OOP** : Classes Player, SplixGame encapsulées

### Styles
- **CSS Custom Properties** : Variables pour thème cyberpunk cohérent
- **Animations CSS** : Keyframes, transforms, transitions
- **Mobile-First** : Media queries responsives

## 🎮 Architecture du jeu Splix

### Client JavaScript (`splix.js`)
```javascript
class SplixClient {
    constructor() {
        // Initialisation WebSocket, canvas, événements
    }
    
    connectToServer() {
        // Connexion ws://localhost:8080 avec reconnexion auto
    }
    
    handleServerMessage(data) {
        // Traitement des messages serveur (playerAssigned, gameUpdate, etc.)
    }
    
    render() {
        // Rendu Canvas avec grille, territoires, trails, joueurs
    }
}
```

### Serveur Python (`splix_server.py`)
```python
class SplixGame:
    def __init__(self):
        # Map 40x30, 4 joueurs max, gestion états
    
    async def handle_client(websocket, path):
        # Connexion client, messages, déconnexion
    
    def move_player(player_id, direction):
        # Logique mouvement, collisions, capture territoire
```

## 📡 Protocole WebSocket

### Messages Client → Serveur
```json
{
    "type": "move",
    "direction": "up|down|left|right"
}
```

### Messages Serveur → Client
```json
// Attribution joueur
{
    "type": "playerAssigned",
    "playerId": 0,
    "gameState": {...}
}

// Mise à jour temps réel
{
    "type": "gameUpdate", 
    "gameState": {
        "players": [...],
        "map": [[...]]
    }
}

// Fin de partie
{
    "type": "gameOver",
    "winner": 2
}
```

## 🎨 Système de thème

### Variables CSS globales
```css
:root {
    --primary-color: #8A2BE2;      /* Violet cyberpunk */
    --secondary-color: #4B0082;    /* Indigo foncé */
    --accent-color: #FF6B6B;       /* Rouge accent */
    --background: #0a0015;         /* Noir profond */
    --grid-size: 15px;             /* Taille cellule jeu */
}
```

### Animations signature
- **cyberpunk-glow** : Effet néon sur les titres
- **backgroundPulse** : Animation fond subtile
- **canvasGlow** : Halo autour du canvas de jeu

## 🚀 Déploiement

### Local Development
```bash
# Installation
chmod +x install.sh
./install.sh

# Démarrage
cd server/
python3 start_servers.py
```

### GitHub Pages (Production)
- Push sur `main` → déploiement automatique
- Fichiers statiques servis via GitHub Pages
- WebSocket server nécessite hébergement séparé

## 🔍 Debugging

### Logs serveur Python
```python
logging.basicConfig(level=logging.INFO)
logger.info(f"🎮 Joueur {player_id} éliminé: {reason}")
```

### Console JavaScript client
```javascript
console.log('🔗 Connexion WebSocket établie');
console.error('❌ Erreur parsing message serveur:', error);
```

## 🧪 Tests

### Test connectivité WebSocket
```bash
# Terminal 1: Serveur
python3 splix_server.py

# Terminal 2: Client test
python3 -c "
import asyncio
import websockets

async def test():
    async with websockets.connect('ws://localhost:8080') as ws:
        await ws.send('{\"type\":\"move\",\"direction\":\"up\"}')
        response = await ws.recv()
        print(f'Response: {response}')

asyncio.run(test())
"
```

## 📈 Performance

### Optimisations appliquées
- **Canvas**: Dirty rectangles pour render partiel
- **WebSocket**: Throttling messages (150ms gameloop)  
- **CSS**: Hardware acceleration avec `transform3d`
- **Images**: Compression et formats optimisés

### Métriques cibles
- Latence WebSocket < 50ms
- FPS stable 60fps sur Canvas
- First Paint < 1s
- Responsive jusqu'à 320px largeur

## 🔐 Sécurité

### Validation côté serveur
```python
def move_player(self, player_id: int, direction: str) -> bool:
    # Validation direction autorisée
    if direction not in ['up', 'down', 'left', 'right']:
        return False
    
    # Anti-cheat: pas de demi-tour
    opposites = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
    if player.direction == opposites.get(direction):
        return False
```

### Sanitization
- Messages JSON validés
- Pas d'injection HTML/CSS possible
- WebSocket origine vérifiée

---

💡 **Conseil** : Pour contribuer au projet, respectez cette architecture et les patterns établis pour maintenir la cohérence du code.