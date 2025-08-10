import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ProStatus {
	isUnlocked: boolean;
	userId: string | null;
	paymentId: string | null;
	unlockedAt: Date | null;
}

const defaultProStatus: ProStatus = {
	isUnlocked: false,
	userId: null,
	paymentId: null,
	unlockedAt: null
};

const PRO_STATUS_KEY = 'salary_calculator_pro_status';

function generateUserId(): string {
	return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function loadProStatus(): ProStatus {
	if (!browser) return defaultProStatus;

	try {
		const stored = localStorage.getItem(PRO_STATUS_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed.unlockedAt) {
				parsed.unlockedAt = new Date(parsed.unlockedAt);
			}
			return { ...defaultProStatus, ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load Pro status from localStorage:', error);
	}

	return defaultProStatus;
}

function saveProStatus(status: ProStatus) {
	if (!browser) return;

	try {
		localStorage.setItem(PRO_STATUS_KEY, JSON.stringify(status));
	} catch (error) {
		console.warn('Failed to save Pro status to localStorage:', error);
	}
}

const { subscribe, update } = writable<ProStatus>(loadProStatus());

export const proStatus = {
	subscribe,

	initializeUser: () => {
		update((status) => {
			if (!status.userId) {
				const newStatus = { ...status, userId: generateUserId() };
				saveProStatus(newStatus);
				return newStatus;
			}
			return status;
		});
	},

	unlock: (paymentId?: string) => {
		update((status) => {
			const newStatus = {
				...status,
				isUnlocked: true,
				paymentId: paymentId || null,
				unlockedAt: new Date()
			};
			saveProStatus(newStatus);
			return newStatus;
		});
	},

	getUserId: (): string | null => {
		let userId: string | null = null;
		subscribe((status) => {
			userId = status.userId;
		})();
		return userId;
	}
};

if (browser) {
	proStatus.initializeUser();
}
