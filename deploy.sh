#!/bin/bash

# Configuration
BUCKET_NAME="aris-music-pwa-432022"
PROJECT_ID="evocative-fort-432022-k5" # Explicitly set Google Cloud Project ID
PUBLIC_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

# Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Deployment to $BUCKET_NAME (Project: $PROJECT_ID)...${NC}"

# 1. Build the project
echo -e "${GREEN}📦 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deployment."
  exit 1
fi

# 2. Sync files to GCS
echo -e "${GREEN}☁️  Uploading to Google Cloud Storage...${NC}"
gcloud storage rsync -r dist gs://$BUCKET_NAME --project=$PROJECT_ID

# 3. Set Cache-Control headers (Optional but recommended for performance)
# Index.html: No cache (or short cache) so updates are seen immediately
echo -e "${GREEN}⚙️  Setting cache headers...${NC}"
gcloud storage objects update gs://$BUCKET_NAME/index.html --cache-control="no-cache, max-age=0" --project=$PROJECT_ID

# Hashed assets (JS/CSS in assets/): Long cache (1 year)
gcloud storage objects update gs://$BUCKET_NAME/assets/** --cache-control="public, max-age=31536000, immutable" --project=$PROJECT_ID

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "🔗 App is live at: ${GREEN}$PUBLIC_URL${NC}"
