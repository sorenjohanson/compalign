import { dev } from '$app/environment';

interface FeatureFlags {
	/** Enable real-time collaboration features including WebSocket connections and shared sessions */
	COLLABORATION_ENABLED: boolean;
	/** Enable API endpoints for sharing and collaboration */
	COLLABORATION_API_ENABLED: boolean;
	/** Enable Socket.IO server initialization */
	SOCKET_IO_ENABLED: boolean;
}

function getFeatureFlags(): FeatureFlags {
	if (dev) {
		return {
			COLLABORATION_ENABLED: true,
			COLLABORATION_API_ENABLED: true,
			SOCKET_IO_ENABLED: true
		};
	}

	// In production, check environment variables with safe defaults (disabled)
	return {
		COLLABORATION_ENABLED: process.env.ENABLE_COLLABORATION === 'true',
		COLLABORATION_API_ENABLED: process.env.ENABLE_COLLABORATION_API === 'true',
		SOCKET_IO_ENABLED: process.env.ENABLE_SOCKET_IO === 'true'
	};
}

export const featureFlags = getFeatureFlags();

export function isCollaborationEnabled(): boolean {
	return featureFlags.COLLABORATION_ENABLED;
}

export function isCollaborationApiEnabled(): boolean {
	return featureFlags.COLLABORATION_API_ENABLED;
}

export function isSocketIOEnabled(): boolean {
	return featureFlags.SOCKET_IO_ENABLED;
}
