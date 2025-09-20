# Issue #42: TypeScript Error - Property 'audits' does not exist

## Error Details
- **Date**: 2025-09-20
- **Build Environment**: Vercel Production Build
- **Error Location**: `app/protocols/[id]/page.tsx:172:33`

## Error Message
```
Type error: Property 'audits' does not exist on type 'ProtocolConfig'. Did you mean 'audit'?

  170 |           tvl: uniswapData.tvl || staticConfig?.fallbackData?.tvl || 4500000000,
  171 |           chains: staticConfig?.chains || ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'],
> 172 |           audits: staticConfig?.audits || null,
      |                                 ^
  173 |           pools: uniswapData.topPools,
```

## Root Cause
The ProtocolConfig type uses `audit` (singular) property, but the code is trying to access `audits` (plural).

## Solution
Change `audits` to `audit` in line 172 of `app/protocols/[id]/page.tsx`

## Fix Applied
```typescript
// Before:
audits: staticConfig?.audits || null,

// After:
audits: staticConfig?.audit || null,
```

## Verification
- Run `npm run build` to verify the TypeScript compilation succeeds
- Deploy to Vercel

## Status
✅ Fixed - Changed property name from `audits` to `audit`