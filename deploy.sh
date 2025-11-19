#!/usr/bin/env bash
set -euo pipefail

# This script will make the `public` branch contain ONLY the `wix-components`
# folder as copied from the `main` branch. It creates an orphan `public`
# branch and force-pushes it. The script will exit if there are uncommitted
# changes in the working tree to avoid accidental data loss.

BUILD_DIR="wix-components"
ORIGIN="origin"
MAIN_BRANCH="main"
PUBLIC_BRANCH="public"

echo "⏳ Fetching latest from remote..."
git fetch "$ORIGIN"

# Prevent running if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
	echo "⚠️  You have uncommitted changes. Please commit or stash them before running this script."
	exit 1
fi

echo "➡️  Checking out $MAIN_BRANCH and pulling latest..."
git checkout "$MAIN_BRANCH"
git pull "$ORIGIN" "$MAIN_BRANCH"

if [ ! -d "$BUILD_DIR" ]; then
	echo "❌ Directory '$BUILD_DIR' does not exist on $MAIN_BRANCH. Aborting."
	exit 1
fi

echo "➡️  Creating orphan branch '$PUBLIC_BRANCH' containing only $BUILD_DIR..."

# Create orphan branch (no history) and make working tree clean
git checkout --orphan "$PUBLIC_BRANCH"
git reset --hard

# Remove all files (both tracked and untracked) to ensure branch contains only BUILD_DIR
git rm -rf . || true
git clean -fdx || true

# Bring the folder from main into this orphan branch
git checkout "$MAIN_BRANCH" -- "$BUILD_DIR"

if [ ! -d "$BUILD_DIR" ]; then
	echo "❌ Failed to checkout $BUILD_DIR from $MAIN_BRANCH. Aborting."
	exit 1
fi

git add "$BUILD_DIR"
git commit -m "deploy: publish $BUILD_DIR from $MAIN_BRANCH" || true

echo "➡️  Force-pushing $PUBLIC_BRANCH to $ORIGIN (this will overwrite remote $PUBLIC_BRANCH)..."
git push "$ORIGIN" "$PUBLIC_BRANCH" --force-with-lease

echo "➡️  Returning to $MAIN_BRANCH..."
git checkout "$MAIN_BRANCH"

echo "🎉 public branch now contains only '$BUILD_DIR' from $MAIN_BRANCH."