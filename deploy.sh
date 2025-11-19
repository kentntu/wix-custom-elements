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

echo "➡️  Preparing a temporary orphan branch and publishing $BUILD_DIR to $PUBLIC_BRANCH..."

# Use a temporary orphan branch so we don't accidentally clobber a local 'public' branch
TMP_BRANCH="${PUBLIC_BRANCH}-deploy-temp-$(date +%s)"

echo "➡️  Creating orphan branch '$TMP_BRANCH'..."
git checkout --orphan "$TMP_BRANCH"
git reset --hard

# Clean working tree
git rm -rf . || true
git clean -fdx || true

# Bring the folder from main into this orphan branch
git checkout "$MAIN_BRANCH" -- "$BUILD_DIR"

if [ ! -d "$BUILD_DIR" ]; then
	echo "❌ Failed to checkout $BUILD_DIR from $MAIN_BRANCH. Aborting."
	# restore main before exiting
	git checkout "$MAIN_BRANCH" || true
	exit 1
fi

git add "$BUILD_DIR"
git commit -m "deploy: publish $BUILD_DIR from $MAIN_BRANCH" || true

echo "➡️  Force-pushing temporary branch '$TMP_BRANCH' to remote '$PUBLIC_BRANCH' (overwrite)..."
git push "$ORIGIN" "$TMP_BRANCH:$PUBLIC_BRANCH" --force-with-lease

echo "➡️  Cleaning up temporary branch and returning to $MAIN_BRANCH..."
git checkout "$MAIN_BRANCH"
git branch -D "$TMP_BRANCH" || true

echo "🎉 public branch now contains only '$BUILD_DIR' from $MAIN_BRANCH."