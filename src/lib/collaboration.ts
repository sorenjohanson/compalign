export interface SharedSession {
	id: string;
	otpCode: string;
	otpExpiresAt: Date;
	createdAt: Date;
	isActive: boolean;
	calculatorData: {
		grossSalary: number;
		customerRate: number;
		config: Record<string, unknown>;
	};
}

let activeSession: SharedSession | null = null;

export function generateSessionId(): string {
	return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export function generateOTP(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function rotateOTP(session: SharedSession): SharedSession {
	const now = new Date();
	const otpExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);

	session.otpCode = generateOTP();
	session.otpExpiresAt = otpExpiresAt;

	return session;
}

export function createOrUpdateSharedSession(
	calculatorData: SharedSession['calculatorData']
): SharedSession {
	const now = new Date();

	if (activeSession && activeSession.isActive) {
		activeSession.calculatorData = calculatorData;
		activeSession = rotateOTP(activeSession);
		return activeSession;
	}

	const sessionId = generateSessionId();
	const otpCode = generateOTP();
	const otpExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);

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

	const now = new Date();
	if (session.otpExpiresAt < now) {
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
