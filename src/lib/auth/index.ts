export {
	createAuthProvider,
	isAuthEnabled,
	getAuthMode,
	type AuthConfig,
	type AuthMode
} from './factory';
export { BaseAuthProvider } from './base-provider';
export { SupabaseAuthProvider } from './supabase-provider';
export { LocalAuthProvider } from './local-provider';
export type {
	AuthProvider,
	AuthUser,
	AuthSession,
	AuthEvents,
	SignInCredentials,
	SignUpCredentials
} from './types';
