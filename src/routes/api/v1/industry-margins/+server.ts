/**
 * @openapi
 * /api/v1/industry-margins:
 *   get:
 *     tags:
 *       - Industry Data
 *     summary: Get industry margin benchmarks (Pro feature)
 *     description: Returns industry benchmark data for margin comparison. Requires Pro access validation on server-side.
 *     parameters:
 *       - in: header
 *         name: x-pro-token
 *         schema:
 *           type: string
 *         required: false
 *         description: Pro validation token (if implementing token-based validation)
 *     responses:
 *       200:
 *         description: Industry benchmark data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 benchmarks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: "IT Consulting Firms"
 *                       netMarginRange:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: number
 *                             example: 8
 *                           max:
 *                             type: number
 *                             example: 15
 *                       grossMarginRange:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: number
 *                             example: 25
 *                           max:
 *                             type: number
 *                             example: 45
 *                       description:
 *                         type: string
 *                         example: "Specialised IT consulting and professional services"
 *                       source:
 *                         type: string
 *                         example: "2024 Industry Data"
 *                 industryStats:
 *                   type: object
 *                   properties:
 *                     industryLow:
 *                       type: number
 *                       example: 5
 *                     industryHigh:
 *                       type: number
 *                       example: 35
 *                     industryAverage:
 *                       type: number
 *                       example: 16.25
 *       403:
 *         description: Pro access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pro access required for industry benchmark data"
 *                 requiresPro:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve industry data"
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface IndustryBenchmark {
	category: string;
	netMarginRange: { min: number; max: number };
	grossMarginRange: { min: number; max: number };
	description: string;
	source: string;
}

// Industry benchmarks data (moved from client-side)
const industryBenchmarks: IndustryBenchmark[] = [
	{
		category: 'Staffing Agencies (Full-time)',
		netMarginRange: { min: 5, max: 10 },
		grossMarginRange: { min: 15.3, max: 32.6 },
		description: 'Traditional staffing agencies placing full-time employees',
		source: '2024 Industry Data'
	},
	{
		category: 'IT Consulting Firms',
		netMarginRange: { min: 8, max: 15 },
		grossMarginRange: { min: 25, max: 45 },
		description: 'Specialised IT consulting and professional services',
		source: '2024 Industry Data'
	},
	{
		category: 'Recruitment Agencies (Permanent)',
		netMarginRange: { min: 15, max: 25 },
		grossMarginRange: { min: 15, max: 30 },
		description: 'Agencies placing permanent employees with placement fees',
		source: '2024 Industry Data'
	},
	{
		category: 'Recruitment Agencies (Freelancers)',
		netMarginRange: { min: 10, max: 35 },
		grossMarginRange: { min: 20, max: 50 },
		description: 'Platforms and agencies managing freelance contractors',
		source: '2024 Industry Data'
	}
];

function getIndustryMarginStats() {
	const allMins = industryBenchmarks.map((b) => b.netMarginRange.min);
	const allMaxs = industryBenchmarks.map((b) => b.netMarginRange.max);
	const allAvgs = industryBenchmarks.map((b) => (b.netMarginRange.min + b.netMarginRange.max) / 2);

	return {
		industryLow: Math.min(...allMins),
		industryHigh: Math.max(...allMaxs),
		industryAverage: allAvgs.reduce((sum, avg) => sum + avg, 0) / allAvgs.length
	};
}

// Pro validation using the webhook system
async function validateProAccess(request: Request): Promise<boolean> {
	const userId = request.headers.get('x-user-id');
	
	// If no user ID provided, return false
	if (!userId) {
		return false;
	}
	
	try {
		// Check Pro status via webhook endpoint
		const baseUrl = request.url.split('/api')[0];
		const response = await fetch(`${baseUrl}/api/v1/stripe/webhook?userId=${userId}`);
		
		if (response.ok) {
			const data = await response.json();
			return data.hasProAccess === true;
		}
	} catch (error) {
		console.error('Error validating Pro access:', error);
	}
	
	return false;
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Server-side Pro validation
		const hasProAccess = await validateProAccess(request);
		if (!hasProAccess) {
			return json(
				{ 
					error: 'Pro access required for industry benchmark data',
					requiresPro: true 
				}, 
				{ status: 403 }
			);
		}

		const industryStats = getIndustryMarginStats();

		return json({
			benchmarks: industryBenchmarks,
			industryStats
		});
	} catch (error) {
		console.error('Error retrieving industry benchmark data:', error);
		return json({ error: 'Failed to retrieve industry data' }, { status: 500 });
	}
};