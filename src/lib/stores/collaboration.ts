import { writable, derived } from 'svelte/store';
import type { CollaborationUser } from '../collaboration/collaboration-types';
import { browser } from '$app/environment';
import { isProUnlocked } from '$lib/salary-calculator';
import {
	createCollaborationProvider,
	isCollaborationEnabled,
	type CollaborationProvider
} from '../collaboration/providers';

export const isConnected = writable(false);
export const currentUser = writable<CollaborationUser | null>(null);
export const collaborators = writable<CollaborationUser[]>([]);
export const fieldFocuses = writable<Record<string, CollaborationUser>>({});
export const typingUsers = writable<Record<string, string[]>>({});
export const connectionError = writable<string | null>(null);
export const hostProStatus = writable<boolean>(false);

let provider: CollaborationProvider | null = null;

export function initializeCollaboration() {
	if (!browser || provider) {
		console.log('Collaboration already initialized or not in browser');
		return provider;
	}

	if (!isCollaborationEnabled()) {
		console.log('Collaboration features are disabled');
		return null;
	}

	console.log('Initializing collaboration provider...');
	provider = createCollaborationProvider();

	if (!provider) {
		console.log('No collaboration provider available');
		return null;
	}

	setupProviderListeners();
	provider.connect();

	return provider;
}

function setupProviderListeners() {
	if (!provider) return;

	provider.on('connect', () => {
		console.log('Connected to collaboration server');
		isConnected.set(true);
		connectionError.set(null);
	});

	provider.on('disconnect', () => {
		console.log('Disconnected from collaboration server');
		isConnected.set(false);
		collaborators.set([]);
		fieldFocuses.set({});
		typingUsers.set({});
	});

	provider.on('collaboration-error', (message) => {
		console.error('Collaboration error:', message);
		isConnected.set(false);
		connectionError.set(message);
	});

	provider.on('session-joined', (user, users, sessionHostProStatus) => {
		console.log(
			'✅ Successfully joined session as:',
			user.name,
			'Session has',
			users.length,
			'total users',
			'Host Pro:',
			sessionHostProStatus
		);
		currentUser.set(user);
		collaborators.set(users.filter((u) => u.id !== user.id));
		hostProStatus.set(sessionHostProStatus);
	});

	provider.on('user-joined', (user) => {
		console.log('👋 New user joined session:', user.name, 'Color:', user.color);
		collaborators.update((users) => {
			const existing = users.find((u) => u.id === user.id);
			if (existing) {
				return users.map((u) => (u.id === user.id ? user : u));
			} else {
				return [...users, user];
			}
		});
	});

	provider.on('user-left', (userId) => {
		console.log('User left:', userId);
		collaborators.update((users) => users.filter((u) => u.id !== userId));

		fieldFocuses.update((focuses) => {
			const updated = { ...focuses };
			Object.keys(updated).forEach((fieldId) => {
				if (updated[fieldId].id === userId) {
					delete updated[fieldId];
				}
			});
			return updated;
		});

		typingUsers.update((typing) => {
			const updated = { ...typing };
			Object.keys(updated).forEach((fieldId) => {
				updated[fieldId] = updated[fieldId].filter((id) => id !== userId);
				if (updated[fieldId].length === 0) {
					delete updated[fieldId];
				}
			});
			return updated;
		});
	});

	provider.on('field-focused', (fieldId, user) => {
		fieldFocuses.update((focuses) => {
			const updated = { ...focuses };

			Object.keys(updated).forEach((key) => {
				if (updated[key].id === user.id) {
					delete updated[key];
				}
			});

			if (fieldId) {
				updated[fieldId] = user;
			}

			return updated;
		});
	});

	provider.on('field-updated', (fieldId, value, userId) => {
		console.log('Field updated:', fieldId, value, 'by user:', userId);

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('collaboration-field-update', {
					detail: { fieldId, value, userId }
				})
			);
		}
	});

	provider.on('settings-updated', (config, userId) => {
		console.log('Settings updated by user:', userId, 'Config:', config);
	});

	provider.on('user-typing-status', (fieldId, userId, isTyping) => {
		typingUsers.update((typing) => {
			const updated = { ...typing };

			if (isTyping) {
				if (!updated[fieldId]) {
					updated[fieldId] = [];
				}
				if (!updated[fieldId].includes(userId)) {
					updated[fieldId].push(userId);
				}
			} else {
				if (updated[fieldId]) {
					updated[fieldId] = updated[fieldId].filter((id) => id !== userId);
					if (updated[fieldId].length === 0) {
						delete updated[fieldId];
					}
				}
			}

			return updated;
		});
	});
}

export async function joinSession(
	sessionId: string,
	userData?: Partial<CollaborationUser>,
	isHost: boolean = false
): Promise<boolean> {
	if (!provider) {
		console.error('Provider not initialized when trying to join session');
		return false;
	}

	console.log(
		'Attempting to join session:',
		sessionId,
		'Provider connected:',
		provider.isConnected,
		'Is host:',
		isHost
	);

	return provider.joinSession(sessionId, userData, isHost);
}

export function leaveSession() {
	if (!provider) return;

	provider.leaveSession();
	currentUser.set(null);
	collaborators.set([]);
	fieldFocuses.set({});
	typingUsers.set({});
	hostProStatus.set(false);
}

export function focusField(fieldId: string | null) {
	if (!provider) return;
	provider.focusField(fieldId);
}

export function updateField(fieldId: string, value: unknown) {
	if (!provider) return;
	provider.updateField(fieldId, value);
}

export function updateSettings(config: Record<string, unknown>) {
	if (!provider) return;
	provider.updateSettings(config);
}

export function setTypingStatus(fieldId: string, isTyping: boolean) {
	if (!provider) return;
	provider.setTypingStatus(fieldId, isTyping);
}

export const totalUsers = derived([currentUser, collaborators], ([current, collaborators]) =>
	current ? [current, ...collaborators] : collaborators
);

export const isInSession = derived(
	[currentUser, isConnected],
	([user, connected]) => !!(user && connected)
);

export const effectiveProStatus = derived([hostProStatus], ([hostPro]) => {
	let localPro = false;
	if (browser) {
		localPro = isProUnlocked();
	}
	console.log(
		'Effective Pro Status - Local:',
		localPro,
		'Host:',
		hostPro,
		'Result:',
		localPro || hostPro
	);
	return localPro || hostPro;
});

export function disconnectCollaboration() {
	if (provider) {
		provider.cleanup();
		provider = null;
	}

	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem('collaboration-session-id');
	}

	isConnected.set(false);
	currentUser.set(null);
	collaborators.set([]);
	fieldFocuses.set({});
	typingUsers.set({});
	connectionError.set(null);
	hostProStatus.set(false);
}
