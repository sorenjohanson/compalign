import type { CollaborationUser } from '../collaboration-types';

export interface CollaborationEvents {
	connect: () => void;
	disconnect: () => void;
	'session-joined': (
		user: CollaborationUser,
		users: CollaborationUser[],
		hostProStatus: boolean
	) => void;
	'user-joined': (user: CollaborationUser) => void;
	'user-left': (userId: string) => void;
	'session-terminated': () => void;
	'field-focused': (fieldId: string | null, user: CollaborationUser) => void;
	'field-updated': (fieldId: string, value: unknown, userId: string) => void;
	'settings-updated': (config: Record<string, unknown>, userId: string) => void;
	'user-typing-status': (fieldId: string, userId: string, isTyping: boolean) => void;
	'collaboration-error': (message: string) => void;
}

export type EventCallback<T extends keyof CollaborationEvents> = CollaborationEvents[T];

export interface CollaborationProvider {
	readonly isConnected: boolean;
	readonly currentUser: CollaborationUser | null;
	readonly connectionError: string | null;

	connect(): Promise<boolean>;
	disconnect(): void;

	joinSession(
		sessionId: string,
		userData?: Partial<CollaborationUser>,
		isHost?: boolean
	): Promise<boolean>;
	leaveSession(): void;

	focusField(fieldId: string | null): void;
	updateField(fieldId: string, value: unknown): void;
	updateSettings(config: Record<string, unknown>): void;
	setTypingStatus(fieldId: string, isTyping: boolean): void;
	broadcastSessionTermination(): void;

	on<T extends keyof CollaborationEvents>(event: T, callback: EventCallback<T>): void;
	off<T extends keyof CollaborationEvents>(event: T, callback: EventCallback<T>): void;

	cleanup(): void;
}

export abstract class BaseCollaborationProvider implements CollaborationProvider {
	protected _isConnected = false;
	protected _currentUser: CollaborationUser | null = null;
	protected _connectionError: string | null = null;
	protected _eventListeners = new Map<keyof CollaborationEvents, Set<Function>>();
	protected _currentSessionId: string | null = null;

	get isConnected(): boolean {
		return this._isConnected;
	}

	get currentUser(): CollaborationUser | null {
		return this._currentUser;
	}

	get connectionError(): string | null {
		return this._connectionError;
	}

	protected emit<T extends keyof CollaborationEvents>(
		event: T,
		...args: Parameters<CollaborationEvents[T]>
	): void {
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					// @ts-ignore - TypeScript has trouble with spread args here
					callback(...args);
				} catch (error) {
					console.error(`Error in ${event} event listener:`, error);
				}
			});
		}
	}

	on<T extends keyof CollaborationEvents>(event: T, callback: EventCallback<T>): void {
		if (!this._eventListeners.has(event)) {
			this._eventListeners.set(event, new Set());
		}
		this._eventListeners.get(event)!.add(callback);
	}

	off<T extends keyof CollaborationEvents>(event: T, callback: EventCallback<T>): void {
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			listeners.delete(callback);
		}
	}

	abstract connect(): Promise<boolean>;
	abstract disconnect(): void;
	abstract joinSession(
		sessionId: string,
		userData?: Partial<CollaborationUser>,
		isHost?: boolean
	): Promise<boolean>;
	abstract leaveSession(): void;
	abstract focusField(fieldId: string | null): void;
	abstract updateField(fieldId: string, value: unknown): void;
	abstract updateSettings(config: Record<string, unknown>): void;
	abstract setTypingStatus(fieldId: string, isTyping: boolean): void;
	abstract broadcastSessionTermination(): void;

	cleanup(): void {
		this._eventListeners.clear();
		this._currentUser = null;
		this._currentSessionId = null;
		this._isConnected = false;
		this._connectionError = null;
	}
}
