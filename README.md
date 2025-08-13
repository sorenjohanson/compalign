# Salary Calculator

[![Netlify Status](https://api.netlify.com/api/v1/badges/2d9ee477-d88a-45c3-a478-f307583bc2fb/deploy-status)](https://app.netlify.com/projects/storied-kitsune-800490/deploys)

A comprehensive salary and margin calculator built with SvelteKit. Calculate salary breakdowns, analyse profit margins, compare industry benchmarks, and gain strategic insights for freelancing and consulting businesses.

## Features

- **Salary Breakdown Analysis**: Calculate gross salary, employer costs, and hourly rates
- **Margin Analysis**: Detailed gross and net margin calculations with profit breakdowns
- **Strategic Insights**: Get actionable recommendations for pricing and business strategy
- **Dark Mode Support**: Modern UI with light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Pro Features

- **Industry Benchmarks**: Compare your rates against industry standards
- **Collaborative Sharing**: Share calculations with team members and clients
- **Real-time Collaboration**: Work together on calculations in real-time

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Styling**: TailwindCSS 4.x with custom UI components
- **Charts**: LayerChart for data visualisation
- **Deployment**: Netlify with adapter
- **Payments**: Stripe integration for Pro features
- **Real-time**: Socket.io for collaboration
- **Type Safety**: TypeScript throughout
- **Testing**: Vitest with Playwright for E2E

## Development

### Prerequisites

- Node.js 18+ 
- pnpm

### Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd compalign
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev

# or open in browser automatically
pnpm dev --open
```

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm check        # Type checking with Svelte
pnpm lint         # Lint code with ESLint and Prettier
pnpm format       # Format code with Prettier
pnpm test         # Run unit tests
pnpm test:unit    # Run unit tests in watch mode
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information on how to get started, code style guidelines, and the pull request process.

## Deployment

The application is automatically deployed to Netlify on every push to the main branch. The build process:

1. Runs `pnpm build` to create the production bundle
2. Uses `@sveltejs/adapter-netlify` for optimised Netlify deployment
3. Serves static files from the `static/` directory
4. Includes serverless functions for API routes
