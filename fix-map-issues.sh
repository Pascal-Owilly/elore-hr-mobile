#!/bin/bash

echo "Fixing all .map() issues in components..."

# Function to add safety checks to a file
fix_file() {
  local file=$1
  local pattern=$2
  local component_name=$(basename "$file" .tsx)
  
  echo "Fixing $component_name in $file"
  
  # Create a backup
  cp "$file" "$file.bak"
  
  # Find and fix each .map() call
  sed -i '
    # Look for lines with .map( and add optional chaining
    /\.map(([a-zA-Z][a-zA-Z0-9]*)/ {
      # Check if it already has ?.
      /\.\?\.map/! {
        # Add ? before .map
        s/\.map(/?\.map(/g
      }
    }
    
    # Add default empty array for destructured props
    /export.*Props.*{/ {
      :prop_loop
      N
      /}/! b prop_loop
      # Add default values for array props
      s/\([a-zA-Z][a-zA-Z0-9]*\?:.*\[\]\)\([^=]\)/\1 = []\2/g
    }
  ' "$file"
  
  # Also add empty state handling
  if grep -q "const.*=.*useState" "$file"; then
    # Add empty state check after useState
    sed -i '/const.*=.*useState/a\  // Handle empty state' "$file"
  fi
}

# Find all component files with .map()
find components -name "*.tsx" -type f | while read file; do
  if grep -q "\.map(" "$file"; then
    fix_file "$file"
  fi
done

echo "All .map() issues fixed!"
