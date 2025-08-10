import { BaseAuthProvider } from './base-provider';
import type { AuthUser, AuthSession, SignUpCredentials, SignInCredentials } from './types';
import { browser } from '$app/environment';

interface LocalUser {
	id: string;
	email: string;
	name: string;
	passwordHash: string; // In a real implementation, this would be properly hashed
	isProUnlocked: boolean;
	metadata: Record<string, any>;
	createdAt: string;
	lastSignIn?: string;
}

export class LocalAuthProvider extends BaseAuthProvider {
	private readonly STORAGE_KEY = 'local-auth';
	private readonly USERS_KEY = 'local-users';
	private readonly SESSION_KEY = 'local-session';

	async initialize(): Promise<void> {
		if (!browser) return;

		try {
			// Check for existing session
			const sessionData = localStorage.getItem(this.SESSION_KEY);
			if (sessionData) {
				const { userId, expiresAt } = JSON.parse(sessionData);

				if (new Date() < new Date(expiresAt)) {
					const user = this.getStoredUser(userId);
					if (user) {
						const authUser = this.convertLocalUserToAuthUser(user);
						const authSession: AuthSession = {
							user: authUser,
							expiresAt: new Date(expiresAt)
						};
						this.setSession(authSession);
						return;
					}
				}

				// Clean up expired session
				localStorage.removeItem(this.SESSION_KEY);
			}
		} catch (error) {
			console.error('Error initializing local auth:', error);
			this.emit('auth-error', 'Failed to initialize local authentication');
		}
	}

	private getStoredUsers(): LocalUser[] {
		try {
			const users = localStorage.getItem(this.USERS_KEY);
			return users ? JSON.parse(users) : [];
		} catch {
			return [];
		}
	}

	private getStoredUser(userId: string): LocalUser | null {
		const users = this.getStoredUsers();
		return users.find((u) => u.id === userId) || null;
	}

	private getUserByEmail(email: string): LocalUser | null {
		const users = this.getStoredUsers();
		return users.find((u) => u.email === email) || null;
	}

	private saveUser(user: LocalUser): void {
		const users = this.getStoredUsers();
		const existingIndex = users.findIndex((u) => u.id === user.id);

		if (existingIndex >= 0) {
			users[existingIndex] = user;
		} else {
			users.push(user);
		}

		localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
	}

	private createSession(user: LocalUser): AuthSession {
		const authUser = this.convertLocalUserToAuthUser(user);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		const sessionData = {
			userId: user.id,
			expiresAt: expiresAt.toISOString()
		};

		localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));

		// Update last sign in
		user.lastSignIn = new Date().toISOString();
		this.saveUser(user);

		return {
			user: authUser,
			expiresAt
		};
	}

	private convertLocalUserToAuthUser(user: LocalUser): AuthUser {
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			isProUnlocked: user.isProUnlocked,
			metadata: user.metadata,
			createdAt: new Date(user.createdAt),
			lastSignIn: user.lastSignIn ? new Date(user.lastSignIn) : undefined
		};
	}

	private generateId(): string {
		return 'local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	private simpleHash(password: string): string {
		// WARNING: This is a simple hash for demo purposes only
		// In production, use proper password hashing like bcrypt
		let hash = 0;
		for (let i = 0; i < password.length; i++) {
			const char = password.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return hash.toString();
	}

	async signUp(credentials: SignUpCredentials): Promise<{ user?: AuthUser; error?: string }> {
		if (!browser) {
			return { error: 'Local authentication not available' };
		}

		try {
			// Check if user already exists
			const existingUser = this.getUserByEmail(credentials.email);
			if (existingUser) {
				return { error: 'User already exists' };
			}

			// Create new user
			const localUser: LocalUser = {
				id: this.generateId(),
				email: credentials.email,
				name: credentials.name || credentials.email.split('@')[0],
				passwordHash: this.simpleHash(credentials.password),
				isProUnlocked: false, // Default to false for new users
				metadata: credentials.metadata || {},
				createdAt: new Date().toISOString()
			};

			this.saveUser(localUser);
			const authUser = this.convertLocalUserToAuthUser(localUser);

			// Auto sign in
			const session = this.createSession(localUser);
			this.setSession(session);

			return { user: authUser };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign up failed' };
		}
	}

	async signIn(credentials: SignInCredentials): Promise<{ session?: AuthSession; error?: string }> {
		if (!browser) {
			return { error: 'Local authentication not available' };
		}

		try {
			const user = this.getUserByEmail(credentials.email);
			if (!user) {
				return { error: 'Invalid credentials' };
			}

			const passwordHash = this.simpleHash(credentials.password);
			if (user.passwordHash !== passwordHash) {
				return { error: 'Invalid credentials' };
			}

			const session = this.createSession(user);
			this.setSession(session);

			return { session };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign in failed' };
		}
	}

	async signOut(): Promise<{ error?: string }> {
		if (!browser) {
			return { error: 'Local authentication not available' };
		}

		try {
			localStorage.removeItem(this.SESSION_KEY);
			this.setSession(null);
			return {};
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign out failed' };
		}
	}

	async getSession(): Promise<AuthSession | null> {
		if (!browser) return null;

		try {
			const sessionData = localStorage.getItem(this.SESSION_KEY);
			if (!sessionData) return null;

			const { userId, expiresAt } = JSON.parse(sessionData);

			if (new Date() >= new Date(expiresAt)) {
				localStorage.removeItem(this.SESSION_KEY);
				return null;
			}

			const user = this.getStoredUser(userId);
			if (!user) {
				localStorage.removeItem(this.SESSION_KEY);
				return null;
			}

			return {
				user: this.convertLocalUserToAuthUser(user),
				expiresAt: new Date(expiresAt)
			};
		} catch (error) {
			console.error('Error getting session:', error);
			return null;
		}
	}

	async refreshSession(): Promise<AuthSession | null> {
		// For local auth, just return current session or null
		return this.getSession();
	}

	async updateUser(
		updates: Partial<Pick<AuthUser, 'name' | 'metadata'>>
	): Promise<{ user?: AuthUser; error?: string }> {
		if (!browser || !this._currentUser) {
			return { error: 'Not authenticated' };
		}

		try {
			const user = this.getStoredUser(this._currentUser.id);
			if (!user) {
				return { error: 'User not found' };
			}

			if (updates.name !== undefined) {
				user.name = updates.name;
			}
			if (updates.metadata !== undefined) {
				user.metadata = { ...user.metadata, ...updates.metadata };
			}

			this.saveUser(user);
			const authUser = this.convertLocalUserToAuthUser(user);

			// Update current session
			this.setSession({
				user: authUser,
				expiresAt: this._currentSession?.expiresAt
			});

			return { user: authUser };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Update failed' };
		}
	}

	async updateProStatus(isProUnlocked: boolean): Promise<{ success: boolean; error?: string }> {
		if (!browser || !this._currentUser) {
			return { success: false, error: 'Not authenticated' };
		}

		try {
			const user = this.getStoredUser(this._currentUser.id);
			if (!user) {
				return { success: false, error: 'User not found' };
			}

			user.isProUnlocked = isProUnlocked;
			this.saveUser(user);

			// Update current session
			const authUser = this.convertLocalUserToAuthUser(user);
			this.setSession({
				user: authUser,
				expiresAt: this._currentSession?.expiresAt
			});

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Pro status update failed'
			};
		}
	}

	cleanup(): void {
		// No specific cleanup needed for local auth
		super.cleanup();
	}
}
