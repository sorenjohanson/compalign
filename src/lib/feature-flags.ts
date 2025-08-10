import { dev } from '$app/environment';
import {
	isCollaborationEnabled as providerIsCollaborationEnabled,
	getCollaborationMode
} from './collaboration/providers';

interface FeatureFlags {
	/** Enable real-time collaboration features including WebSocket connections and shared sessions */
	COLLABORATION_ENABLED: boolean;
	/** Enable API endpoints for sharing and collaboration */
	COLLABORATION_API_ENABLED: boolean;
	/** Enable Socket.IO server initialization (legacy) */
	SOCKET_IO_ENABLED: boolean;
}

function getFeatureFlags(): FeatureFlags {
	// Use the new provider-based collaboration system
	const collaborationEnabled = providerIsCollaborationEnabled();
	const collaborationMode = getCollaborationMode();

	if (dev) {
		return {
			COLLABORATION_ENABLED: collaborationEnabled,
			COLLABORATION_API_ENABLED: collaborationEnabled,
			SOCKET_IO_ENABLED: collaborationMode === 'local'
		};
	}

	// In production, use provider configuration with legacy fallback
	const legacyCollaboration = process.env.ENABLE_COLLABORATION === 'true';
	const legacySocketIO = process.env.ENABLE_SOCKET_IO === 'true';

	return {
		COLLABORATION_ENABLED: collaborationEnabled || legacyCollaboration,
		COLLABORATION_API_ENABLED:
			collaborationEnabled || process.env.ENABLE_COLLABORATION_API === 'true',
		SOCKET_IO_ENABLED: collaborationMode === 'local' || legacySocketIO
	};
}

export const featureFlags = getFeatureFlags();

export function isCollaborationEnabled(): boolean {
	// Delegate to the provider system
	return providerIsCollaborationEnabled();
}

export function isCollaborationApiEnabled(): boolean {
	return featureFlags.COLLABORATION_API_ENABLED;
}

export function isSocketIOEnabled(): boolean {
	return featureFlags.SOCKET_IO_ENABLED;
}
