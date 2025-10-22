# Deployment Guide - Köln Branchen Portal

This guide explains how to deploy the Köln Branchen Portal booking management system to Render.com.

## Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **Environment Variables**: Prepare the required environment variables

## Deployment Steps

### 1. Prepare Your Repository

Ensure your project structure matches:
```
koeln-branchen-portal/
├── client/          # React frontend
├── server/          # Express.js backend
├── render.yaml      # Render deployment configuration
└── README.md
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Köln Branchen Portal"
git branch -M main
git remote add origin https://github.com/yourusername/koeln-branchen-portal.git
git push -u origin main
```

### 3. Deploy to Render

#### Option A: Automatic Deployment (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing your project
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to start deployment

#### Option B: Manual Service Creation

If automatic deployment doesn't work, create services manually:

##### 3.1 Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `koeln-branchen-db`
   - **Database Name**: `koeln_branchen_portal`
   - **User**: `koeln_user`
   - **Region**: Frankfurt (or closest to your users)
   - **Plan**: Free (for testing) or Starter (for production)

##### 3.2 Create Backend Web Service

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `koeln-branchen-api`
   - **Environment**: Node
   - **Region**: Frankfurt
   - **Branch**: main
   - **Root Directory**: Leave empty
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (for testing) or Starter (for production)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Auto-filled from database]
   CORS_ORIGIN=*
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CLEANUP_INTERVAL_MINUTES=30
   RESERVATION_TIMEOUT_MINUTES=30
   ```

##### 3.3 Create Frontend Static Site

1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `koeln-branchen-frontend`
   - **Environment**: Node
   - **Region**: Frankfurt
   - **Branch**: main
   - **Root Directory**: Leave empty
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

4. Add Environment Variables:
   ```
   VITE_API_BASE_URL=https://koeln-branchen-api.onrender.com
   ```

### 4. Database Setup

After the backend service is deployed:

1. Go to your backend service dashboard
2. Open the "Shell" tab
3. Run database migration:
   ```bash
   cd server && npm run migrate up
   ```

4. (Optional) Seed with sample data:
   ```bash
   cd server && npm run seed seed
   ```

### 5. Verify Deployment

1. **Backend Health Check**: Visit `https://your-api-service.onrender.com/health`
2. **Frontend**: Visit your static site URL
3. **Database**: Check that the frontend can load and create bookings

## Environment Variables Reference

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Server
NODE_ENV=production
PORT=10000

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cleanup
CLEANUP_INTERVAL_MINUTES=30
RESERVATION_TIMEOUT_MINUTES=30
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in package.json
   - Verify build commands are correct
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Ensure DATABASE_URL is correctly set
   - Check that the database service is running
   - Verify SSL settings for production

3. **CORS Errors**
   - Ensure CORS_ORIGIN is set to "*" or your frontend domain
   - Check that the backend is properly configured for CORS

4. **Frontend API Calls Failing**
   - Verify VITE_API_BASE_URL points to the correct backend URL
   - Check that the backend service is accessible
   - Ensure API endpoints are working (test with /health)

### Debugging Steps

1. **Check Service Logs**
   - Go to service dashboard → "Logs" tab
   - Look for error messages and stack traces

2. **Test API Endpoints**
   ```bash
   curl https://your-api-service.onrender.com/health
   curl https://your-api-service.onrender.com/api/bookings
   ```

3. **Database Connection Test**
   - Use the shell in your backend service
   - Run: `node -e "require('./config/database').testConnection()"`

## Monitoring and Maintenance

### Health Monitoring
- Backend health check: `/health` endpoint
- Monitor service uptime in Render dashboard
- Set up alerts for service failures

### Database Maintenance
- Regular backups (automatic with Render PostgreSQL)
- Monitor database size and performance
- Clean up expired reservations regularly

### Updates and Deployments
- Push changes to GitHub to trigger automatic deployments
- Use staging branches for testing before production
- Monitor deployment logs for issues

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database Access**: Use strong passwords and limit access
3. **API Rate Limiting**: Configured to prevent abuse
4. **CORS**: Restrict origins in production if needed
5. **SSL/TLS**: Automatically handled by Render

## Cost Optimization

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- 750 hours per month per service
- Limited bandwidth and storage

### Upgrading to Paid Plans
- Starter plans prevent sleeping
- Better performance and reliability
- More bandwidth and storage
- Priority support

## Support

For issues with:
- **Application Code**: Check GitHub issues or create new ones
- **Render Platform**: Contact Render support
- **Database Issues**: Check Render PostgreSQL documentation

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js Deployment Guide](https://render.com/docs/deploy-node-express-app)
- [Static Site Deployment](https://render.com/docs/deploy-create-react-app)
- [PostgreSQL on Render](https://render.com/docs/databases)

