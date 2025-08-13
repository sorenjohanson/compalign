# Contributing to CompAlign

We welcome contributions! Please follow these guidelines to help us maintain code quality and make the review process smooth.

## Getting Started

1. **Fork the repository** and create your feature branch from `main`
2. **Follow the existing code style** - run `pnpm lint` to check formatting
3. **Add tests** for any new functionality (if applicable)
4. **Update documentation** if you're changing APIs or adding features
5. **Run the full test suite** with `pnpm test` before submitting
6. **Create a pull request** with a clear title and description

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing Prettier/ESLint configuration
- Keep components focussed and reusable
- Use semantic HTML and accessible markup
- Write clear, descriptive commit messages

## Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   ├── salary-calculator/   # Core calculation logic
│   ├── services/           # External API integrations
│   ├── stores/             # Svelte stores for state management
│   └── utils.ts            # Utility functions
├── routes/                 # SvelteKit routes and API endpoints
└── app.html               # HTML template
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm

### Setup Steps

1. Clone your fork:
```bash
git clone <your-fork-url>
cd salary-calculator
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
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

## Pull Request Process

1. Ensure your code follows the existing style guidelines
2. Run `pnpm lint` and `pnpm test` before submitting
3. Update the README.md if you're adding new features
4. Write a clear pull request description explaining:
   - What changes you made
   - Why you made them
   - How to test them

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behaviour
- Browser/environment details
- Screenshots if relevant

## Questions?

If you have questions about contributing, feel free to open an issue for discussion.