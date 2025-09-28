#!/usr/bin/env python3
"""
Serveur WebSocket Splix - Version Python
Serveur multijoueur en temps réel pour le jeu Splix.io-like
"""

import asyncio
import websockets
import json
import logging
from typing import Dict, List, Set, Optional, Tuple

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Player:
    """Représente un joueur dans le jeu Splix"""
    
    def __init__(self, player_id: int, x: int, y: int, color: str):
        self.id = player_id
        self.x = x
        self.y = y
        self.color = color
        self.direction = 'right'
        self.alive = True
        self.score = 1
        self.trail: Set[Tuple[int, int]] = set()
        self.territory: Set[Tuple[int, int]] = set()

    def to_dict(self) -> dict:
        """Convertit le joueur en dictionnaire pour JSON"""
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'color': self.color,
            'alive': self.alive,
            'score': self.score,
            'direction': self.direction
        }

class SplixGame:
    """Logique principale du jeu Splix"""
    
    MAP_WIDTH = 40
    MAP_HEIGHT = 30
    MAX_PLAYERS = 4
    
    # Couleurs des joueurs (palette moderne)
    PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    
    # Positions de spawn aux coins de la carte
    SPAWN_POSITIONS = [(2, 2), (37, 2), (2, 27), (37, 27)]
    
    def __init__(self):
        self.players: Dict[int, Player] = {}
        self.connections: Dict[websockets.WebSocketServerProtocol, int] = {}
        self.map: List[List[int]] = [[-1 for _ in range(self.MAP_WIDTH)] for _ in range(self.MAP_HEIGHT)]
        self.game_running = False
        self.game_id = 0

    def add_player(self, websocket: websockets.WebSocketServerProtocol) -> Optional[int]:
        """Ajoute un nouveau joueur à la partie"""
        if len(self.players) >= self.MAX_PLAYERS:
            return None
            
        player_id = len(self.players)
        spawn_x, spawn_y = self.SPAWN_POSITIONS[player_id]
        
        player = Player(player_id, spawn_x, spawn_y, self.PLAYER_COLORS[player_id])
        
        # Créer le territoire initial (3x3)
        for dy in range(-1, 2):
            for dx in range(-1, 2):
                nx, ny = spawn_x + dx, spawn_y + dy
                if 0 <= nx < self.MAP_WIDTH and 0 <= ny < self.MAP_HEIGHT:
                    self.map[ny][nx] = player_id + 10  # +10 pour territoire
                    player.territory.add((nx, ny))
        
        self.players[player_id] = player
        self.connections[websocket] = player_id
        
        # Démarre le jeu si au moins 2 joueurs
        if len(self.players) >= 2 and not self.game_running:
            self.game_running = True
            logger.info(f"🎮 Jeu démarré avec {len(self.players)} joueurs")
            
        logger.info(f"➕ Joueur {player_id} ajouté ({len(self.players)}/{self.MAX_PLAYERS})")
        return player_id

    def remove_player(self, websocket: websockets.WebSocketServerProtocol) -> Optional[int]:
        """Supprime un joueur de la partie"""
        if websocket not in self.connections:
            return None
            
        player_id = self.connections[websocket]
        
        if player_id in self.players:
            self.clear_player_from_map(player_id)
            del self.players[player_id]
            logger.info(f"➖ Joueur {player_id} supprimé")
            
        del self.connections[websocket]
        
        # Arrête le jeu s'il n'y a plus assez de joueurs
        if len(self.players) < 2:
            self.game_running = False
            logger.info("⏸️ Jeu mis en pause - pas assez de joueurs")
            
        return player_id

    def clear_player_from_map(self, player_id: int):
        """Nettoie la carte des traces d'un joueur"""
        for y in range(self.MAP_HEIGHT):
            for x in range(self.MAP_WIDTH):
                if self.map[y][x] == player_id or self.map[y][x] == player_id + 10:
                    self.map[y][x] = -1

    def move_player(self, player_id: int, direction: str) -> bool:
        """Déplace un joueur dans la direction spécifiée"""
        if not self.game_running or player_id not in self.players:
            return False
            
        player = self.players[player_id]
        if not player.alive:
            return False
            
        # Empêche les demi-tours
        opposite_dirs = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
        if player.direction == opposite_dirs.get(direction):
            return False
            
        player.direction = direction
        
        # Calcule la nouvelle position
        new_x, new_y = player.x, player.y
        direction_offsets = {
            'up': (0, -1), 'down': (0, 1),
            'left': (-1, 0), 'right': (1, 0)
        }
        
        dx, dy = direction_offsets.get(direction, (0, 0))
        new_x, new_y = player.x + dx, player.y + dy
        
        # Vérification des limites
        if not (0 <= new_x < self.MAP_WIDTH and 0 <= new_y < self.MAP_HEIGHT):
            self.kill_player(player_id, "Sortie de carte")
            return True
            
        current_cell = self.map[new_y][new_x]
        
        # Collision avec trail adverse
        if 0 <= current_cell < self.MAX_PLAYERS and current_cell != player_id:
            self.kill_player(current_cell, "Trail coupé")
            
        # Collision avec son propre trail
        elif current_cell == player_id:
            self.kill_player(player_id, "Auto-collision")
            return True
            
        # Collision avec territoire adverse
        elif current_cell >= 10 and current_cell - 10 != player_id:
            self.kill_player(player_id, "Territoire adverse")
            return True
            
        # Retour sur son territoire - capture
        elif current_cell == player_id + 10:
            if player.trail:
                self.capture_territory(player_id)
                player.trail.clear()
                player.score += len(player.trail) * 2
        
        # Mouvement sur case vide
        else:
            player.trail.add((new_x, new_y))
            self.map[new_y][new_x] = player_id
        
        player.x, player.y = new_x, new_y
        player.score += 1
        return True

    def capture_territory(self, player_id: int):
        """Capture le territoire entouré par le trail du joueur"""
        player = self.players[player_id]
        
        # Convertit le trail en territoire
        for x, y in player.trail:
            if 0 <= x < self.MAP_WIDTH and 0 <= y < self.MAP_HEIGHT:
                self.map[y][x] = player_id + 10
                player.territory.add((x, y))
        
        # Bonus de score pour la capture
        player.score += len(player.trail) * 5
        logger.info(f"🏆 Joueur {player_id} capture {len(player.trail)} cases")

    def kill_player(self, player_id: int, reason: str = ""):
        """Élimine un joueur du jeu"""
        if player_id not in self.players:
            return
            
        player = self.players[player_id]
        player.alive = False
        
        self.clear_player_from_map(player_id)
        player.trail.clear()
        player.territory.clear()
        
        logger.info(f"💀 Joueur {player_id} éliminé: {reason}")

    def get_game_state(self) -> dict:
        """Retourne l'état actuel du jeu"""
        return {
            'players': [player.to_dict() for player in self.players.values()],
            'map': self.map,
            'gameRunning': self.game_running,
            'gameId': self.game_id
        }

    def check_game_over(self) -> Tuple[bool, int]:
        """Vérifie si la partie est terminée"""
        alive_players = [p for p in self.players.values() if p.alive]
        
        if len(alive_players) <= 1 and len(self.players) > 1:
            winner = alive_players[0].id if alive_players else -1
            logger.info(f"🏁 Partie terminée - Gagnant: Joueur {winner}")
            return True, winner
            
        return False, -1

    def restart_game(self):
        """Redémarre une nouvelle partie"""
        self.game_id += 1
        self.map = [[-1 for _ in range(self.MAP_WIDTH)] for _ in range(self.MAP_HEIGHT)]
        
        # Réinitialise tous les joueurs
        for player_id, player in self.players.items():
            spawn_x, spawn_y = self.SPAWN_POSITIONS[player_id]
            player.x, player.y = spawn_x, spawn_y
            player.alive = True
            player.score = 1
            player.trail.clear()
            player.territory.clear()
            player.direction = 'right'
            
            # Recrée le territoire initial
            for dy in range(-1, 2):
                for dx in range(-1, 2):
                    nx, ny = spawn_x + dx, spawn_y + dy
                    if 0 <= nx < self.MAP_WIDTH and 0 <= ny < self.MAP_HEIGHT:
                        self.map[ny][nx] = player_id + 10
                        player.territory.add((nx, ny))
        
        logger.info(f"🔄 Nouvelle partie {self.game_id} démarrée")

# Instance globale du jeu
game = SplixGame()

async def handle_client(websocket: websockets.WebSocketServerProtocol, path: str):
    """Gère une connexion client WebSocket"""
    client_addr = websocket.remote_address
    logger.info(f"🔗 Nouvelle connexion: {client_addr}")
    
    # Ajoute le joueur
    player_id = game.add_player(websocket)
    
    if player_id is None:
        await websocket.send(json.dumps({
            'type': 'error',
            'message': 'Partie complète (4 joueurs maximum)'
        }))
        await websocket.close()
        return
    
    try:
        # Envoie l'assignation du joueur
        await websocket.send(json.dumps({
            'type': 'playerAssigned',
            'playerId': player_id,
            'gameState': game.get_game_state()
        }))
        
        # Notifie les autres joueurs
        await broadcast_to_others(websocket, {
            'type': 'playerJoined',
            'playerId': player_id
        })
        
        # Boucle de traitement des messages
        async for message in websocket:
            try:
                data = json.loads(message)
                
                if data['type'] == 'move' and 'direction' in data:
                    game.move_player(player_id, data['direction'])
                    
                    # Diffuse l'état du jeu
                    await broadcast_to_all({
                        'type': 'gameUpdate',
                        'gameState': game.get_game_state()
                    })
                    
                    # Vérifie la fin de partie
                    game_over, winner = game.check_game_over()
                    if game_over:
                        await broadcast_to_all({
                            'type': 'gameOver',
                            'winner': winner
                        })
                        
                        # Redémarre après 5 secondes
                        await asyncio.sleep(5)
                        game.restart_game()
                        await broadcast_to_all({
                            'type': 'gameRestart',
                            'gameState': game.get_game_state()
                        })
                        
            except json.JSONDecodeError as e:
                logger.error(f"❌ Message JSON invalide de {client_addr}: {e}")
            except Exception as e:
                logger.error(f"❌ Erreur traitement message: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"🔌 Connexion fermée: {client_addr}")
    except Exception as e:
        logger.error(f"❌ Erreur connexion {client_addr}: {e}")
    finally:
        # Nettoyage du joueur
        removed_id = game.remove_player(websocket)
        if removed_id is not None:
            await broadcast_to_others(websocket, {
                'type': 'playerLeft',
                'playerId': removed_id
            })

async def broadcast_to_all(message: dict):
    """Diffuse un message à tous les clients connectés"""
    if not game.connections:
        return
        
    message_str = json.dumps(message)
    disconnected = []
    
    for websocket in game.connections.keys():
        try:
            await websocket.send(message_str)
        except websockets.exceptions.ConnectionClosed:
            disconnected.append(websocket)
        except Exception as e:
            logger.error(f"❌ Erreur diffusion: {e}")
            disconnected.append(websocket)
    
    # Nettoie les connexions fermées
    for ws in disconnected:
        game.remove_player(ws)

async def broadcast_to_others(sender: websockets.WebSocketServerProtocol, message: dict):
    """Diffuse un message à tous les clients sauf l'expéditeur"""
    others = [ws for ws in game.connections.keys() if ws != sender]
    
    if not others:
        return
        
    message_str = json.dumps(message)
    
    for websocket in others:
        try:
            await websocket.send(message_str)
        except Exception as e:
            logger.error(f"❌ Erreur diffusion aux autres: {e}")

async def main():
    """Point d'entrée principal du serveur"""
    host, port = "localhost", 8080
    
    print("🚀 Serveur Splix WebSocket")
    print(f"📍 Écoute sur {host}:{port}")
    print("🎮 Ouvrez http://localhost:8000/games/splix/ dans votre navigateur")
    print("⏹️  Ctrl+C pour arrêter")
    print("-" * 50)
    
    try:
        async with websockets.serve(handle_client, host, port):
            await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur")
    except Exception as e:
        logger.error(f"❌ Erreur serveur: {e}")

if __name__ == "__main__":
    asyncio.run(main())