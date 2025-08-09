import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Socket.IO plugin for Vite
function socketIOPlugin() {
	return {
		name: 'socket-io',
		configureServer(server: import('vite').ViteDevServer) {
			if (!server.httpServer) return;

			// Only initialize Socket.IO when explicitly enabled via env var
			const shouldEnableSocketIO = process.env.ENABLE_SOCKET_IO === 'true';
			if (!shouldEnableSocketIO) {
				console.log('Socket.IO is disabled via ENABLE_SOCKET_IO env var');
				return;
			}

			import('./src/lib/server/collaboration-server.js')
				.then(({ setupCollaborationServer }) => {
					// Cast to any to avoid complex HTTP server type issues in development
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const io = setupCollaborationServer(server.httpServer as any);
					console.log('Socket.IO server initialized in development mode');

					(globalThis as { _socketIO?: unknown })._socketIO = io;
				})
				.catch((error: unknown) => {
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
