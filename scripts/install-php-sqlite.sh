#!/usr/bin/env bash
# Install PHP SQLite PDO extension on Debian/Ubuntu systems.
# Usage: sudo ./scripts/install-php-sqlite.sh

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root (or via sudo). It will attempt to install the PHP sqlite extension." >&2
  echo "Run: sudo $0" >&2
  exit 1
fi

PHP_BIN=$(command -v php || true)
if [ -z "$PHP_BIN" ]; then
  echo "php binary not found in PATH." >&2
  exit 1
fi

PHP_VERSION_FULL=$($PHP_BIN -r 'echo PHP_VERSION;')
PHP_MAJOR=$(echo "$PHP_VERSION_FULL" | cut -d. -f1)
PHP_MINOR=$(echo "$PHP_VERSION_FULL" | cut -d. -f2)
PHP_VER="${PHP_MAJOR}.${PHP_MINOR}"

echo "Detected PHP version: $PHP_VERSION_FULL (using $PHP_VER)"

PKG="php${PHP_VER}-sqlite3"
echo "Installing package: $PKG"

apt-get update
apt-get install -y "$PKG"

echo "Installed $PKG. You may need to restart php-fpm or your webserver if running one." 
echo "Try: systemctl restart php${PHP_VER}-fpm  # or restart apache/nginx as appropriate"

echo "You can now run: php -i | grep -i sqlite" 

exit 0
