#!/bin/bash
# =============================================================================
# Workload Identity Federation Setup for GitHub Actions
# =============================================================================
# This script sets up keyless authentication between GitHub Actions and GCP
# Run this script locally with gcloud CLI authenticated
# =============================================================================

set -e

# Configuration - Update these values
PROJECT_ID="dawinos"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
GITHUB_ORG="dawingroup"  # Your GitHub organization or username
GITHUB_REPO="dawinos"    # Your repository name
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-provider"
SERVICE_ACCOUNT_NAME="github-actions-deployer"

echo "=========================================="
echo "Setting up Workload Identity Federation"
echo "=========================================="
echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo "GitHub: $GITHUB_ORG/$GITHUB_REPO"
echo "=========================================="

# Step 1: Enable required APIs
echo ""
echo "Step 1: Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable sts.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID

# Step 2: Create Workload Identity Pool
echo ""
echo "Step 2: Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --description="Identity pool for GitHub Actions CI/CD" \
  2>/dev/null || echo "Pool already exists, continuing..."

# Step 3: Create Workload Identity Provider
echo ""
echo "Step 3: Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '$GITHUB_ORG'" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  2>/dev/null || echo "Provider already exists, continuing..."

# Step 4: Create Service Account
echo ""
echo "Step 4: Creating Service Account..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions Deployer" \
  --description="Service account for GitHub Actions Firebase deployments" \
  2>/dev/null || echo "Service account already exists, continuing..."

SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Step 5: Grant roles to Service Account
echo ""
echo "Step 5: Granting roles to Service Account..."
ROLES=(
  "roles/firebase.admin"
  "roles/firebasehosting.admin"
  "roles/cloudfunctions.admin"
  "roles/iam.serviceAccountUser"
  "roles/storage.admin"
  "roles/datastore.owner"
)

for ROLE in "${ROLES[@]}"; do
  echo "  Granting $ROLE..."
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$ROLE" \
    --condition=None \
    --quiet
done

# Step 6: Allow GitHub Actions to impersonate the Service Account
echo ""
echo "Step 6: Configuring Workload Identity binding..."
WORKLOAD_IDENTITY_POOL_ID="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME"

gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$WORKLOAD_IDENTITY_POOL_ID/attribute.repository/$GITHUB_ORG/$GITHUB_REPO"

# Get the full provider resource name
PROVIDER_RESOURCE_NAME="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Add these secrets to your GitHub repository:"
echo "(Settings -> Secrets and variables -> Actions -> New repository secret)"
echo ""
echo "WIF_PROVIDER:"
echo "$PROVIDER_RESOURCE_NAME"
echo ""
echo "WIF_SERVICE_ACCOUNT:"
echo "$SERVICE_ACCOUNT_EMAIL"
echo ""
echo "=========================================="
echo ""
echo "Or run these GitHub CLI commands:"
echo ""
echo "gh secret set WIF_PROVIDER --body \"$PROVIDER_RESOURCE_NAME\""
echo "gh secret set WIF_SERVICE_ACCOUNT --body \"$SERVICE_ACCOUNT_EMAIL\""
echo ""
