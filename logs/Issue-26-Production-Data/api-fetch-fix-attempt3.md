# API Fetch Fix - Attempt 3

## Date: 2025-09-15

## Issue
Production environment not fetching API data for protocols (APY and TVL showing as N/A)

## Solution Approach
Simplify the URL construction by using relative paths. In Next.js server components, relative paths automatically use the correct host.

## Changes Made

### 1. app/protocols/[id]/page.tsx
- Removed complex URL construction logic
- Using simple relative path: `/api/protocols/${id}`
- Let Next.js handle the host resolution

### 2. lib/protocols/index.ts
- Simplified getProtocolData function
- Using relative path instead of constructing absolute URLs
- Removed environment variable checks

## Technical Details
In Next.js App Router:
- Server components can use relative paths for fetch
- Next.js automatically resolves to the correct host
- Works in both development and production

## Testing Steps
1. Deploy to Vercel
2. Access /protocols/lido
3. Check if APY and TVL display actual values
4. Monitor console logs for API calls

## Expected Result
- API data should be fetched correctly
- APY and TVL should show real values
- No more N/A display for dynamic data