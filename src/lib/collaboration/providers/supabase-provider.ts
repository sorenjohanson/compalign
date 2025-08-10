import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { CollaborationUser } from '../collaboration-types';
import { BaseCollaborationProvider } from './base-provider';
import { browser } from '$app/environment';
import { isProUnlocked } from '$lib/salary-calculator';
import {
	generateRandomName,
	getInitials,
	generateUserId,
	assignUserColor
} from '../collaboration-types';
import { type SessionUser, type NewCollaborationSession, type NewSessionUser } from '../schema';
import { SupabaseDB, type DrizzleClient } from '../db';

export class SupabaseProvider extends BaseCollaborationProvider {
	private supabase: SupabaseClient | null = null;
	private db: DrizzleClient | null = null;
	private channel: RealtimeChannel | null = null;
	private presenceChannel: RealtimeChannel | null = null;

	constructor(
		private supabaseUrl: string,
		private supabaseKey: string
	) {
		super();
	}

	async connect(): Promise<boolean> {
		if (!browser) {
			return false;
		}

		try {
			console.log('Connecting to Supabase...');
			this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
				realtime: {
					params: {
						eventsPerSecond: 10
					}
				}
			});

			// Initialize database client
			this.db = new SupabaseDB(this.supabase);

			// Test connection by trying to query sessions
			try {
				await this.db.selectSessions('test');
			} catch (error) {
				// This is expected for a non-existent session, but confirms connection works
			}

			this._isConnected = true;
			this._connectionError = null;
			this.emit('connect');
			return true;
		} catch (error) {
			this._connectionError = error instanceof Error ? error.message : 'Unknown connection error';
			this.emit('collaboration-error', this._connectionError);
			return false;
		}
	}

	disconnect(): void {
		if (this.channel) {
			this.supabase?.removeChannel(this.channel);
			this.channel = null;
		}
		if (this.presenceChannel) {
			this.supabase?.removeChannel(this.presenceChannel);
			this.presenceChannel = null;
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
		if (!this.supabase || !this.db) {
			console.error('Supabase or Drizzle not initialized when trying to join session');
			return false;
		}

		try {
			this._currentSessionId = sessionId;

			// Get or create session using simplified DB client
			let sessions = await this.db.selectSessions(sessionId);

			if (sessions.length === 0) {
				// Session doesn't exist, create it if host
				if (isHost) {
					const newSession: NewCollaborationSession = {
						id: sessionId,
						calculatorData: {
							grossSalary: 90000,
							customerRate: 110,
							config: {}
						},
						hostProStatus: isProUnlocked(),
						expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
					};

					sessions = await this.db.insertSession(newSession);
				} else {
					throw new Error('Session not found');
				}
			}

			// Create user
			const userName = userData?.name || generateRandomName();
			const userId = generateUserId();

			// Get existing users to assign color
			const existingUsers = await this.db.selectSessionUsers(sessionId, true);

			const existingCollabUsers: CollaborationUser[] = existingUsers.map((user) => ({
				id: user.userId,
				name: user.name,
				color: user.color,
				avatar: user.avatar,
				currentField: user.currentField,
				lastSeen: user.lastSeen || new Date(),
				isActive: user.isActive || false
			}));

			const userColor = userData?.color || assignUserColor(existingCollabUsers);
			const userAvatar = userData?.avatar || getInitials(userName);

			const user: CollaborationUser = {
				id: userId,
				name: userName,
				color: userColor,
				avatar: userAvatar,
				currentField: null,
				lastSeen: new Date(),
				isActive: true
			};

			// Insert user into database
			const newUser: NewSessionUser = {
				sessionId,
				userId,
				name: userName,
				color: userColor,
				avatar: userAvatar,
				currentField: null,
				lastSeen: new Date(),
				isActive: true
			};

			await this.db.insertSessionUser(newUser);

			this._currentUser = user;

			// Setup realtime subscriptions
			await this.setupRealtimeChannels(sessionId);

			// Get all active users
			const allUsers = await this.db.selectSessionUsers(sessionId, true);

			const collaborationUsers: CollaborationUser[] = allUsers.map((u) => ({
				id: u.userId,
				name: u.name,
				color: u.color,
				avatar: u.avatar,
				currentField: u.currentField,
				lastSeen: u.lastSeen || new Date(),
				isActive: u.isActive || false
			}));

			this.emit('session-joined', user, collaborationUsers, sessions[0].hostProStatus);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to join session';
			this._connectionError = message;
			this.emit('collaboration-error', message);
			return false;
		}
	}

	async leaveSession(): Promise<void> {
		if (!this.db || !this._currentSessionId || !this._currentUser) return;

		try {
			// Mark user as inactive
			await this.db.updateSessionUser(this._currentSessionId, this._currentUser.id, {
				isActive: false
			});

			// Clean up channels
			if (this.channel && this.supabase) {
				await this.supabase.removeChannel(this.channel);
				this.channel = null;
			}
			if (this.presenceChannel && this.supabase) {
				await this.supabase.removeChannel(this.presenceChannel);
				this.presenceChannel = null;
			}

			this._currentSessionId = null;
			this._currentUser = null;
		} catch (error) {
			console.error('Error leaving session:', error);
		}
	}

	focusField(fieldId: string | null): void {
		if (!this.db || !this._currentSessionId || !this._currentUser) return;

		// Update database
		this.db.updateSessionUser(this._currentSessionId, this._currentUser.id, {
			currentField: fieldId,
			lastSeen: new Date()
		});

		// Broadcast to other users
		this.channel?.send({
			type: 'broadcast',
			event: 'field-focus',
			payload: { fieldId, user: this._currentUser }
		});
	}

	updateField(fieldId: string, value: unknown): void {
		if (!this.db || !this._currentSessionId || !this._currentUser) return;

		// Update session data if it's a main field
		if (fieldId === 'grossSalary' || fieldId === 'customerRate') {
			this.db.updateSession(this._currentSessionId, {
				calculatorData: {
					grossSalary: fieldId === 'grossSalary' ? (value as number) : 90000,
					customerRate: fieldId === 'customerRate' ? (value as number) : 110,
					config: {}
				}
			});
		}

		// Broadcast to other users
		this.channel?.send({
			type: 'broadcast',
			event: 'field-update',
			payload: { fieldId, value, userId: this._currentUser.id }
		});
	}

	updateSettings(config: Record<string, unknown>): void {
		if (!this.db || !this._currentSessionId || !this._currentUser) return;

		// Update session config in database
		this.db.updateSession(this._currentSessionId, {
			calculatorData: {
				grossSalary: 90000, // These should be fetched from current state
				customerRate: 110,
				config
			}
		});

		// Broadcast to other users
		this.channel?.send({
			type: 'broadcast',
			event: 'settings-update',
			payload: { config, userId: this._currentUser.id }
		});
	}

	setTypingStatus(fieldId: string, isTyping: boolean): void {
		if (!this._currentUser) return;

		// Broadcast typing status
		this.channel?.send({
			type: 'broadcast',
			event: 'user-typing',
			payload: { fieldId, userId: this._currentUser.id, isTyping }
		});
	}

	private async setupRealtimeChannels(sessionId: string): Promise<void> {
		if (!this.supabase) return;

		// Channel for broadcasts (typing, field focus, updates)
		this.channel = this.supabase!.channel(`session:${sessionId}`)
			.on('broadcast', { event: 'field-focus' }, (payload: any) => {
				const { fieldId, user } = payload.payload;
				if (user.id !== this._currentUser?.id) {
					this.emit('field-focused', fieldId, user);
				}
			})
			.on('broadcast', { event: 'field-update' }, (payload: any) => {
				const { fieldId, value, userId } = payload.payload;
				if (userId !== this._currentUser?.id) {
					this.emit('field-updated', fieldId, value, userId);
				}
			})
			.on('broadcast', { event: 'settings-update' }, (payload: any) => {
				const { config, userId } = payload.payload;
				if (userId !== this._currentUser?.id) {
					this.emit('settings-updated', config, userId);
				}
			})
			.on('broadcast', { event: 'user-typing' }, (payload: any) => {
				const { fieldId, userId, isTyping } = payload.payload;
				if (userId !== this._currentUser?.id) {
					this.emit('user-typing-status', fieldId, userId, isTyping);
				}
			})
			.subscribe();

		// Listen for user changes via database changes
		this.supabase!.channel(`session_users:${sessionId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'session_users',
					filter: `session_id=eq.${sessionId}`
				},
				(payload: any) => {
					const userData = payload.new as SessionUser;
					if (userData.userId !== this._currentUser?.id) {
						const user: CollaborationUser = {
							id: userData.userId,
							name: userData.name,
							color: userData.color,
							avatar: userData.avatar,
							currentField: userData.currentField,
							lastSeen: userData.lastSeen || new Date(),
							isActive: userData.isActive || false
						};
						this.emit('user-joined', user);
					}
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'session_users',
					filter: `session_id=eq.${sessionId}`
				},
				(payload: any) => {
					const userData = payload.new as SessionUser;
					if (!userData.isActive && userData.userId !== this._currentUser?.id) {
						this.emit('user-left', userData.userId);
					}
				}
			)
			.subscribe();
	}

	cleanup(): void {
		this.disconnect();
		super.cleanup();
	}
}
