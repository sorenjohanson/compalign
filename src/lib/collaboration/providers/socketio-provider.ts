import { io, type Socket } from 'socket.io-client';
import type { SocketEvents, CollaborationUser } from '../collaboration-types';
import { BaseCollaborationProvider } from './base-provider';
import { browser } from '$app/environment';
import { isProUnlocked } from '$lib/salary-calculator';

export class SocketIOProvider extends BaseCollaborationProvider {
	private socket: Socket<SocketEvents> | null = null;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private boundListeners: Partial<Record<keyof SocketEvents, (...args: never[]) => void>> &
		Record<string, (...args: unknown[]) => void> = {};

	async connect(): Promise<boolean> {
		if (!browser || this.socket) {
			return this._isConnected;
		}

		try {
			console.log('Connecting to Socket.IO server...');
			this.socket = io({
				transports: ['websocket', 'polling'],
				autoConnect: false,
				reconnection: true,
				timeout: 10000
			});

			this.setupSocketListeners();
			this.socket.connect();

			return new Promise((resolve) => {
				this.socket!.once('connect', () => {
					this._isConnected = true;
					this._connectionError = null;
					this.emit('connect');
					resolve(true);
				});

				this.socket!.once('connect_error', () => {
					this._isConnected = false;
					this._connectionError = 'Failed to connect to collaboration server';
					this.emit('collaboration-error', this._connectionError);
					resolve(false);
				});
			});
		} catch (err) {
			this._connectionError = err instanceof Error ? err.message : 'Unknown connection error';
			this.emit('collaboration-error', this._connectionError);
			return false;
		}
	}

	disconnect(): void {
		if (this.socket) {
			this.removeAllSocketListeners();
			this.socket.disconnect();
			this.socket = null;
		}
		this._isConnected = false;
		this._currentUser = null;
		this._currentSessionId = null;
		this.emit('disconnect');
	}

	async joinSession(
		sessionId: string,
		userData?: Partial<CollaborationUser>,
		isHost: boolean = false
	): Promise<boolean> {
		if (!this.socket) {
			console.error('Socket not initialized when trying to join session');
			return false;
		}

		this._currentSessionId = sessionId;
		const hostProStatusValue = isHost ? isProUnlocked() : false;

		return new Promise((resolve) => {
			const joinSession = () => {
				this.socket!.emit('join-session', sessionId, userData, hostProStatusValue);
			};

			if (this.socket?.connected) {
				joinSession();
			} else {
				this.socket?.once('connect', joinSession);
			}

			// Listen for successful join
			const onSessionJoined = (
				user: CollaborationUser,
				users: CollaborationUser[],
				hostProStatus: boolean
			) => {
				this._currentUser = user;
				this.emit('session-joined', user, users, hostProStatus);
				this.startHeartbeat();
				cleanup();
				resolve(true);
			};

			const onError = (message: string) => {
				this._connectionError = message;
				this.emit('collaboration-error', message);
				cleanup();
				resolve(false);
			};

			const cleanup = () => {
				this.socket?.off('session-joined', onSessionJoined);
				this.socket?.off('collaboration-error', onError);
			};

			this.socket!.once('session-joined', onSessionJoined);
			this.socket!.once('collaboration-error', onError);
		});
	}

	leaveSession(): void {
		if (!this.socket || !this._currentSessionId) return;

		this.socket.emit('leave-session', this._currentSessionId);
		this._currentSessionId = null;
		this._currentUser = null;
		this.stopHeartbeat();
	}

	focusField(fieldId: string | null): void {
		if (!this.socket || !this._currentSessionId) return;
		this.socket.emit('field-focus', this._currentSessionId, fieldId);
	}

	updateField(fieldId: string, value: unknown): void {
		if (!this.socket || !this._currentSessionId) return;
		this.socket.emit('field-update', this._currentSessionId, fieldId, value);
	}

	updateSettings(config: Record<string, unknown>): void {
		if (!this.socket || !this._currentSessionId) return;
		this.socket.emit('settings-update', this._currentSessionId, config);
	}

	setTypingStatus(fieldId: string, isTyping: boolean): void {
		if (!this.socket || !this._currentSessionId) return;
		this.socket.emit('user-typing', this._currentSessionId, fieldId, isTyping);
	}

	private setupSocketListeners(): void {
		if (!this.socket) return;

		this.removeAllSocketListeners();

		this.boundListeners['connect'] = () => {
			console.log('Connected to collaboration server');
			this._isConnected = true;
			this._connectionError = null;
			this.emit('connect');
		};

		this.boundListeners['disconnect'] = () => {
			console.log('Disconnected from collaboration server');
			this._isConnected = false;
			this.emit('disconnect');
		};

		this.boundListeners['connect_error'] = (...args: unknown[]) => {
			const error = args[0] as Error;
			console.error('Connection error:', error);
			this._isConnected = false;
			this._connectionError = 'Failed to connect to collaboration server';
			this.emit('collaboration-error', this._connectionError);
		};

		this.boundListeners['session-joined'] = (
			user: CollaborationUser,
			users: CollaborationUser[],
			sessionHostProStatus: boolean
		) => {
			console.log(
				'✅ Successfully joined session as:',
				user.name,
				'Session has',
				users.length,
				'total users',
				'Host Pro:',
				sessionHostProStatus
			);
			this._currentUser = user;
			this.emit('session-joined', user, users, sessionHostProStatus);
		};

		this.boundListeners['user-joined'] = (user: CollaborationUser) => {
			console.log('👋 New user joined session:', user.name, 'Color:', user.color);
			this.emit('user-joined', user);
		};

		this.boundListeners['user-left'] = (userId: string) => {
			console.log('User left:', userId);
			this.emit('user-left', userId);
		};

		this.boundListeners['field-focused'] = (fieldId: string | null, user: CollaborationUser) => {
			if (this._currentUser && user.id === this._currentUser.id) return;
			this.emit('field-focused', fieldId, user);
		};

		this.boundListeners['field-updated'] = (fieldId: string, value: unknown, userId: string) => {
			if (this._currentUser && userId === this._currentUser.id) return;
			console.log('Field updated:', fieldId, value, 'by user:', userId);
			this.emit('field-updated', fieldId, value, userId);
		};

		this.boundListeners['settings-updated'] = (config: Record<string, unknown>, userId: string) => {
			console.log('Settings updated by user:', userId, 'Config:', config);
			this.emit('settings-updated', config, userId);
		};

		this.boundListeners['user-typing-status'] = (
			fieldId: string,
			userId: string,
			isTyping: boolean
		) => {
			this.emit('user-typing-status', fieldId, userId, isTyping);
		};

		this.boundListeners['collaboration-error'] = (message: string) => {
			console.error('Collaboration error:', message);
			this._connectionError = message;
			this.emit('collaboration-error', message);
		};

		this.boundListeners['session-terminated'] = () => {
			console.log('Session terminated by host');
			this.emit('session-terminated');
		};

		Object.entries(this.boundListeners).forEach(([event, handler]) => {
			this.socket!.on(event as keyof SocketEvents, handler);
		});
	}

	private removeAllSocketListeners(): void {
		if (!this.socket) return;

		Object.entries(this.boundListeners).forEach(([event, handler]) => {
			this.socket!.off(event as keyof SocketEvents, handler);
		});
		this.boundListeners = {} as Partial<Record<keyof SocketEvents, (...args: never[]) => void>> &
			Record<string, (...args: unknown[]) => void>;
	}

	broadcastSessionTermination(): void {
		if (!this.socket || !this._currentSessionId) return;
		this.socket.emit('terminate-session', this._currentSessionId);
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();
		this.heartbeatInterval = setInterval(() => {
			if (this.socket && this._currentSessionId) {
				this.socket.emit('user-heartbeat', this._currentSessionId);
			}
		}, 30000);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	cleanup(): void {
		this.stopHeartbeat();
		this.removeAllSocketListeners();
		this.disconnect();
		super.cleanup();
	}
}
