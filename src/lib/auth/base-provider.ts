import type { AuthProvider, AuthEvents, AuthEventCallback, AuthUser, AuthSession } from './types';

export abstract class BaseAuthProvider implements AuthProvider {
	protected _currentUser: AuthUser | null = null;
	protected _currentSession: AuthSession | null = null;
	protected _eventListeners = new Map<keyof AuthEvents, Set<AuthEventCallback<keyof AuthEvents>>>();

	get currentUser(): AuthUser | null {
		return this._currentUser;
	}

	get currentSession(): AuthSession | null {
		return this._currentSession;
	}

	get isAuthenticated(): boolean {
		return this._currentUser !== null;
	}

	protected emit<T extends keyof AuthEvents>(event: T, ...args: Parameters<AuthEvents[T]>): void {
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					// @ts-expect-error - TypeScript has trouble with spread args here
					callback(...args);
				} catch (error) {
					console.error(`Error in ${event} event listener:`, error);
				}
			});
		}
	}

	on<T extends keyof AuthEvents>(event: T, callback: AuthEventCallback<T>): void {
		if (!this._eventListeners.has(event)) {
			this._eventListeners.set(event, new Set());
		}
		this._eventListeners.get(event)!.add(callback);
	}

	off<T extends keyof AuthEvents>(event: T, callback: AuthEventCallback<T>): void {
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			listeners.delete(callback);
		}
	}

	protected setSession(session: AuthSession | null): void {
		const previousUser = this._currentUser;
		this._currentSession = session;
		this._currentUser = session?.user || null;

		// Emit auth state change
		this.emit('auth-state-change', session);

		// Emit user updated if user changed
		if (previousUser?.id !== this._currentUser?.id && this._currentUser) {
			this.emit('user-updated', this._currentUser);
		}

		// Emit pro status change if it changed
		if (previousUser?.isProUnlocked !== this._currentUser?.isProUnlocked) {
			this.emit('pro-status-changed', this._currentUser?.isProUnlocked || false);
		}
	}

	cleanup(): void {
		this._eventListeners.clear();
		this._currentUser = null;
		this._currentSession = null;
	}

	// Abstract methods to be implemented by concrete providers
	abstract signUp(
		credentials: import('./types').SignUpCredentials
	): Promise<{ user?: AuthUser; error?: string }>;
	abstract signIn(
		credentials: import('./types').SignInCredentials
	): Promise<{ session?: AuthSession; error?: string }>;
	abstract signOut(): Promise<{ error?: string }>;
	abstract getSession(): Promise<AuthSession | null>;
	abstract refreshSession(): Promise<AuthSession | null>;
	abstract updateUser(
		updates: Partial<Pick<AuthUser, 'name' | 'metadata'>>
	): Promise<{ user?: AuthUser; error?: string }>;
	abstract updateProStatus(isProUnlocked: boolean): Promise<{ success: boolean; error?: string }>;
	abstract initialize(): Promise<void>;
}
