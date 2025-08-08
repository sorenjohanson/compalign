/**
 * @openapi
 * /api/v1/share:
 *   post:
 *     tags:
 *       - Collaboration
 *     summary: Create or update shared calculator session
 *     description: Creates a new shared session or updates an existing one with fresh calculator data and rotated OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grossSalary
 *               - customerRate
 *               - config
 *             properties:
 *               grossSalary:
 *                 type: number
 *                 description: Annual gross salary in euros
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 example: 75000
 *               customerRate:
 *                 type: number
 *                 description: Hourly billing rate in euros
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 example: 110
 *               config:
 *                 type: object
 *                 description: Calculator configuration settings
 *                 properties:
 *                   employerSocialContributionRate:
 *                     type: number
 *                     example: 0.20
 *                   vacationDays:
 *                     type: number
 *                     example: 30
 *                   targetNetMargin:
 *                     type: number
 *                     example: 0.20
 *     responses:
 *       200:
 *         description: Session created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Unique session identifier
 *                   example: "abc123def456"
 *                 otpCode:
 *                   type: string
 *                   description: 6-character access code (valid for 30 minutes)
 *                   pattern: "^[A-Z0-9]{6}$"
 *                   example: "ABC123"
 *                 shareableLink:
 *                   type: string
 *                   format: uri
 *                   description: Complete URL for sharing
 *                   example: "https://app.example.com/share/abc123def456"
 *                 otpExpiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: ISO timestamp when OTP expires
 *                   example: "2024-01-15T14:30:00Z"
 *                 isUpdate:
 *                   type: boolean
 *                   description: True if this was an update to existing session
 *                   example: false
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required calculator data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create shared session"
 */

import { json } from '@sveltejs/kit';
import { createOrUpdateSharedSession, generateShareableLink } from '$lib/collaboration.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { grossSalary, customerRate, config } = await request.json();
		
		if (!grossSalary || !customerRate) {
			return json({ error: 'Missing required calculator data' }, { status: 400 });
		}
		
		// Validate input ranges
		if (grossSalary <= 0) {
			return json({ error: 'Gross salary must be greater than €0' }, { status: 400 });
		}
		
		if (customerRate <= 0) {
			return json({ error: 'Customer rate must be greater than €0 per hour' }, { status: 400 });
		}
		
		const session = createOrUpdateSharedSession({
			grossSalary,
			customerRate,
			config
		});
		
		const shareableLink = generateShareableLink(session.id, url.origin);
		
		return json({
			sessionId: session.id,
			otpCode: session.otpCode,
			shareableLink,
			otpExpiresAt: session.otpExpiresAt,
			isUpdate: session.createdAt.getTime() !== Date.now() // Rough check if this was an update
		});
	} catch (error) {
		console.error('Error creating/updating shared session:', error);
		return json({ error: 'Failed to create shared session' }, { status: 500 });
	}
};