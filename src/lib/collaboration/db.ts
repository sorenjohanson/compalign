import type { SupabaseClient } from '@supabase/supabase-js';
import {
	collaborationSessions,
	sessionUsers,
	type CollaborationSession,
	type SessionUser,
	type NewCollaborationSession,
	type NewSessionUser
} from './schema';
import { eq, and } from 'drizzle-orm';

// Simplified database operations using Supabase client directly
// This avoids the complexity of setting up Drizzle with Supabase's client-side approach
export class SupabaseDB {
	constructor(private supabase: SupabaseClient) {}

	async selectSessions(sessionId: string): Promise<CollaborationSession[]> {
		const { data, error } = await this.supabase
			.from('collaboration_sessions')
			.select('*')
			.eq('id', sessionId);

		if (error) throw error;
		return data.map((row) => ({
			id: row.id,
			calculatorData: row.calculator_data,
			hostProStatus: row.host_pro_status,
			createdAt: row.created_at,
			expiresAt: row.expires_at,
			updatedAt: row.updated_at
		}));
	}

	async insertSession(session: NewCollaborationSession): Promise<CollaborationSession[]> {
		const { data, error } = await this.supabase
			.from('collaboration_sessions')
			.insert({
				id: session.id,
				calculator_data: session.calculatorData,
				host_pro_status: session.hostProStatus,
				expires_at: session.expiresAt?.toISOString()
			})
			.select();

		if (error) throw error;
		return data.map((row) => ({
			id: row.id,
			calculatorData: row.calculator_data,
			hostProStatus: row.host_pro_status,
			createdAt: row.created_at,
			expiresAt: row.expires_at,
			updatedAt: row.updated_at
		}));
	}

	async selectSessionUsers(sessionId: string, isActive: boolean = true): Promise<SessionUser[]> {
		const { data, error } = await this.supabase
			.from('session_users')
			.select('*')
			.eq('session_id', sessionId)
			.eq('is_active', isActive);

		if (error) throw error;
		return data.map((row) => ({
			id: row.id,
			sessionId: row.session_id,
			userId: row.user_id,
			name: row.name,
			color: row.color,
			avatar: row.avatar,
			currentField: row.current_field,
			lastSeen: row.last_seen ? new Date(row.last_seen) : null,
			isActive: row.is_active,
			joinedAt: row.joined_at ? new Date(row.joined_at) : null
		}));
	}

	async insertSessionUser(user: NewSessionUser): Promise<void> {
		const { error } = await this.supabase.from('session_users').insert({
			session_id: user.sessionId,
			user_id: user.userId,
			name: user.name,
			color: user.color,
			avatar: user.avatar,
			current_field: user.currentField,
			last_seen: user.lastSeen?.toISOString(),
			is_active: user.isActive
		});

		if (error) throw error;
	}

	async updateSessionUser(
		sessionId: string,
		userId: string,
		updates: Partial<Pick<SessionUser, 'isActive' | 'currentField' | 'lastSeen'>>
	): Promise<void> {
		const updateData: any = {};
		if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
		if (updates.currentField !== undefined) updateData.current_field = updates.currentField;
		if (updates.lastSeen !== undefined) updateData.last_seen = updates.lastSeen.toISOString();

		const { error } = await this.supabase
			.from('session_users')
			.update(updateData)
			.eq('session_id', sessionId)
			.eq('user_id', userId);

		if (error) throw error;
	}

	async updateSession(
		sessionId: string,
		updates: Partial<Pick<CollaborationSession, 'calculatorData'>>
	): Promise<void> {
		const updateData: any = {};
		if (updates.calculatorData !== undefined) updateData.calculator_data = updates.calculatorData;

		const { error } = await this.supabase
			.from('collaboration_sessions')
			.update(updateData)
			.eq('id', sessionId);

		if (error) throw error;
	}
}

export type DrizzleClient = SupabaseDB;
