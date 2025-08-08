// Socket.IO collaboration server
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { 
	CollaborationUser, 
	CollaborationSession, 
	FieldFocus, 
	SocketEvents 
} from '../collaboration-types.js';
import { 
	generateRandomName, 
	getInitials, 
	generateUserId, 
	assignUserColor 
} from '../collaboration-types.js';

// In-memory storage for collaboration sessions
const collaborationSessions = new Map<string, CollaborationSession>();

export function setupCollaborationServer(httpServer: HTTPServer) {
	const io = new Server<SocketEvents>(httpServer, {
		cors: {
			origin: "*", // In production, specify your domain
			methods: ["GET", "POST"]
		}
	});

	io.on('connection', (socket) => {
		console.log('Client connected:', socket.id);

		// Join collaboration session
		socket.on('join-session', async (sessionId, userData = {}) => {
			try {
				console.log('🔗 User attempting to join session:', sessionId, 'with data:', userData);
				
				// Get or create session
				let session = collaborationSessions.get(sessionId);
				if (!session) {
					console.log('📝 Creating new collaboration session:', sessionId);
					session = {
						sessionId,
						users: new Map(),
						calculatorData: {
							grossSalary: 90000,
							customerRate: 110,
							config: {}
						},
						fieldFocuses: new Map(),
						lastUpdated: new Date()
					};
					collaborationSessions.set(sessionId, session);
				}

				// Create user with safety checks
				const existingUsers = Array.from(session.users.values());
				const userName = userData?.name || generateRandomName();
				console.log('🔧 Creating user with name:', userName, 'from userData:', userData);
				
				let userColor: string;
				let userAvatar: string;
				
				try {
					userColor = userData?.color || assignUserColor(existingUsers);
					console.log('🎨 Assigned color:', userColor);
				} catch (error) {
					console.error('❌ Error assigning color:', error);
					userColor = '#3b82f6'; // Default blue
				}
				
				try {
					userAvatar = userData?.avatar || getInitials(userName);
					console.log('👤 Generated avatar:', userAvatar);
				} catch (error) {
					console.error('❌ Error generating avatar:', error);
					userAvatar = 'U';
				}
				
				const user: CollaborationUser = {
					id: generateUserId(),
					name: userName,
					color: userColor,
					avatar: userAvatar,
					currentField: null,
					lastSeen: new Date(),
					isActive: true
				};

				// Add user to session
				session.users.set(socket.id, user);
				socket.join(sessionId);

				// Store user data in socket
				socket.data.sessionId = sessionId;
				socket.data.userId = user.id;

				console.log(`✅ User ${user.name} (${user.id}) successfully joined session ${sessionId}. Total users: ${session.users.size}`);

				// Notify the joining user
				socket.emit('session-joined', user, Array.from(session.users.values()));

				// Notify other users in the session
				socket.to(sessionId).emit('user-joined', user);

			} catch (error) {
				console.error('❌ Error joining session:', sessionId, error);
				socket.emit('collaboration-error', 'Failed to join session: ' + (error instanceof Error ? error.message : 'Unknown error'));
			}
		});

		// Leave session
		socket.on('leave-session', (sessionId) => {
			leaveSession(socket, sessionId);
		});

		// Handle field focus
		socket.on('field-focus', (sessionId, fieldId) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				// Update user's current field
				user.currentField = fieldId;
				user.lastSeen = new Date();

				// Update field focus tracking
				if (fieldId) {
					session.fieldFocuses.set(fieldId, {
						fieldId,
						userId: user.id,
						timestamp: new Date()
					});
				} else {
					// User unfocused, remove their focus from all fields
					for (const [key, focus] of session.fieldFocuses.entries()) {
						if (focus.userId === user.id) {
							session.fieldFocuses.delete(key);
						}
					}
				}

				// Broadcast to all users in session
				io.to(sessionId).emit('field-focused', fieldId, user);

			} catch (error) {
				console.error('Error handling field focus:', error);
			}
		});

		// Handle field updates
		socket.on('field-update', (sessionId, fieldId, value) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				// Update calculator data
				if (fieldId === 'grossSalary') {
					session.calculatorData.grossSalary = value;
				} else if (fieldId === 'customerRate') {
					session.calculatorData.customerRate = value;
				}

				session.lastUpdated = new Date();

				// Broadcast to other users (not the sender)
				socket.to(sessionId).emit('field-updated', fieldId, value, user.id);

			} catch (error) {
				console.error('Error handling field update:', error);
			}
		});

		// Handle settings updates
		socket.on('settings-update', (sessionId, config) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				// Update config (in real app, you might want per-user configs)
				session.calculatorData.config = { ...session.calculatorData.config, ...config };
				session.lastUpdated = new Date();

				// Broadcast to other users
				socket.to(sessionId).emit('settings-updated', config, user.id);

			} catch (error) {
				console.error('Error handling settings update:', error);
			}
		});

		// Handle typing indicators
		socket.on('user-typing', (sessionId, fieldId, isTyping) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				// Broadcast typing status to other users
				socket.to(sessionId).emit('user-typing-status', fieldId, user.id, isTyping);

			} catch (error) {
				console.error('Error handling typing status:', error);
			}
		});

		// Handle disconnect
		socket.on('disconnect', () => {
			const sessionId = socket.data.sessionId;
			if (sessionId) {
				leaveSession(socket, sessionId);
			}
			console.log('Client disconnected:', socket.id);
		});
	});

	// Helper function to handle leaving session
	function leaveSession(socket: any, sessionId: string) {
		const session = collaborationSessions.get(sessionId);
		const user = session?.users.get(socket.id);

		if (session && user) {
			// Remove user from session
			session.users.delete(socket.id);

			// Remove their field focuses
			for (const [key, focus] of session.fieldFocuses.entries()) {
				if (focus.userId === user.id) {
					session.fieldFocuses.delete(key);
				}
			}

			// Notify other users
			socket.to(sessionId).emit('user-left', user.id);

			// Clean up empty sessions
			if (session.users.size === 0) {
				collaborationSessions.delete(sessionId);
				console.log(`Session ${sessionId} cleaned up - no users remaining`);
			}

			console.log(`User ${user.name} left session ${sessionId}`);
		}

		socket.leave(sessionId);
	}

	// Periodic cleanup of inactive sessions
	setInterval(() => {
		const now = new Date();
		const CLEANUP_THRESHOLD = 30 * 60 * 1000; // 30 minutes

		for (const [sessionId, session] of collaborationSessions.entries()) {
			const timeSinceLastUpdate = now.getTime() - session.lastUpdated.getTime();
			
			if (timeSinceLastUpdate > CLEANUP_THRESHOLD && session.users.size === 0) {
				collaborationSessions.delete(sessionId);
				console.log(`Cleaned up inactive session: ${sessionId}`);
			}
		}
	}, 10 * 60 * 1000); // Run every 10 minutes

	return io;
}