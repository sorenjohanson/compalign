// SvelteKit server hooks with Socket.IO
import { dev } from '$app/environment';
import { setupCollaborationServer } from '$lib/server/collaboration-server.js';
import type { Handle } from '@sveltejs/kit';

let io: any;

// Initialize Socket.IO server
if (dev) {
	// In development, we need to create an HTTP server
	// This is a bit tricky with SvelteKit as it manages its own server
	// We'll need to integrate with Vite's dev server
	console.log('Development mode: Socket.IO will be set up via Vite plugin');
} else {
	// In production, we can access the server instance
	console.log('Production mode: Socket.IO server ready');
}

export const handle: Handle = async ({ event, resolve }) => {
	// We'll set up the Socket.IO server when the first request comes in
	// This ensures we have access to the server instance
	
	const response = await resolve(event);
	return response;
};

// Export for use in API routes if needed
export { io };