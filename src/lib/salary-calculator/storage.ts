import type { CalculatorConfig, InputValues } from './types';
import { defaultConfig, defaultInputValues } from './config';

const SETTINGS_STORAGE_KEY = 'salary-calculator-settings';
const INPUT_VALUES_STORAGE_KEY = 'salary-calculator-inputs';
const PRO_STORAGE_KEY = 'salary_calculator_pro';

export function saveSettingsToStorage(config: CalculatorConfig): void {
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
		}
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
}

export function loadSettingsFromStorage(): CalculatorConfig {
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as CalculatorConfig;
				return {
					...defaultConfig,
					...parsed
				};
			}
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}
	return defaultConfig;
}

export function clearSettingsFromStorage(): void {
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.removeItem(SETTINGS_STORAGE_KEY);
		}
	} catch (error) {
		console.warn('Failed to clear settings from localStorage:', error);
	}
}

export function saveInputValuesToStorage(inputs: InputValues): void {
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem(INPUT_VALUES_STORAGE_KEY, JSON.stringify(inputs));
		}
	} catch (error) {
		console.warn('Failed to save input values to localStorage:', error);
	}
}

export function loadInputValuesFromStorage(): InputValues {
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			const stored = localStorage.getItem(INPUT_VALUES_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as InputValues;
				return {
					...defaultInputValues,
					...parsed
				};
			}
		}
	} catch (error) {
		console.warn('Failed to load input values from localStorage:', error);
	}
	return defaultInputValues;
}

// Legacy pro status functions - kept for backward compatibility
// New code should use the auth stores directly

export function isProUnlocked(): boolean {
	// Fallback to localStorage for backward compatibility
	// The auth system should be the primary source of truth
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(PRO_STORAGE_KEY) === 'true';
}

export function unlockPro(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(PRO_STORAGE_KEY, 'true');
}

export function lockPro(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(PRO_STORAGE_KEY);
}
