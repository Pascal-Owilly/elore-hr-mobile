#!/bin/bash

# Create a backup
cp app/app/index.tsx app/app/index.tsx.backup

# Fix the file
sed -i "
# Fix quickActions icons
s/'login'/'login'/
s/'logout'/'logout'/
s/'calendar-plus'/'calendar-plus'/
s/'file-text'/'file-text'/

# Fix adminActions icons  
s/'users'/'account-group'/
s/'credit-card'/'credit-card'/
s/'pie-chart'/'chart-pie'/
s/'check-circle'/'check-circle'/

# Fix StatCard icons
s/icon=\"clock\"/icon=\"clock\" type=\"material-community\"/g
s/icon=\"calendar\"/icon=\"calendar\" type=\"material-community\"/g
s/icon=\"credit-card\"/icon=\"credit-card\" type=\"material-community\"/g
s/icon=\"zap\"/icon=\"lightning-bolt\" type=\"material-community\"/g
" app/app/index.tsx

echo "Icons fixed!"
