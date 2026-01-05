#!/bin/bash

echo "Fixing all interface default values..."

# Find and fix all .tsx and .ts files
find components lib app -name "*.tsx" -o -name "*.ts" | while read file; do
  echo "Checking $file"
  
  # Create backup
  cp "$file" "$file.bak" 2>/dev/null
  
  # Fix interface default values
  # Pattern: interface Prop { field: Type = value; }
  sed -i '
    # Fix array defaults
    s/\([a-zA-Z][a-zA-Z0-9]*\): \([a-zA-Z][a-zA-Z0-9]*\[\]\) = \[\];/\1?: \2;/g
    
    # Fix string defaults
    s/\([a-zA-Z][a-zA-Z0-9]*\): string = "";/\1?: string;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): string = '\'\'';/\1?: string;/g
    
    # Fix number defaults
    s/\([a-zA-Z][a-zA-Z0-9]*\): number = 0;/\1?: number;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): number = 1;/\1?: number;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): number = -1;/\1?: number;/g
    
    # Fix boolean defaults
    s/\([a-zA-Z][a-zA-Z0-9]*\): boolean = false;/\1?: boolean;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): boolean = true;/\1?: boolean;/g
    
    # Fix any type defaults
    s/\([a-zA-Z][a-zA-Z0-9]*\): any = {};/\1?: any;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): any = null;/\1?: any;/g
    s/\([a-zA-Z][a-zA-Z0-9]*\): any = undefined;/\1?: any;/g
  ' "$file"
  
  echo "Fixed $file"
done

echo "All interfaces fixed!"
