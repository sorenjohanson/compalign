import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { BaseAuthProvider } from './base-provider';
import type { AuthUser, AuthSession, SignUpCredentials, SignInCredentials } from './types';
import { browser } from '$app/environment';

export class SupabaseAuthProvider extends BaseAuthProvider {
	private supabase: SupabaseClient | null = null;

	constructor(
		private supabaseUrl: string,
		private supabaseKey: string
	) {
		super();
	}

	async initialize(): Promise<void> {
		if (!browser) return;

		try {
			this.supabase = createClient(this.supabaseUrl, this.supabaseKey);

			// Set up auth state listener
			this.supabase.auth.onAuthStateChange(async (event, session) => {
				console.log('Supabase auth state change:', event, session?.user?.id);

				if (session?.user) {
					const authUser = this.convertSupabaseUserToAuthUser(session.user);
					const authSession: AuthSession = {
						user: authUser,
						accessToken: session.access_token,
						expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
					};
					this.setSession(authSession);
				} else {
					this.setSession(null);
				}
			});

			// Check for existing session
			const {
				data: { session }
			} = await this.supabase.auth.getSession();
			if (session?.user) {
				const authUser = this.convertSupabaseUserToAuthUser(session.user);
				const authSession: AuthSession = {
					user: authUser,
					accessToken: session.access_token,
					expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
				};
				this.setSession(authSession);
			}
		} catch (error) {
			console.error('Failed to initialize Supabase auth:', error);
			this.emit('auth-error', 'Failed to initialize authentication');
		}
	}

	private convertSupabaseUserToAuthUser(user: User): AuthUser {
		// Use Supabase Auth user metadata directly - no need for separate user_profiles table
		const metadata = user.user_metadata || {};

		return {
			id: user.id,
			email: user.email,
			name: metadata.name || metadata.full_name || user.email?.split('@')[0],
			avatar: metadata.avatar_url || metadata.picture,
			isProUnlocked: metadata.is_pro_unlocked === true,
			metadata: metadata,
			createdAt: user.created_at ? new Date(user.created_at) : undefined,
			lastSignIn: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined
		};
	}

	async signUp(credentials: SignUpCredentials): Promise<{ user?: AuthUser; error?: string }> {
		if (!this.supabase) {
			return { error: 'Authentication not initialized' };
		}

		try {
			const { data, error } = await this.supabase.auth.signUp({
				email: credentials.email,
				password: credentials.password,
				options: {
					data: {
						name: credentials.name,
						is_pro_unlocked: false, // Default to false for new users
						...credentials.metadata
					}
				}
			});

			if (error) {
				return { error: error.message };
			}

			if (data.user) {
				const authUser = this.convertSupabaseUserToAuthUser(data.user);
				return { user: authUser };
			}

			return { error: 'Failed to create user' };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign up failed' };
		}
	}

	async signIn(credentials: SignInCredentials): Promise<{ session?: AuthSession; error?: string }> {
		if (!this.supabase) {
			return { error: 'Authentication not initialized' };
		}

		try {
			const { data, error } = await this.supabase.auth.signInWithPassword({
				email: credentials.email,
				password: credentials.password
			});

			if (error) {
				return { error: error.message };
			}

			if (data.session?.user) {
				const authUser = this.convertSupabaseUserToAuthUser(data.session.user);
				const authSession: AuthSession = {
					user: authUser,
					accessToken: data.session.access_token,
					expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000) : undefined
				};
				return { session: authSession };
			}

			return { error: 'Failed to sign in' };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign in failed' };
		}
	}

	async signOut(): Promise<{ error?: string }> {
		if (!this.supabase) {
			return { error: 'Authentication not initialized' };
		}

		try {
			const { error } = await this.supabase.auth.signOut();
			return error ? { error: error.message } : {};
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Sign out failed' };
		}
	}

	async getSession(): Promise<AuthSession | null> {
		if (!this.supabase) return null;

		try {
			const {
				data: { session }
			} = await this.supabase.auth.getSession();

			if (session?.user) {
				const authUser = this.convertSupabaseUserToAuthUser(session.user);
				return {
					user: authUser,
					accessToken: session.access_token,
					expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
				};
			}

			return null;
		} catch (error) {
			console.error('Error getting session:', error);
			return null;
		}
	}

	async refreshSession(): Promise<AuthSession | null> {
		if (!this.supabase) return null;

		try {
			const {
				data: { session },
				error
			} = await this.supabase.auth.refreshSession();

			if (error) {
				console.error('Error refreshing session:', error);
				return null;
			}

			if (session?.user) {
				const authUser = this.convertSupabaseUserToAuthUser(session.user);
				return {
					user: authUser,
					accessToken: session.access_token,
					expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
				};
			}

			return null;
		} catch (error) {
			console.error('Error refreshing session:', error);
			return null;
		}
	}

	async updateUser(
		updates: Partial<Pick<AuthUser, 'name' | 'metadata'>>
	): Promise<{ user?: AuthUser; error?: string }> {
		if (!this.supabase || !this._currentUser) {
			return { error: 'Not authenticated' };
		}

		try {
			// Update Supabase auth user metadata - this is all we need!
			const { data, error: authError } = await this.supabase.auth.updateUser({
				data: {
					name: updates.name,
					...updates.metadata
				}
			});

			if (authError) {
				return { error: authError.message };
			}

			if (data.user) {
				const authUser = this.convertSupabaseUserToAuthUser(data.user);
				return { user: authUser };
			}

			return { error: 'Failed to update user' };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Update failed' };
		}
	}

	async updateProStatus(isProUnlocked: boolean): Promise<{ success: boolean; error?: string }> {
		if (!this.supabase || !this._currentUser) {
			return { success: false, error: 'Not authenticated' };
		}

		try {
			// Update pro status in Supabase Auth user metadata
			const { data, error } = await this.supabase.auth.updateUser({
				data: {
					...this._currentUser.metadata,
					is_pro_unlocked: isProUnlocked,
					pro_unlocked_at: isProUnlocked ? new Date().toISOString() : null
				}
			});

			if (error) {
				return { success: false, error: error.message };
			}

			// Update current user from the response
			if (data.user) {
				const authUser = this.convertSupabaseUserToAuthUser(data.user);
				this._currentUser = authUser;
				this.emit('user-updated', authUser);
				this.emit('pro-status-changed', isProUnlocked);
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Pro status update failed'
			};
		}
	}

	cleanup(): void {
		// No specific cleanup needed for Supabase auth
		super.cleanup();
	}
}
