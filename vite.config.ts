import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Socket.IO plugin for Vite
function socketIOPlugin() {
	return {
		name: 'socket-io',
		configureServer(server: any) {
			if (!server.httpServer) return;
			
			// Import and setup Socket.IO server
			import('./src/lib/server/collaboration-server.js').then(({ setupCollaborationServer }) => {
				const io = setupCollaborationServer(server.httpServer);
				console.log('Socket.IO server initialized in development mode');
				
				// Store io instance globally for access in API routes
				(globalThis as any)._socketIO = io;
			}).catch((error: any) => {
				console.error('Failed to setup Socket.IO server:', error);
			});
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), socketIOPlugin()],
	server: {
		allowedHosts: ['.code.soeren.codes']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
