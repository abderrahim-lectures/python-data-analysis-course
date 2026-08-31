#!/bin/bash
# Loop script for continuous improvement
# Runs typecheck after each improvement cycle

cd /home/adrabi/dev/pyda-course

echo "=== Starting improvement loop ==="

while true; do
  echo ""
  echo "--- Improvement cycle: $(date) ---"
  
  # Run typecheck
  echo "Running typecheck..."
  npm run typecheck 2>&1 | tail -5
  
  # Check if typecheck passed
  if [ $? -eq 0 ]; then
    echo "✓ Typecheck passed"
  else
    echo "✗ Typecheck failed - stopping loop"
    exit 1
  fi
  
  echo "Waiting 30 seconds before next cycle..."
  sleep 30
done
