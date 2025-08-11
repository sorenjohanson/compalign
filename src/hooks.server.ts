import type { Handle } from '@sveltejs/kit';

let io: unknown;

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};

// Export for use in API routes if needed
export { io };
