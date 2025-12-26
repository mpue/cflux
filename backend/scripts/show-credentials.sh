#!/bin/sh
# Script to display admin credentials after first installation

echo "════════════════════════════════════════════════════════════"
echo "  TIME TRACKING SYSTEM - ADMIN CREDENTIALS"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f /tmp/admin-credentials.txt ]; then
    cat /tmp/admin-credentials.txt
else
    echo "⚠️  No credentials file found!"
    echo ""
    echo "This means either:"
    echo "  1. This is not the first installation"
    echo "  2. The credentials file was already deleted"
    echo "  3. The installation process did not complete"
    echo ""
    echo "Check the logs for admin credentials:"
    echo "  docker logs timetracking-backend | grep -A 5 'Admin Email'"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
