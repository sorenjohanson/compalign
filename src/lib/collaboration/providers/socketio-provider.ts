import { io, type Socket } from 'socket.io-client';
import type { SocketEvents, CollaborationUser } from '../collaboration-types';
import { BaseCollaborationProvider } from './base-provider';
import { browser } from '$app/environment';
import { isProUnlocked } from '$lib/salary-calculator';

export class SocketIOProvider extends BaseCollaborationProvider {
	private socket: Socket<SocketEvents> | null = null;

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

				this.socket!.once('connect_error', (error) => {
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
				resolve(true);
			};

			const onError = (message: string) => {
				this._connectionError = message;
				this.emit('collaboration-error', message);
				resolve(false);
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

		this.socket.on('connect', () => {
			console.log('Connected to collaboration server');
			this._isConnected = true;
			this._connectionError = null;
			this.emit('connect');
		});

		this.socket.on('disconnect', () => {
			console.log('Disconnected from collaboration server');
			this._isConnected = false;
			this.emit('disconnect');
		});

		this.socket.on('connect_error', (error) => {
			console.error('Connection error:', error);
			this._isConnected = false;
			this._connectionError = 'Failed to connect to collaboration server';
			this.emit('collaboration-error', this._connectionError);
		});

		this.socket.on('session-joined', (user, users, sessionHostProStatus) => {
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
		});

		this.socket.on('user-joined', (user) => {
			console.log('👋 New user joined session:', user.name, 'Color:', user.color);
			this.emit('user-joined', user);
		});

		this.socket.on('user-left', (userId) => {
			console.log('User left:', userId);
			this.emit('user-left', userId);
		});

		this.socket.on('field-focused', (fieldId, user) => {
			if (this._currentUser && user.id === this._currentUser.id) return;
			this.emit('field-focused', fieldId, user);
		});

		this.socket.on('field-updated', (fieldId, value, userId) => {
			if (this._currentUser && userId === this._currentUser.id) return;
			console.log('Field updated:', fieldId, value, 'by user:', userId);
			this.emit('field-updated', fieldId, value, userId);
		});

		this.socket.on('settings-updated', (config, userId) => {
			console.log('Settings updated by user:', userId, 'Config:', config);
			this.emit('settings-updated', config, userId);
		});

		this.socket.on('user-typing-status', (fieldId, userId, isTyping) => {
			this.emit('user-typing-status', fieldId, userId, isTyping);
		});

		this.socket.on('collaboration-error', (message) => {
			console.error('Collaboration error:', message);
			this._connectionError = message;
			this.emit('collaboration-error', message);
		});
	}

	cleanup(): void {
		this.disconnect();
		super.cleanup();
	}
}
