// Collaboration system for shared salary calculator sessions

export interface SharedSession {
	id: string;
	otpCode: string;
	otpExpiresAt: Date;
	createdAt: Date;
	isActive: boolean;
	calculatorData: {
		grossSalary: number;
		customerRate: number;
		config: any;
	};
}

// Single active session storage (in production, use a proper database)
let activeSession: SharedSession | null = null;

export function generateSessionId(): string {
	return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export function generateOTP(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function rotateOTP(session: SharedSession): SharedSession {
	const now = new Date();
	const otpExpiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
	
	session.otpCode = generateOTP();
	session.otpExpiresAt = otpExpiresAt;
	
	return session;
}

export function createOrUpdateSharedSession(calculatorData: SharedSession['calculatorData']): SharedSession {
	const now = new Date();
	
	// If there's an existing active session, update its data and rotate OTP
	if (activeSession && activeSession.isActive) {
		activeSession.calculatorData = calculatorData;
		activeSession = rotateOTP(activeSession);
		return activeSession;
	}
	
	// Create new session
	const sessionId = generateSessionId();
	const otpCode = generateOTP();
	const otpExpiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

	activeSession = {
		id: sessionId,
		otpCode,
		otpExpiresAt,
		createdAt: now,
		isActive: true,
		calculatorData
	};
	
	return activeSession;
}

export function getActiveSession(): SharedSession | null {
	if (!activeSession || !activeSession.isActive) {
		return null;
	}
	
	const now = new Date();
	
	// Check if OTP has expired and rotate if needed
	if (activeSession.otpExpiresAt < now) {
		activeSession = rotateOTP(activeSession);
	}
	
	return activeSession;
}

export function getSharedSession(sessionId: string): SharedSession | null {
	if (!activeSession || activeSession.id !== sessionId || !activeSession.isActive) {
		return null;
	}
	
	return getActiveSession();
}

export function verifyOTP(sessionId: string, inputOTP: string): boolean {
	const session = getSharedSession(sessionId);
	
	if (!session) {
		return false;
	}
	
	// Check if OTP has expired
	const now = new Date();
	if (session.otpExpiresAt < now) {
		// Rotate OTP and return false for expired OTP
		rotateOTP(session);
		return false;
	}
	
	return session.otpCode === inputOTP.toUpperCase();
}

export function deactivateSession(): void {
	if (activeSession) {
		activeSession.isActive = false;
	}
}

export function generateShareableLink(sessionId: string, baseUrl: string): string {
	return `${baseUrl}/share/${sessionId}`;
}