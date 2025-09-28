#!/bin/bash

# 🎮 Script d'installation du Portfolio de Cédric Martz
# Ce script configure automatiquement l'environnement de développement

echo "🎭 Portfolio de Cédric Martz - Installation"
echo "=========================================="

# Vérification de Python
echo "🐍 Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé!"
    echo "📦 Installez Python 3.8+ depuis https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION détecté"

# Vérification de pip
echo "📦 Vérification de pip..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip n'est pas installé!"
    echo "📦 Installez pip avec: sudo apt install python3-pip"
    exit 1
fi

echo "✅ pip détecté"

# Installation des dépendances
echo "📥 Installation des dépendances Python..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dépendances installées avec succès"
else
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

# Vérification de l'installation
echo "🔍 Vérification de l'installation..."
python3 -c "import websockets; print('✅ Module websockets OK')" 2>/dev/null || echo "❌ Module websockets manquant"

echo ""
echo "🎉 Installation terminée avec succès!"
echo ""
echo "🚀 Pour démarrer le portfolio:"
echo "   cd server/"
echo "   python3 start_servers.py"
echo ""
echo "🌐 Le portfolio sera accessible sur:"
echo "   • Portfolio: http://localhost:8000"
echo "   • Splix: http://localhost:8000/games/splix/"
echo "   • Tron: http://localhost:8000/games/tron/"
echo ""
echo "📚 Pour plus d'infos, consultez le README.md"