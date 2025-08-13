import type { CollaborationProvider } from './base-provider';
import { SocketIOProvider } from './socketio-provider';
import { SupabaseProvider } from './supabase-provider';
import { dev } from '$app/environment';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_COLLABORATION_MODE
} from '$env/static/public';

export type CollaborationMode = 'local' | 'supabase' | 'disabled';

export interface CollaborationConfig {
	mode: CollaborationMode;
	supabase?: {
		url: string;
		key: string;
	};
}

function getCollaborationConfig(): CollaborationConfig {
	if (dev) {
		const supabaseUrl = PUBLIC_SUPABASE_URL;
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

		if (supabaseUrl && supabaseKey) {
			return {
				mode: 'supabase',
				supabase: {
					url: supabaseUrl,
					key: supabaseKey
				}
			};
		}

		return { mode: 'local' };
	}

	// In production, check environment variables to determine mode
	const collaborationMode = PUBLIC_COLLABORATION_MODE as CollaborationMode | undefined;
	const supabaseUrl = PUBLIC_SUPABASE_URL;
	const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

	if (supabaseUrl && supabaseKey) {
		return {
			mode: collaborationMode === 'disabled' ? 'disabled' : 'supabase',
			supabase: {
				url: supabaseUrl,
				key: supabaseKey
			}
		};
	}

	if (collaborationMode === 'local') {
		return { mode: 'local' };
	}

	return { mode: 'disabled' };
}

export function createCollaborationProvider(): CollaborationProvider | null {
	const config = getCollaborationConfig();

	switch (config.mode) {
		case 'local':
			console.log('🔌 Using Socket.IO collaboration provider (local mode)');
			return new SocketIOProvider();

		case 'supabase':
			if (!config.supabase) {
				console.error('Supabase configuration missing for supabase mode');
				return null;
			}
			console.log('🔌 Using Supabase collaboration provider (hosted mode)');
			return new SupabaseProvider(config.supabase.url, config.supabase.key);

		case 'disabled':
			console.log('🔌 Collaboration is disabled');
			return null;

		default:
			console.warn('Unknown collaboration mode:', config.mode);
			return null;
	}
}

export function isCollaborationEnabled(): boolean {
	const config = getCollaborationConfig();
	return config.mode !== 'disabled';
}

export function getCollaborationMode(): CollaborationMode {
	return getCollaborationConfig().mode;
}
