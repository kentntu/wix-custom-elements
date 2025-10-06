#!/bin/bash
set -e  # Dừng nếu có lỗi

BUILD_DIR="wix-components"

echo "🏗  Building project..."
# Nếu bạn có lệnh build, bật dòng dưới:
# npm run build

echo "✅ Commit build vào branch main..."
git checkout main
git add $BUILD_DIR
git commit -m "build: update $BUILD_DIR" || echo "⚠️  Không có thay đổi mới để commit."
git push origin main

echo "🚀 Deploy lên branch public..."
git checkout public 2>/dev/null || git checkout public
git checkout main -- $BUILD_DIR
git add $BUILD_DIR
git commit -m "deploy: update build from main" || echo "⚠️  Không có thay đổi mới để commit."
git push origin public

echo "🔙 Quay lại branch main..."
git checkout main

echo "🎉 Deploy completed successfully!"