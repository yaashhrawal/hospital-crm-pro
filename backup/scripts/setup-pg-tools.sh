#!/bin/bash

# PostgreSQL Tools Setup Script for Hospital CRM Backup System

echo "🛠️  PostgreSQL Tools Setup for Hospital CRM Backup"
echo "================================================="

# Detect operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
else
    OS="Unknown"
fi

echo "🖥️  Detected OS: $OS"

# Check if PostgreSQL tools are already installed
if command -v pg_dump &> /dev/null && command -v pg_restore &> /dev/null; then
    echo "✅ PostgreSQL tools are already installed!"
    echo "📊 pg_dump version: $(pg_dump --version)"
    echo "📊 pg_restore version: $(pg_restore --version)"
    echo ""
    echo "🎉 You're ready to use PostgreSQL backups!"
    echo "   Run: npm run backup:pg"
    exit 0
fi

echo "❌ PostgreSQL tools not found"
echo ""

# Provide installation instructions based on OS
case $OS in
    "macOS")
        echo "📦 Installing PostgreSQL tools on macOS..."
        echo ""
        
        # Check if Homebrew is installed
        if command -v brew &> /dev/null; then
            echo "🍺 Homebrew detected. Installing PostgreSQL..."
            brew install postgresql
            if [ $? -eq 0 ]; then
                echo "✅ PostgreSQL tools installed successfully!"
            else
                echo "❌ Installation failed. Please try manually:"
                echo "   brew install postgresql"
            fi
        else
            echo "🍺 Homebrew not found. Please install it first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo ""
            echo "📦 Alternative installation methods:"
            echo "   1. Download PostgreSQL from https://www.postgresql.org/download/macosx/"
            echo "   2. Use MacPorts: sudo port install postgresql15"
            echo "   3. Use installer from https://postgresapp.com/"
        fi
        ;;
        
    "Linux")
        echo "🐧 Installing PostgreSQL tools on Linux..."
        echo ""
        
        # Detect Linux distribution
        if [ -f /etc/debian_version ]; then
            echo "📦 Debian/Ubuntu detected"
            echo "   Run: sudo apt-get update && sudo apt-get install postgresql-client"
        elif [ -f /etc/redhat-release ]; then
            echo "📦 Red Hat/CentOS detected"
            echo "   Run: sudo yum install postgresql"
        elif [ -f /etc/arch-release ]; then
            echo "📦 Arch Linux detected"
            echo "   Run: sudo pacman -S postgresql"
        else
            echo "📦 Generic Linux installation:"
            echo "   Use your package manager to install 'postgresql-client' or 'postgresql'"
        fi
        ;;
        
    "Windows")
        echo "🪟 Windows detected"
        echo ""
        echo "📦 Installation options:"
        echo "   1. Download PostgreSQL installer from:"
        echo "      https://www.postgresql.org/download/windows/"
        echo ""
        echo "   2. Use Chocolatey:"
        echo "      choco install postgresql"
        echo ""
        echo "   3. Use winget:"
        echo "      winget install PostgreSQL.PostgreSQL"
        echo ""
        echo "   4. Use Scoop:"
        echo "      scoop install postgresql"
        ;;
        
    *)
        echo "❓ Unknown operating system"
        echo "📦 Please install PostgreSQL tools manually:"
        echo "   Visit: https://www.postgresql.org/download/"
        ;;
esac

echo ""
echo "🔧 After installation, verify with:"
echo "   pg_dump --version"
echo "   pg_restore --version"
echo ""
echo "🚀 Then run: npm run backup:pg"
echo ""
echo "📚 For more information, see:"
echo "   backup/POSTGRESQL_BACKUP.md"