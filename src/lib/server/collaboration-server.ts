import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { 
	CollaborationUser, 
	CollaborationSession, 
	SocketEvents 
} from '../collaboration-types';
import { 
	generateRandomName, 
	getInitials, 
	generateUserId, 
	assignUserColor 
} from '../collaboration-types';

const collaborationSessions = new Map<string, CollaborationSession>();

export function setupCollaborationServer(httpServer: HTTPServer) {
	const io = new Server<SocketEvents>(httpServer, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"]
		}
	});

	io.on('connection', (socket) => {
		console.log('Client connected:', socket.id);

		socket.on('join-session', async (sessionId, userData = {}) => {
			try {
				console.log('🔗 User attempting to join session:', sessionId, 'with data:', userData);
				
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
						lastUpdated: new Date(),
						hostProStatus: false
					};
					collaborationSessions.set(sessionId, session);
				}

					if (!session) {
					throw new Error('Failed to create or retrieve session');
				}
				
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
					userColor = '#3b82f6';
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

					session.users.set(socket.id, user);
				socket.join(sessionId);

					socket.data.sessionId = sessionId;
				socket.data.userId = user.id;

				console.log(`✅ User ${user.name} (${user.id}) successfully joined session ${sessionId}. Total users: ${session.users.size}`);

					socket.emit('session-joined', user, Array.from(session.users.values()), session.hostProStatus);

					socket.to(sessionId).emit('user-joined', user);

			} catch (error) {
				console.error('❌ Error joining session:', sessionId, error);
				socket.emit('collaboration-error', 'Failed to join session: ' + (error instanceof Error ? error.message : 'Unknown error'));
			}
		});

		socket.on('leave-session', (sessionId) => {
			leaveSession(socket, sessionId);
		});

		socket.on('field-focus', (sessionId, fieldId) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				user.currentField = fieldId;
				user.lastSeen = new Date();

				if (fieldId) {
					session.fieldFocuses.set(fieldId, {
						fieldId,
						userId: user.id,
						timestamp: new Date()
					});
				} else {
					for (const [key, focus] of session.fieldFocuses.entries()) {
						if (focus.userId === user.id) {
							session.fieldFocuses.delete(key);
						}
					}
				}

				io.to(sessionId).emit('field-focused', fieldId, user);

			} catch (error) {
				console.error('Error handling field focus:', error);
			}
		});

		socket.on('field-update', (sessionId, fieldId, value) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				if (fieldId === 'grossSalary') {
					session.calculatorData.grossSalary = value;
				} else if (fieldId === 'customerRate') {
					session.calculatorData.customerRate = value;
				}

				session.lastUpdated = new Date();

				socket.to(sessionId).emit('field-updated', fieldId, value, user.id);

			} catch (error) {
				console.error('Error handling field update:', error);
			}
		});

		socket.on('settings-update', (sessionId, config) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				session.calculatorData.config = { ...session.calculatorData.config, ...config };
				session.lastUpdated = new Date();

				socket.to(sessionId).emit('settings-updated', config, user.id);

			} catch (error) {
				console.error('Error handling settings update:', error);
			}
		});

		socket.on('user-typing', (sessionId, fieldId, isTyping) => {
			try {
				const session = collaborationSessions.get(sessionId);
				const user = session?.users.get(socket.id);
				
				if (!session || !user) return;

				socket.to(sessionId).emit('user-typing-status', fieldId, user.id, isTyping);

			} catch (error) {
				console.error('Error handling typing status:', error);
			}
		});

		socket.on('disconnect', () => {
			const sessionId = socket.data.sessionId;
			if (sessionId) {
				leaveSession(socket, sessionId);
			}
			console.log('Client disconnected:', socket.id);
		});
	});

	function leaveSession(socket: any, sessionId: string) {
		const session = collaborationSessions.get(sessionId);
		const user = session?.users.get(socket.id);

		if (session && user) {
			session.users.delete(socket.id);

			for (const [key, focus] of session.fieldFocuses.entries()) {
				if (focus.userId === user.id) {
					session.fieldFocuses.delete(key);
				}
			}

			socket.to(sessionId).emit('user-left', user.id);

			if (session.users.size === 0) {
				collaborationSessions.delete(sessionId);
				console.log(`Session ${sessionId} cleaned up - no users remaining`);
			}

			console.log(`User ${user.name} left session ${sessionId}`);
		}

		socket.leave(sessionId);
	}

	setInterval(() => {
		const now = new Date();
		const CLEANUP_THRESHOLD = 30 * 60 * 1000;

		for (const [sessionId, session] of collaborationSessions.entries()) {
			const timeSinceLastUpdate = now.getTime() - session.lastUpdated.getTime();
			
			if (timeSinceLastUpdate > CLEANUP_THRESHOLD && session.users.size === 0) {
				collaborationSessions.delete(sessionId);
				console.log(`Cleaned up inactive session: ${sessionId}`);
			}
		}
	}, 10 * 60 * 1000);

	return io;
}