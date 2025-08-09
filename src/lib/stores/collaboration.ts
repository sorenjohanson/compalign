import { writable, derived, get } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import type { 
	CollaborationUser, 
	SocketEvents 
} from '../collaboration-types';
import { browser } from '$app/environment';
import { isProUnlocked } from '$lib/salary-calculator';

export const isConnected = writable(false);
export const currentUser = writable<CollaborationUser | null>(null);
export const collaborators = writable<CollaborationUser[]>([]);
export const fieldFocuses = writable<Record<string, CollaborationUser>>({});
export const typingUsers = writable<Record<string, string[]>>({});
export const connectionError = writable<string | null>(null);
export const hostProStatus = writable<boolean>(false);

let socket: Socket<SocketEvents> | null = null;
let currentSessionId: string | null = null;

export function initializeCollaboration() {
	if (!browser || socket) {
		console.log('Collaboration already initialized or not in browser');
		return socket;
	}

	console.log('Initializing Socket.IO client...');
	socket = io({
		transports: ['websocket', 'polling'],
		autoConnect: false,
		reconnection: true,
		timeout: 10000
	});

	socket.connect();

	socket.on('connect', () => {
		console.log('Connected to collaboration server');
		isConnected.set(true);
		connectionError.set(null);
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from collaboration server');
		isConnected.set(false);
		collaborators.set([]);
		fieldFocuses.set({});
		typingUsers.set({});
	});

	socket.on('connect_error', (error) => {
		console.error('Connection error:', error);
		isConnected.set(false);
		connectionError.set('Failed to connect to collaboration server');
	});

	socket.on('session-joined', (user, users, sessionHostProStatus) => {
		console.log('✅ Successfully joined session as:', user.name, 'Session has', users.length, 'total users', 'Host Pro:', sessionHostProStatus);
		currentUser.set(user);
		collaborators.set(users.filter(u => u.id !== user.id));
		hostProStatus.set(sessionHostProStatus);
	});

	socket.on('user-joined', (user) => {
		console.log('👋 New user joined session:', user.name, 'Color:', user.color);
		collaborators.update(users => {
			const existing = users.find(u => u.id === user.id);
			if (existing) {
				return users.map(u => u.id === user.id ? user : u);
			} else {
				return [...users, user];
			}
		});
	});

	socket.on('user-left', (userId) => {
		console.log('User left:', userId);
		collaborators.update(users => users.filter(u => u.id !== userId));
		
		fieldFocuses.update(focuses => {
			const updated = { ...focuses };
			Object.keys(updated).forEach(fieldId => {
				if (updated[fieldId].id === userId) {
					delete updated[fieldId];
				}
			});
			return updated;
		});

		typingUsers.update(typing => {
			const updated = { ...typing };
			Object.keys(updated).forEach(fieldId => {
				updated[fieldId] = updated[fieldId].filter(id => id !== userId);
				if (updated[fieldId].length === 0) {
					delete updated[fieldId];
				}
			});
			return updated;
		});
	});

	socket.on('field-focused', (fieldId, user) => {
		const currentUserData = get(currentUser);
		if (currentUserData && user.id === currentUserData.id) return;
		
		fieldFocuses.update(focuses => {
			const updated = { ...focuses };
			
			Object.keys(updated).forEach(key => {
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

	socket.on('field-updated', (fieldId, value, userId) => {
		const currentUserData = get(currentUser);
		if (currentUserData && userId === currentUserData.id) return;
		
		console.log('Field updated:', fieldId, value, 'by user:', userId);
		
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('collaboration-field-update', {
				detail: { fieldId, value, userId }
			}));
		}
	});

	socket.on('settings-updated', (config, userId) => {
		console.log('Settings updated by user:', userId, 'Config:', config);
	});

	socket.on('user-typing-status', (fieldId, userId, isTyping) => {
		typingUsers.update(typing => {
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
					updated[fieldId] = updated[fieldId].filter(id => id !== userId);
					if (updated[fieldId].length === 0) {
						delete updated[fieldId];
					}
				}
			}
			
			return updated;
		});
	});

	socket.on('collaboration-error', (message) => {
		console.error('Collaboration error:', message);
		connectionError.set(message);
	});

	return socket;
}

export function joinSession(sessionId: string, userData?: Partial<CollaborationUser>, isHost: boolean = false) {
	if (!socket) {
		console.error('Socket not initialized when trying to join session');
		return false;
	}
	
	console.log('Attempting to join session:', sessionId, 'Socket connected:', socket.connected, 'Is host:', isHost);
	currentSessionId = sessionId;
	
	const hostProStatusValue = isHost ? isProUnlocked() : false;
	console.log('Host Pro status:', hostProStatusValue, 'isHost:', isHost);
	
	if (socket.connected) {
		socket.emit('join-session', sessionId, userData, hostProStatusValue);
	} else {
		socket.once('connect', () => {
			console.log('Socket connected, now joining session:', sessionId);
			socket!.emit('join-session', sessionId, userData, hostProStatusValue);
		});
	}
	
	return true;
}

export function leaveSession() {
	if (!socket || !currentSessionId) return;
	
	socket.emit('leave-session', currentSessionId);
	currentSessionId = null;
	currentUser.set(null);
	collaborators.set([]);
	fieldFocuses.set({});
	typingUsers.set({});
	hostProStatus.set(false);
}

export function focusField(fieldId: string | null) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('field-focus', currentSessionId, fieldId);
}

export function updateField(fieldId: string, value: any) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('field-update', currentSessionId, fieldId, value);
}

export function updateSettings(config: any) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('settings-update', currentSessionId, config);
}

export function setTypingStatus(fieldId: string, isTyping: boolean) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('user-typing', currentSessionId, fieldId, isTyping);
}

export const totalUsers = derived(
	[currentUser, collaborators],
	([current, collaborators]) => current ? [current, ...collaborators] : collaborators
);

export const isInSession = derived(
	[currentUser, isConnected],
	([user, connected]) => !!(user && connected)
);

export const effectiveProStatus = derived(
	[hostProStatus],
	([hostPro]) => {
		let localPro = false;
		if (browser) {
			localPro = isProUnlocked();
		}
		console.log('Effective Pro Status - Local:', localPro, 'Host:', hostPro, 'Result:', localPro || hostPro);
		return localPro || hostPro;
	}
);

export function disconnectCollaboration() {
	if (socket) {
		socket.disconnect();
		socket = null;
		currentSessionId = null;
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