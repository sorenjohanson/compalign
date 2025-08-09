import { dev } from '$app/environment';
import { setupCollaborationServer } from '$lib/server/collaboration-server.js';
import { isSocketIOEnabled } from '$lib/feature-flags.js';
import type { Handle } from '@sveltejs/kit';

let io: any;

if (dev) {
	console.log('Development mode: Socket.IO will be set up via Vite plugin');
} else if (isSocketIOEnabled()) {
	console.log('Production mode: Socket.IO server ready');
} else {
	console.log('Socket.IO is disabled in production via feature flags');
}

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};

// Export for use in API routes if needed
export { io };
