import { dev } from '$app/environment';
import { isCollaborationEnabled as providerIsCollaborationEnabled } from './collaboration/providers';

interface FeatureFlags {
	/** Enable real-time collaboration features including WebSocket connections and shared sessions */
	COLLABORATION_ENABLED: boolean;
	/** Enable API endpoints for sharing and collaboration */
	COLLABORATION_API_ENABLED: boolean;
}

function getFeatureFlags(): FeatureFlags {
	// Use the new provider-based collaboration system
	const collaborationEnabled = providerIsCollaborationEnabled();

	if (dev) {
		return {
			COLLABORATION_ENABLED: collaborationEnabled,
			COLLABORATION_API_ENABLED: collaborationEnabled
		};
	}

	return {
		COLLABORATION_ENABLED: collaborationEnabled,
		COLLABORATION_API_ENABLED: collaborationEnabled
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
