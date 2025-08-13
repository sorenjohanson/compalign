import type { AuthProvider } from './types';
import type { AuthMode } from './types';
import { SupabaseAuthProvider } from './supabase-provider';
import { LocalAuthProvider } from './local-provider';
import { dev } from '$app/environment';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_AUTH_MODE
} from '$env/static/public';

export interface AuthConfig {
	mode: AuthMode;
	supabase?: {
		url: string;
		key: string;
	};
}

function getAuthConfig(): AuthConfig {
	// In development, default to local mode unless Supabase is configured
	if (dev) {
		const supabaseUrl = PUBLIC_SUPABASE_URL;
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

		if (supabaseUrl && supabaseKey) {
			return {
				mode: 'supabase',
				supabase: {
					url: supabaseUrl,
					key: supabaseKey
				}
			};
		}

		return { mode: 'local' };
	}

	// In production, check environment variables to determine mode
	const authMode = PUBLIC_AUTH_MODE as AuthMode | undefined;
	const supabaseUrl = PUBLIC_SUPABASE_URL;
	const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

	// If Supabase credentials are provided, use Supabase mode
	if (supabaseUrl && supabaseKey) {
		return {
			mode: authMode === 'disabled' ? 'disabled' : 'supabase',
			supabase: {
				url: supabaseUrl,
				key: supabaseKey
			}
		};
	}

	// If local auth is explicitly enabled, use local mode
	if (authMode === 'local') {
		return { mode: 'local' };
	}

	// Default to disabled in production if no configuration is provided
	return { mode: 'disabled' };
}

export function createAuthProvider(): AuthProvider | null {
	const config = getAuthConfig();

	switch (config.mode) {
		case 'local':
			console.log('🔐 Using Local authentication provider (OSS mode)');
			return new LocalAuthProvider();

		case 'supabase':
			if (!config.supabase) {
				console.error('Supabase configuration missing for supabase auth mode');
				return null;
			}
			console.log('🔐 Using Supabase authentication provider (hosted mode)');
			return new SupabaseAuthProvider(config.supabase.url, config.supabase.key);

		case 'disabled':
			console.log('🔐 Authentication is disabled');
			return null;

		default:
			console.warn('Unknown authentication mode:', config.mode);
			return null;
	}
}

export function isAuthEnabled(): boolean {
	const config = getAuthConfig();
	return config.mode !== 'disabled';
}

export function getAuthMode(): AuthMode {
	return getAuthConfig().mode;
}

export { type AuthMode } from './types';
