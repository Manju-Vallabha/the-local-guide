# The Local Guide API - Deployment Guide

This guide provides step-by-step instructions for deploying The Local Guide API to Google Cloud Functions.

## Prerequisites

1. **Google Cloud Account**: Active Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install and configure `gcloud` CLI
3. **Project Setup**: Google Cloud project with required APIs enabled
4. **Service Account**: Service account with appropriate permissions

## Quick Start

### 1. Environment Setup

```bash
# Set your Google Cloud project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

### 2. Enable Required APIs

```bash
# Enable necessary Google Cloud APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable translate.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 3. Deploy the Function

```bash
# Navigate to backend directory
cd backend

# Deploy using the deployment script
bash deploy.sh
```

## Manual Deployment

If you prefer manual deployment or need custom configuration:

### 1. Prepare Environment Variables

Create a `.env.production` file or set environment variables:

```bash
export ENVIRONMENT=production
export GOOGLE_CLOUD_PROJECT=your-project-id
export ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 2. Deploy with Custom Configuration

```bash
gcloud functions deploy local-guide-api \
    --runtime=python311 \
    --trigger=http \
    --allow-unauthenticated \
    --source=. \
    --entry-point=main \
    --memory=512MB \
    --timeout=60s \
    --max-instances=10 \
    --region=us-central1 \
    --set-env-vars=ENVIRONMENT=production,ALLOWED_ORIGINS=https://your-domain.com
```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Deployment environment | `production` | No |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID | - | Yes |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | - | Yes |
| `REDIS_URL` | Redis connection URL for caching | - | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |

### Function Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Runtime | `python311` | Python 3.11 runtime |
| Memory | `512MB` | Memory allocation |
| Timeout | `60s` | Request timeout |
| Max Instances | `10` | Maximum concurrent instances |
| Region | `us-central1` | Deployment region |

## Security Configuration

### 1. Service Account Setup

Create a service account with minimal required permissions:

```bash
# Create service account
gcloud iam service-accounts create local-guide-service \
    --description="Service account for The Local Guide API" \
    --display-name="Local Guide Service"

# Assign required roles
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:local-guide-service@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/speech.client"

gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:local-guide-service@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/translate.user"
```

### 2. Secret Management

For sensitive configuration, use Google Secret Manager:

```bash
# Create secrets
echo "your-redis-url" | gcloud secrets create redis-url --data-file=-
echo "your-api-key" | gcloud secrets create api-key --data-file=-

# Grant access to the service account
gcloud secrets add-iam-policy-binding redis-url \
    --member="serviceAccount:local-guide-service@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Monitoring and Logging

### 1. View Logs

```bash
# View function logs
gcloud functions logs read local-guide-api --region=us-central1

# Follow logs in real-time
gcloud functions logs tail local-guide-api --region=us-central1
```

### 2. Monitor Performance

Access monitoring in the Google Cloud Console:
- **Functions**: https://console.cloud.google.com/functions
- **Logs**: https://console.cloud.google.com/logs
- **Monitoring**: https://console.cloud.google.com/monitoring

## Testing the Deployment

### 1. Health Check

```bash
# Get function URL
FUNCTION_URL=$(gcloud functions describe local-guide-api --region=us-central1 --format="value(httpsTrigger.url)")

# Test health endpoint
curl "$FUNCTION_URL/health"
```

### 2. API Endpoints

```bash
# Test recommendations endpoint
curl "$FUNCTION_URL/api/recommendations?limit=5"

# Test preferences endpoint
curl "$FUNCTION_URL/api/preferences"
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account permissions
   - Check that APIs are enabled
   - Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly

2. **CORS Issues**
   - Update ALLOWED_ORIGINS environment variable
   - Verify frontend domain is included in allowed origins

3. **Memory/Timeout Issues**
   - Increase memory allocation: `--memory=1GB`
   - Increase timeout: `--timeout=120s`

4. **Cold Start Performance**
   - Consider using Cloud Run for better cold start performance
   - Implement connection pooling for external services

### Debug Mode

Enable debug logging for troubleshooting:

```bash
gcloud functions deploy local-guide-api \
    --set-env-vars=LOG_LEVEL=DEBUG,ENVIRONMENT=development \
    # ... other parameters
```

## Production Checklist

- [ ] Service account with minimal permissions
- [ ] Secrets stored in Secret Manager
- [ ] CORS origins configured for production domains
- [ ] Monitoring and alerting set up
- [ ] Error reporting configured
- [ ] Backup and disaster recovery plan
- [ ] Performance testing completed
- [ ] Security review completed

## Cost Optimization

1. **Function Configuration**
   - Use appropriate memory allocation (512MB is usually sufficient)
   - Set reasonable timeout values
   - Configure max instances based on expected load

2. **API Usage**
   - Implement caching for Google API calls
   - Use batch requests where possible
   - Monitor API quotas and usage

3. **Monitoring**
   - Set up billing alerts
   - Monitor function invocations and duration
   - Review and optimize cold start performance

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Google Cloud Functions documentation
3. Check application logs for specific error messages
4. Verify all prerequisites are met

## Next Steps

After successful deployment:
1. Update frontend configuration with the function URL
2. Set up custom domain (optional)
3. Configure monitoring and alerting
4. Implement CI/CD pipeline for automated deployments