#!/usr/bin/env python3
"""
Lanceur principal pour tous les serveurs du portfolio
Ce script permet de démarrer facilement tous les serveurs nécessaires
"""

import subprocess
import sys
import os
import signal
import time
from typing import List

class PortfolioServer:
    def __init__(self):
        self.processes: List[subprocess.Popen] = []
        
    def start_http_server(self, port: int = 8000):
        """Démarre le serveur HTTP pour les fichiers statiques"""
        print(f"🌐 Démarrage du serveur HTTP sur le port {port}...")
        try:
            process = subprocess.Popen([
                sys.executable, "-m", "http.server", str(port)
            ], cwd="..")
            self.processes.append(process)
            print(f"✅ Serveur HTTP démarré sur http://localhost:{port}")
            return process
        except Exception as e:
            print(f"❌ Erreur démarrage serveur HTTP: {e}")
            return None
    
    def start_splix_server(self, port: int = 8080):
        """Démarre le serveur WebSocket Splix"""
        print(f"🎮 Démarrage du serveur Splix WebSocket sur le port {port}...")
        try:
            process = subprocess.Popen([
                sys.executable, "splix_server.py"
            ])
            self.processes.append(process)
            print(f"✅ Serveur Splix démarré sur ws://localhost:{port}")
            return process
        except Exception as e:
            print(f"❌ Erreur démarrage serveur Splix: {e}")
            return None
    
    def start_all_servers(self):
        """Démarre tous les serveurs nécessaires"""
        print("🚀 Démarrage de tous les serveurs du portfolio...")
        print("=" * 50)
        
        # Vérification des dépendances
        try:
            import websockets
        except ImportError:
            print("❌ Module 'websockets' manquant!")
            print("📦 Installez-le avec: pip install websockets")
            return False
        
        # Démarrage du serveur HTTP
        http_process = self.start_http_server()
        time.sleep(1)
        
        # Démarrage du serveur Splix
        splix_process = self.start_splix_server()
        time.sleep(1)
        
        if http_process and splix_process:
            print("=" * 50)
            print("🎉 Tous les serveurs sont démarrés avec succès!")
            print("\n📋 Informations d'accès:")
            print("🌐 Portfolio principal: http://localhost:8000")
            print("🎮 Jeu Splix: http://localhost:8000/games/splix/")
            print("🏁 Jeu Tron: http://localhost:8000/games/tron/")
            print("🐍 Serveur WebSocket: ws://localhost:8080")
            print("\n⏹️  Appuyez sur Ctrl+C pour arrêter tous les serveurs")
            return True
        else:
            print("❌ Erreur lors du démarrage des serveurs")
            self.stop_all_servers()
            return False
    
    def stop_all_servers(self):
        """Arrête tous les serveurs"""
        print("\n🛑 Arrêt de tous les serveurs...")
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        self.processes.clear()
        print("✅ Tous les serveurs ont été arrêtés")
    
    def signal_handler(self, signum, frame):
        """Gestionnaire pour arrêt propre avec Ctrl+C"""
        self.stop_all_servers()
        sys.exit(0)

def main():
    """Point d'entrée principal"""
    portfolio = PortfolioServer()
    
    # Configuration du gestionnaire de signal pour Ctrl+C
    signal.signal(signal.SIGINT, portfolio.signal_handler)
    signal.signal(signal.SIGTERM, portfolio.signal_handler)
    
    print("🎭 Portfolio de Cédric Martz - Lanceur de serveurs")
    print("=" * 50)
    
    if portfolio.start_all_servers():
        try:
            # Boucle infinie pour maintenir les serveurs actifs
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()