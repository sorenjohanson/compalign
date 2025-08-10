import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { createAuthProvider, type AuthProvider, type AuthUser, type AuthSession } from '../auth';

// Auth stores
export const currentUser = writable<AuthUser | null>(null);
export const currentSession = writable<AuthSession | null>(null);
export const authError = writable<string | null>(null);
export const authLoading = writable<boolean>(true);

// Derived stores
export const isAuthenticated = derived(currentUser, ($currentUser) => $currentUser !== null);

export const isProUnlocked = derived(
	currentUser,
	($currentUser) => $currentUser?.isProUnlocked || false
);

// Auth provider instance
let authProvider: AuthProvider | null = null;

export function initializeAuth(): AuthProvider | null {
	if (!browser || authProvider) {
		console.log('Auth already initialized or not in browser');
		return authProvider;
	}

	console.log('Initializing authentication provider...');
	authProvider = createAuthProvider();

	if (!authProvider) {
		console.log('No authentication provider available');
		authLoading.set(false);
		return null;
	}

	setupAuthListeners();
	authProvider
		.initialize()
		.then(() => {
			authLoading.set(false);
		})
		.catch((error) => {
			console.error('Auth initialization failed:', error);
			authError.set('Authentication initialization failed');
			authLoading.set(false);
		});

	return authProvider;
}

function setupAuthListeners() {
	if (!authProvider) return;

	authProvider.on('auth-state-change', (session) => {
		console.log('Auth state changed:', session?.user?.email || 'signed out');
		currentSession.set(session);
		currentUser.set(session?.user || null);
		authError.set(null);
	});

	authProvider.on('user-updated', (user) => {
		console.log('User updated:', user.email);
		currentUser.set(user);
	});

	authProvider.on('pro-status-changed', (isProUnlocked) => {
		console.log('Pro status changed:', isProUnlocked);
		// The user store will automatically update via the user-updated event
	});

	authProvider.on('auth-error', (error) => {
		console.error('Auth error:', error);
		authError.set(error);
	});
}

export async function signUp(email: string, password: string, name?: string) {
	if (!authProvider) {
		throw new Error('Authentication not initialized');
	}

	authError.set(null);
	const result = await authProvider.signUp({ email, password, name });

	if (result.error) {
		authError.set(result.error);
		throw new Error(result.error);
	}

	return result.user;
}

export async function signIn(email: string, password: string) {
	if (!authProvider) {
		throw new Error('Authentication not initialized');
	}

	authError.set(null);
	const result = await authProvider.signIn({ email, password });

	if (result.error) {
		authError.set(result.error);
		throw new Error(result.error);
	}

	return result.session;
}

export async function signOut() {
	if (!authProvider) {
		throw new Error('Authentication not initialized');
	}

	authError.set(null);
	const result = await authProvider.signOut();

	if (result.error) {
		authError.set(result.error);
		throw new Error(result.error);
	}
}

export async function updateUser(updates: Partial<Pick<AuthUser, 'name' | 'metadata'>>) {
	if (!authProvider) {
		throw new Error('Authentication not initialized');
	}

	authError.set(null);
	const result = await authProvider.updateUser(updates);

	if (result.error) {
		authError.set(result.error);
		throw new Error(result.error);
	}

	return result.user;
}

export async function updateProStatus(isProUnlocked: boolean) {
	if (!authProvider) {
		throw new Error('Authentication not initialized');
	}

	authError.set(null);
	const result = await authProvider.updateProStatus(isProUnlocked);

	if (!result.success) {
		const error = result.error || 'Failed to update pro status';
		authError.set(error);
		throw new Error(error);
	}

	return result.success;
}

export function getAuthProvider(): AuthProvider | null {
	return authProvider;
}

export function cleanupAuth() {
	if (authProvider) {
		authProvider.cleanup();
		authProvider = null;
	}

	currentUser.set(null);
	currentSession.set(null);
	authError.set(null);
	authLoading.set(true);
}
