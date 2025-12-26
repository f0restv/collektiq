# CollektIQ

Snap a photo. Get instant identification, grading, and market prices for coins, cards, and collectibles.

## Features

- **Scan & Identify** - AI-powered identification of coins, currency, sports cards, Pokemon cards
- **Grade Estimation** - Visual condition analysis with confidence scores
- **Market Pricing** - Real prices from eBay, Redbook, Greysheet
- **Shop** - Browse and buy verified collectibles
- **Sell** - Quick cash offers or consignment listings

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude (Vision API)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Anthropic API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:3001) |

## Pages

- `/` - Landing page
- `/scan` - Photo upload and AI analysis
- `/shop` - Browse inventory
- `/shop/[category]` - Category listings
- `/item/[id]` - Single item detail
- `/sell` - Selling options (quick cash, consignment, bulk)

## Related

- [client-commerce-platform](https://github.com/f0restv/client-commerce-platform) - Backend API and admin portal

## License

Proprietary - CollektIQ
