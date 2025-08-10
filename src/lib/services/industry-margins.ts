import type { IndustryBenchmark } from '$lib/salary-calculator';

export interface IndustryMarginStats {
	industryLow: number;
	industryHigh: number;
	industryAverage: number;
}

export interface IndustryMarginResponse {
	benchmarks: IndustryBenchmark[];
	industryStats: IndustryMarginStats;
}

export interface IndustryMarginError {
	error: string;
	requiresPro: boolean;
}

/**
 * Fetches industry margin benchmarks from the server
 * Requires Pro access - validated server-side
 */
export async function fetchIndustryMargins(userId?: string | null): Promise<IndustryMarginResponse | IndustryMarginError> {
	try {
		const headers: Record<string, string> = {
			'Accept': 'application/json'
		};
		
		if (userId) {
			headers['x-user-id'] = userId;
		}
		
		const response = await fetch('/api/v1/industry-margins', {
			method: 'GET',
			headers
		});

		const data = await response.json();

		if (!response.ok) {
			return data as IndustryMarginError;
		}

		return data as IndustryMarginResponse;
	} catch (error) {
		console.error('Failed to fetch industry margins:', error);
		return {
			error: 'Failed to load industry benchmark data',
			requiresPro: false
		};
	}
}

export function isIndustryMarginError(
	response: IndustryMarginResponse | IndustryMarginError
): response is IndustryMarginError {
	return 'error' in response;
}