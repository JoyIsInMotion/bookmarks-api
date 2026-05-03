# Deployment Guide

## Deploying to Netlify

This Bookmarks API is built with Next.js and can be deployed to Netlify. There are two methods:

### Method 1: GitHub + Netlify Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize Netlify
   - Choose your repository
   - Build settings will auto-detect:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"

3. **Set Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add `JWT_SECRET` with a secure random string
   - Example: `JWT_SECRET=your-very-secure-random-string-123`

### Method 2: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Important Notes about File-Based Storage

⚠️ **Critical Limitation**: The current implementation uses `data/db.json` for storage, which **will not persist** between deployments on Netlify because:

- Netlify functions are stateless and ephemeral
- The filesystem is not persistent across function invocations
- Each deployment regenerates the file system

### For Production Use:

Recommended databases to use instead of file-based storage:

1. **Supabase** (PostgreSQL)
   - Free tier available
   - Built-in authentication
   - Easy to integrate

2. **MongoDB Atlas**
   - Free tier (512MB)
   - Simple JSON data model

3. **Firebase Firestore**
   - Serverless
   - Real-time database

4. **AWS DynamoDB**
   - Serverless
   - Pay-per-request pricing

### Workaround (Development/Testing Only)

If you want to keep file-based storage for testing:
- Data will be fresh on each deployment
- Good for demo purposes
- Not suitable for production

## Environment Variables

Required variables for Netlify:

```env
JWT_SECRET=your-secure-secret-key
```

## Testing After Deployment

After deployment, test your API:

```bash
# Get your Netlify site URL from the dashboard
SITE_URL="https://your-site-name.netlify.app"

# Test login
curl -X POST $SITE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password"
  }'

# With token, test bookmarks
TOKEN="your-jwt-token"
curl -X GET "$SITE_URL/api/bookmarks?page=1" \
  -H "Authorization: Bearer $TOKEN"
```

## Custom Domain

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions to update your DNS records
4. Netlify will auto-provision an SSL certificate

## Next Steps for Production

1. **Migrate to a database** - Use Supabase or MongoDB instead of file storage
2. **Add rate limiting** - Protect API from abuse
3. **Enable authentication** - Use a proper OAuth provider
4. **Set up CORS** - Configure allowed origins
5. **Add monitoring** - Use Netlify Analytics or Sentry
6. **Enable CDN caching** - Cache static responses

## Rollback

If you need to rollback to a previous deployment:
1. Go to Deploys in your Netlify dashboard
2. Find the deployment you want
3. Click the three dots → "Trigger deploy"

## Support

For Netlify-specific issues, visit:
- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
