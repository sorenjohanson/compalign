import {
	pgTable,
	text,
	jsonb,
	boolean,
	timestamp,
	serial,
	index,
	unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const collaborationSessions = pgTable(
	'collaboration_sessions',
	{
		id: text('id').primaryKey(),
		calculatorData: jsonb('calculator_data').notNull().default({
			grossSalary: 90000,
			customerRate: 110,
			config: {}
		}),
		hostProStatus: boolean('host_pro_status').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(table) => [index('idx_collaboration_sessions_expires_at').on(table.expiresAt)]
);

export const sessionUsers = pgTable(
	'session_users',
	{
		id: serial('id').primaryKey(),
		sessionId: text('session_id')
			.notNull()
			.references(() => collaborationSessions.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		name: text('name').notNull(),
		color: text('color').notNull(),
		avatar: text('avatar').notNull(),
		currentField: text('current_field'),
		lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
		isActive: boolean('is_active').default(true),
		joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow()
	},
	(table) => [
		index('idx_session_users_session_id').on(table.sessionId),
		index('idx_session_users_active').on(table.sessionId, table.isActive),
		index('idx_session_users_last_seen').on(table.lastSeen),
		unique('unique_session_user').on(table.sessionId, table.userId)
	]
);

// Note: User profiles and pro status are stored in Supabase Auth user metadata
// No need for a separate user_profiles table since auth.users.user_metadata handles this

export const collaborationSessionsRelations = relations(collaborationSessions, ({ many }) => ({
	users: many(sessionUsers)
}));

export const sessionUsersRelations = relations(sessionUsers, ({ one }) => ({
	session: one(collaborationSessions, {
		fields: [sessionUsers.sessionId],
		references: [collaborationSessions.id]
	})
}));

export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type NewCollaborationSession = typeof collaborationSessions.$inferInsert;
export type SessionUser = typeof sessionUsers.$inferSelect;
export type NewSessionUser = typeof sessionUsers.$inferInsert;
