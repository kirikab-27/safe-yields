# Environment Variables Configuration

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### API Configuration
```bash
# API base URL (optional, defaults to localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000

# DeFiLlama API base URL
DEFI_LLAMA_BASE=https://api.llama.fi
```

### Affiliate Links
Replace `YOUR_REF_CODE` with your actual affiliate codes:

```bash
# Protocol-specific affiliate links (optional)
NEXT_PUBLIC_LIDO_AFFILIATE=https://stake.lido.fi
NEXT_PUBLIC_ROCKETPOOL_AFFILIATE=https://rocketpool.net
NEXT_PUBLIC_AAVE_AFFILIATE=https://app.aave.com
NEXT_PUBLIC_COMPOUND_AFFILIATE=https://compound.finance
NEXT_PUBLIC_CURVE_AFFILIATE=https://curve.fi

# Exchange affiliate links (recommended for monetization)
NEXT_PUBLIC_BINANCE_AFFILIATE=https://accounts.binance.com/register?ref=YOUR_REF_CODE
NEXT_PUBLIC_BYBIT_AFFILIATE=https://www.bybit.com/invite?ref=YOUR_REF_CODE
NEXT_PUBLIC_COINBASE_AFFILIATE=https://www.coinbase.com/join/YOUR_REF_CODE
```

### SEO Configuration
```bash
# Site configuration
NEXT_PUBLIC_SITE_URL=https://safe-yields.com
NEXT_PUBLIC_SITE_NAME=Safe Yields
NEXT_PUBLIC_DEFAULT_OG_IMAGE=/og/default.png
```

## Getting Affiliate Codes

### Binance
1. Log in to your Binance account
2. Go to Profile → Referral/Affiliate
3. Apply for the affiliate program if needed
4. Copy your referral ID

### Bybit
1. Log in to your Bybit account
2. Navigate to Rewards Hub → Referral
3. Get your referral code

### Coinbase
1. Log in to your Coinbase account
2. Go to Settings → Referrals
3. Copy your referral link

## Notes
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep sensitive data in server-only variables (without `NEXT_PUBLIC_` prefix)
- Never commit `.env.local` to version control