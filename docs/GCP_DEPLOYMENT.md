# Deploy One Day to Google Cloud Run

This setup uses GitHub Actions, keyless Workload Identity Federation, Artifact Registry, Cloud Run, and Secret Manager. It is tuned for low traffic and scale-to-zero.

## 1. Create or select a project

Open Google Cloud Shell, then replace `YOUR_PROJECT_ID` and run:

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-west1"
export REPOSITORY="JohnSu0713/one-day"
gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
```

Billing must be enabled even when usage stays inside the free tier.

## 2. Create runtime and deployment identities

```bash
gcloud iam service-accounts create one-day-runtime --display-name="One Day runtime"
gcloud iam service-accounts create one-day-deployer --display-name="One Day GitHub deployer"

export RUNTIME_SA="one-day-runtime@$PROJECT_ID.iam.gserviceaccount.com"
export DEPLOYER_SA="one-day-deployer@$PROJECT_ID.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOYER_SA" --role="$ROLE"
done

gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:$DEPLOYER_SA" \
  --role="roles/iam.serviceAccountUser"
```

## 3. Create the image repository and cleanup policy

```bash
gcloud artifacts repositories create one-day \
  --repository-format=docker \
  --location="$REGION" \
  --description="One Day production images"

gcloud artifacts repositories set-cleanup-policies one-day \
  --location="$REGION" \
  --policy=infra/artifact-cleanup-policy.json
```

The cleanup policy keeps three recent versions and removes old untagged layers so registry storage does not grow indefinitely.

## 4. Store Plaid credentials

In **Google Cloud Console → Security → Secret Manager**, create these exact secrets:

- `one-day-plaid-client-id`
- `one-day-plaid-secret`

Then allow only the runtime identity to read them:

```bash
for SECRET in one-day-plaid-client-id one-day-plaid-secret; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$RUNTIME_SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

Do not paste Plaid values into GitHub variables, workflow files, or the repository.

## 5. Configure keyless GitHub authentication

```bash
export POOL_ID="github-pool"
export PROVIDER_ID="github-provider"

gcloud iam workload-identity-pools create "$POOL_ID" \
  --project="$PROJECT_ID" --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --project="$PROJECT_ID" --location=global \
  --workload-identity-pool="$POOL_ID" \
  --display-name="JohnSu0713 one-day" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPOSITORY'"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$REPOSITORY"

gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --project="$PROJECT_ID" --location=global \
  --workload-identity-pool="$POOL_ID" \
  --format='value(name)'
```

Copy the final command's output. It begins with `projects/.../locations/global/workloadIdentityPools/...`.

## 6. Add GitHub repository variables

In **GitHub → one-day → Settings → Secrets and variables → Actions → Variables**, create:

| Variable | Value |
|---|---|
| `GCP_PROJECT_ID` | Your project ID |
| `GCP_SERVICE_ACCOUNT` | `one-day-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | The full provider name copied above |

These identifiers are not secrets. No Google Cloud private key is required.

## 7. Deploy

Open the repository's **Actions → CI → Run workflow**, or push to `main`. The workflow will:

1. install dependencies;
2. run TypeScript, unit tests, and the production build;
3. build and push an immutable container image;
4. deploy to Cloud Run only after verification succeeds;
5. call `/api/health` and fail if production is unhealthy.

The Cloud Run configuration uses 1 vCPU, 512 MiB, zero minimum instances, a maximum of one instance, and request-time CPU allocation. This minimizes idle cost. Configure a small Cloud Billing budget alert as an additional guardrail; budget alerts notify you but do not hard-stop spending.

