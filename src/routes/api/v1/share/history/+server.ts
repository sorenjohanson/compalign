/**
 * @openapi
 * /api/v1/share/history:
 *   get:
 *     tags:
 *       - Collaboration
 *     summary: Get current active session
 *     description: Retrieves the currently active shared calculator session, if any. Only one session can be active at a time.
 *     responses:
 *       200:
 *         description: Successfully retrieved session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   oneOf:
 *                     - type: 'null'
 *                       description: No active session
 *                     - type: object
 *                       description: Active session details
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Unique session identifier
 *                           example: "abc123def456"
 *                         otpCode:
 *                           type: string
 *                           description: Current 6-character access code
 *                           pattern: "^[A-Z0-9]{6}$"
 *                           example: "ABC123"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: When session was initially created
 *                           example: "2024-01-15T14:00:00Z"
 *                         otpExpiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: When current OTP expires (30 min from last rotation)
 *                           example: "2024-01-15T14:30:00Z"
 *                         shareableLink:
 *                           type: string
 *                           format: uri
 *                           description: Complete URL for sharing
 *                           example: "https://app.example.com/share/abc123def456"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch active session"
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

// Get the single active session
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Import here to avoid SSR issues
		const { getActiveSession, generateShareableLink } = await import('$lib/collaboration.js');
		
		const session = getActiveSession();
		
		if (!session) {
			return json({ session: null });
		}
		
		const shareableLink = generateShareableLink(session.id, url.origin);
		
		return json({
			session: {
				id: session.id,
				otpCode: session.otpCode,
				createdAt: session.createdAt,
				otpExpiresAt: session.otpExpiresAt,
				shareableLink
			}
		});
	} catch (error) {
		console.error('Error fetching active session:', error);
		return json({ error: 'Failed to fetch active session' }, { status: 500 });
	}
};