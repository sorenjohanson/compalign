export interface AuthUser {
	id: string;
	email?: string;
	name?: string;
	avatar?: string;
	isProUnlocked: boolean;
	metadata?: Record<string, unknown>;
	createdAt?: Date;
	lastSignIn?: Date;
}

export interface AuthSession {
	user: AuthUser;
	accessToken?: string;
	expiresAt?: Date;
}

export type AuthMode = 'local' | 'supabase' | 'disabled';

export interface AuthEvents {
	'auth-state-change': (session: AuthSession | null) => void;
	'user-updated': (user: AuthUser) => void;
	'pro-status-changed': (isProUnlocked: boolean) => void;
	'auth-error': (error: string) => void;
}

export type AuthEventCallback<T extends keyof AuthEvents> = AuthEvents[T];

export interface SignInCredentials {
	email: string;
	password: string;
}

export interface SignUpCredentials extends SignInCredentials {
	name?: string;
	metadata?: Record<string, unknown>;
}

export interface AuthProvider {
	readonly currentUser: AuthUser | null;
	readonly currentSession: AuthSession | null;
	readonly isAuthenticated: boolean;

	// Core auth methods
	signUp(credentials: SignUpCredentials): Promise<{ user?: AuthUser; error?: string }>;
	signIn(credentials: SignInCredentials): Promise<{ session?: AuthSession; error?: string }>;
	signOut(): Promise<{ error?: string }>;

	// Session management
	getSession(): Promise<AuthSession | null>;
	refreshSession(): Promise<AuthSession | null>;

	// User management
	updateUser(
		updates: Partial<Pick<AuthUser, 'name' | 'metadata'>>
	): Promise<{ user?: AuthUser; error?: string }>;
	updateProStatus(isProUnlocked: boolean): Promise<{ success: boolean; error?: string }>;

	// Event handling
	on<T extends keyof AuthEvents>(event: T, callback: AuthEventCallback<T>): void;
	off<T extends keyof AuthEvents>(event: T, callback: AuthEventCallback<T>): void;

	// Lifecycle
	initialize(): Promise<void>;
	cleanup(): void;
}
