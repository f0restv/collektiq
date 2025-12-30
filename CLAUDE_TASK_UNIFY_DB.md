# TASK: Unify CollektIQ + Platform on Same Database

## Problem
CollektIQ and client-commerce-platform are separate apps with separate databases.
Forest has hundreds of coins ready to list. Need ONE database, ONE source of truth.

## The Fix

### 1. Point CollektIQ to Neon (same DB as platform)
Create `.env.local` in collektiq folder:
```
DATABASE_URL=postgresql://neondb_owner:npg_xmtu6U7pEMwV@ep-purple-bonus-adbta214-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
PLATFORM_API_URL=https://collektiq.com
NEXT_PUBLIC_PLATFORM_URL=https://collektiq.com
```

### 2. Check if CollektIQ needs Prisma
If it has its own prisma schema, remove it - use platform's schema only.
If it calls platform API, it doesn't need direct DB access.

### 3. Create Submission Flow
The owner needs to be able to:
- Upload photos of coins (single or bulk)
- Get AI analysis + pricing
- Approve and list to marketplace

Check if this exists. If not, note what's missing.

### 4. Verify Shop Page Works
- Does /shop show real inventory?
- Does it pull from platform API or direct DB?

## Working Directory
/Users/capitalpawn/Documents/GitHub/collektiq

## Also Reference
/Users/capitalpawn/Documents/GitHub/client-commerce-platform

## When Complete
Report:
1. Are both apps on same DB now?
2. Can owner submit coins?
3. Do coins show up in shop?
4. What's still missing?
