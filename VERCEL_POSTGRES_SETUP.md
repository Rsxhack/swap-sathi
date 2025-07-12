# Vercel Postgres Setup for SwapSathi

## Overview

SwapSathi now uses **Vercel Postgres** - a secure, serverless PostgreSQL database that's:
- ✅ **Free** - Generous free tier with 60 hours of compute time
- ✅ **Secure** - Built-in SSL, connection pooling, and automatic backups
- ✅ **Fast** - Edge-optimized with automatic scaling
- ✅ **Simple** - Zero configuration when deployed to Vercel

## Quick Setup

### 1. Deploy to Vercel (Recommended)

The easiest way is to deploy directly to Vercel:

1. **Push to GitHub**: Commit your code to a GitHub repository
2. **Import to Vercel**: Go to [vercel.com](https://vercel.com) and import your repo
3. **Add Database**: In your Vercel dashboard, go to Storage → Create Database → Postgres
4. **Deploy**: Vercel automatically configures all environment variables

### 2. Local Development Setup

For local development, you have two options:

#### Option A: Use Vercel Postgres Locally
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Start development
npm run dev
\`\`\`

#### Option B: Local PostgreSQL
\`\`\`bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb swapsathi

# Update .env.local with your local connection string
POSTGRES_URL="postgresql://username:password@localhost:5432/swapsathi"
\`\`\`

## Database Features

### Automatic Table Creation
The database automatically creates all required tables on first connection:
- ✅ Users with wallet authentication
- ✅ Ads with filtering and search
- ✅ Deals with escrow integration
- ✅ Messages for P2P chat
- ✅ Notifications system

### Built-in Security
- 🔒 SSL/TLS encryption
- 🔒 Connection pooling
- 🔒 SQL injection prevention
- 🔒 Wallet signature verification

### Performance Optimizations
- ⚡ Automatic indexing
- ⚡ Query optimization
- ⚡ Connection reuse
- ⚡ Edge caching

## API Endpoints

All database operations are available through REST APIs:

\`\`\`typescript
// User management
GET  /api/users?wallet=0x...
POST /api/users (authentication)
PUT  /api/users (profile updates)

// Advertisement system
GET  /api/ads?asset=BTC&type=sell
POST /api/ads (create ad)
GET  /api/ads/[id] (ad details)

// Deal management
GET  /api/deals?wallet=0x...
POST /api/deals (create deal)
GET  /api/deals/[id] (deal details)
PUT  /api/deals/[id] (update status)

// System health
GET  /api/health (database status)
\`\`\`

## Free Tier Limits

Vercel Postgres free tier includes:
- **60 hours** of compute time per month
- **256 MB** of storage
- **1 database** per project
- **Unlimited** queries within compute hours

Perfect for development and small-scale production use!

## Scaling Options

When you need more:
- **Pro Plan**: $20/month for 100 hours compute + 512 MB storage
- **Enterprise**: Custom pricing for high-volume applications

## Monitoring

Built-in monitoring includes:
- Query performance metrics
- Connection pool status
- Error logging and alerts
- Usage analytics

## Security Best Practices

✅ **Environment Variables**: Never commit database URLs to git  
✅ **Connection Pooling**: Automatic with Vercel Postgres  
✅ **SSL Encryption**: Enabled by default  
✅ **Input Validation**: All API endpoints validate inputs  
✅ **Wallet Authentication**: Cryptographic signature verification  

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check environment variables are set
2. **Table Not Found**: Database auto-initializes on first connection
3. **Permission Denied**: Verify wallet signature authentication
4. **Slow Queries**: Check database indexes (auto-created)

### Debug Mode

Enable detailed logging:
\`\`\`bash
DEBUG=vercel-postgres:* npm run dev
\`\`\`

### Health Check

Monitor system status:
\`\`\`bash
curl https://your-app.vercel.app/api/health
\`\`\`

## Migration from Other Databases

If migrating from Supabase or other providers:

1. **Export Data**: Use your current provider's export tools
2. **Deploy SwapSathi**: Let Vercel Postgres create the schema
3. **Import Data**: Use SQL INSERT statements or CSV import
4. **Update Environment**: Switch to Vercel Postgres URLs
5. **Test**: Verify all functionality works

## Support

- **Documentation**: [vercel.com/docs/storage/vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)
- **Community**: Vercel Discord server
- **Support**: Vercel support for Pro+ accounts
- **Issues**: GitHub repository for app-specific problems

---

This setup provides SwapSathi with enterprise-grade database capabilities while remaining completely free for development and small-scale production use.
