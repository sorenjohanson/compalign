// Client-side collaboration store
import { writable, derived, get } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import type { 
	CollaborationUser, 
	FieldFocus, 
	SocketEvents 
} from '../collaboration-types.js';
import { generateUserId } from '../collaboration-types.js';
import { browser } from '$app/environment';

// Collaboration state
export const isConnected = writable(false);
export const currentUser = writable<CollaborationUser | null>(null);
export const collaborators = writable<CollaborationUser[]>([]);
export const fieldFocuses = writable<Record<string, CollaborationUser>>({});
export const typingUsers = writable<Record<string, string[]>>({});
export const connectionError = writable<string | null>(null);

// Socket instance
let socket: Socket<SocketEvents> | null = null;
let currentSessionId: string | null = null;

// Initialize Socket.IO connection
export function initializeCollaboration() {
	if (!browser || socket) {
		console.log('Collaboration already initialized or not in browser');
		return socket;
	}

	console.log('Initializing Socket.IO client...');
	socket = io({
		transports: ['websocket', 'polling'],
		autoConnect: true,
		reconnection: true,
		timeout: 10000
	});

	// Connection events
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

	// Collaboration events
	socket.on('session-joined', (user, users) => {
		console.log('✅ Successfully joined session as:', user.name, 'Session has', users.length, 'total users');
		currentUser.set(user);
		collaborators.set(users.filter(u => u.id !== user.id));
	});

	socket.on('user-joined', (user) => {
		console.log('👋 New user joined session:', user.name, 'Color:', user.color);
		collaborators.update(users => {
			const existing = users.find(u => u.id === user.id);
			if (existing) {
				// Update existing user
				return users.map(u => u.id === user.id ? user : u);
			} else {
				// Add new user
				return [...users, user];
			}
		});
	});

	socket.on('user-left', (userId) => {
		console.log('User left:', userId);
		collaborators.update(users => users.filter(u => u.id !== userId));
		
		// Remove their field focuses
		fieldFocuses.update(focuses => {
			const updated = { ...focuses };
			Object.keys(updated).forEach(fieldId => {
				if (updated[fieldId].id === userId) {
					delete updated[fieldId];
				}
			});
			return updated;
		});

		// Remove from typing indicators
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
		if (currentUserData && user.id === currentUserData.id) return; // Ignore own events
		
		fieldFocuses.update(focuses => {
			const updated = { ...focuses };
			
			// Remove user's previous focus
			Object.keys(updated).forEach(key => {
				if (updated[key].id === user.id) {
					delete updated[key];
				}
			});
			
			// Add new focus if fieldId is provided
			if (fieldId) {
				updated[fieldId] = user;
			}
			
			return updated;
		});
	});

	socket.on('field-updated', (fieldId, value, userId) => {
		const currentUserData = get(currentUser);
		if (currentUserData && userId === currentUserData.id) return; // Ignore own updates
		
		console.log('Field updated:', fieldId, value, 'by user:', userId);
		
		// Dispatch custom event for components to handle
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('collaboration-field-update', {
				detail: { fieldId, value, userId }
			}));
		}
	});

	socket.on('settings-updated', (config, userId) => {
		// This will be handled by the settings component
		console.log('Settings updated by user:', userId);
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

// Join a collaboration session
export function joinSession(sessionId: string, userData?: Partial<CollaborationUser>) {
	if (!socket) {
		console.error('Socket not initialized when trying to join session');
		return false;
	}
	
	console.log('Attempting to join session:', sessionId, 'Socket connected:', socket.connected);
	currentSessionId = sessionId;
	
	// If socket is already connected, emit immediately
	if (socket.connected) {
		socket.emit('join-session', sessionId, userData);
	} else {
		// Wait for connection before emitting
		socket.once('connect', () => {
			console.log('Socket connected, now joining session:', sessionId);
			socket!.emit('join-session', sessionId, userData);
		});
	}
	
	return true;
}

// Leave current session
export function leaveSession() {
	if (!socket || !currentSessionId) return;
	
	socket.emit('leave-session', currentSessionId);
	currentSessionId = null;
	currentUser.set(null);
	collaborators.set([]);
	fieldFocuses.set({});
	typingUsers.set({});
}

// Focus on a field
export function focusField(fieldId: string | null) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('field-focus', currentSessionId, fieldId);
}

// Update field value
export function updateField(fieldId: string, value: any) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('field-update', currentSessionId, fieldId, value);
}

// Update settings
export function updateSettings(config: any) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('settings-update', currentSessionId, config);
}

// Set typing status
export function setTypingStatus(fieldId: string, isTyping: boolean) {
	if (!socket || !currentSessionId) return;
	
	socket.emit('user-typing', currentSessionId, fieldId, isTyping);
}

// Derived stores
export const totalUsers = derived(
	[currentUser, collaborators],
	([current, collaborators]) => current ? [current, ...collaborators] : collaborators
);

export const isInSession = derived(
	[currentUser, isConnected],
	([user, connected]) => !!(user && connected)
);

// Cleanup
export function disconnectCollaboration() {
	if (socket) {
		socket.disconnect();
		socket = null;
		currentSessionId = null;
	}
	
	// Clean up stored session ID
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem('collaboration-session-id');
	}
	
	isConnected.set(false);
	currentUser.set(null);
	collaborators.set([]);
	fieldFocuses.set({});
	typingUsers.set({});
	connectionError.set(null);
}