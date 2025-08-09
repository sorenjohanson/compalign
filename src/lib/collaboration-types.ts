// Types for real-time collaboration

export interface CollaborationUser {
	id: string;
	name: string;
	color: string;
	avatar: string; // initials
	currentField: string | null;
	lastSeen: Date;
	isActive: boolean;
}

export interface FieldFocus {
	fieldId: string;
	userId: string;
	timestamp: Date;
}

export interface CollaborationSession {
	sessionId: string;
	users: Map<string, CollaborationUser>;
	calculatorData: {
		grossSalary: number;
		customerRate: number;
		config: Record<string, unknown>;
	};
	fieldFocuses: Map<string, FieldFocus>; // fieldId -> focus info
	lastUpdated: Date;
	hostProStatus: boolean; // Whether the session host has Pro unlocked
}

export interface SocketEvents {
	// Client -> Server
	'join-session': (
		sessionId: string,
		userData?: Partial<CollaborationUser>,
		hostProStatus?: boolean
	) => void;
	'leave-session': (sessionId: string) => void;
	'field-focus': (sessionId: string, fieldId: string | null) => void;
	'field-update': (sessionId: string, fieldId: string, value: unknown) => void;
	'settings-update': (sessionId: string, config: Record<string, unknown>) => void;
	'user-typing': (sessionId: string, fieldId: string, isTyping: boolean) => void;

	// Server -> Client
	'session-joined': (
		user: CollaborationUser,
		users: CollaborationUser[],
		hostProStatus: boolean
	) => void;
	'user-joined': (user: CollaborationUser) => void;
	'user-left': (userId: string) => void;
	'user-updated': (user: CollaborationUser) => void;
	'field-focused': (fieldId: string | null, user: CollaborationUser) => void;
	'field-updated': (fieldId: string, value: unknown, userId: string) => void;
	'settings-updated': (config: Record<string, unknown>, userId: string) => void;
	'user-typing-status': (fieldId: string, userId: string, isTyping: boolean) => void;
	'collaboration-error': (message: string) => void;
}

// Predefined user colors (Material Design palette)
export const USER_COLORS = [
	'#1976d2', // Blue
	'#388e3c', // Green
	'#f57c00', // Orange
	'#7b1fa2', // Purple
	'#c2185b', // Pink
	'#0097a7', // Teal
	'#5d4037', // Brown
	'#424242', // Gray
	'#e53935', // Red
	'#fbc02d' // Yellow
];

// Random name generation
const ADJECTIVES = [
	'Creative',
	'Brilliant',
	'Swift',
	'Clever',
	'Wise',
	'Bold',
	'Bright',
	'Sharp',
	'Quick',
	'Smart',
	'Eager',
	'Active',
	'Alert',
	'Agile',
	'Calm'
];

const ANIMALS = [
	'Fox',
	'Wolf',
	'Bear',
	'Eagle',
	'Lion',
	'Tiger',
	'Panda',
	'Owl',
	'Rabbit',
	'Deer',
	'Hawk',
	'Falcon',
	'Leopard',
	'Lynx',
	'Otter'
];

export function generateRandomName(): string {
	const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
	const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
	return `${adjective} ${animal}`;
}

export function getInitials(name: string | null | undefined): string {
	if (!name) return 'U'; // Default for undefined/null names

	return name
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export function generateUserId(): string {
	return `user_${Math.random().toString(36).substring(2, 9)}`;
}

export function assignUserColor(existingUsers: CollaborationUser[]): string {
	try {
		if (!Array.isArray(existingUsers)) {
			console.warn('⚠️ existingUsers is not an array:', existingUsers);
			return USER_COLORS[0];
		}

		const usedColors = existingUsers.filter((user) => user && user.color).map((user) => user.color);

		const availableColors = USER_COLORS.filter((color) => !usedColors.includes(color));

		if (availableColors.length > 0) {
			return availableColors[0];
		}

		// If all colors are used, cycle back
		return USER_COLORS[existingUsers.length % USER_COLORS.length];
	} catch (error) {
		console.error('❌ Error in assignUserColor:', error);
		return USER_COLORS[0]; // Safe fallback
	}
}
