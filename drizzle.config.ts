import type { Config } from 'drizzle-kit';

// Use environment variables that work with Cloudflare Pages build environment
const getDatabaseUrl = (): string => {
	// Try different environment variable sources for Cloudflare compatibility
	const dbUrl = import.meta.env?.VITE_DATABASE_URL || import.meta.env?.DATABASE_URL;

	if (!dbUrl) {
		throw new Error(
			'DATABASE_URL is required for database operations. Set VITE_DATABASE_URL or DATABASE_URL environment variable.'
		);
	}

	return dbUrl;
};

export default {
	schema: './src/lib/collaboration/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: getDatabaseUrl()
	}
} satisfies Config;
