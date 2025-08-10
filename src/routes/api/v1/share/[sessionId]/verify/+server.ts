/**
 * @openapi
 * /api/v1/share/{sessionId}/verify:
 *   post:
 *     tags:
 *       - Collaboration
 *     summary: Verify OTP and access shared calculator data
 *     description: Verifies the provided OTP code against the session and returns calculator data if valid
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "abc123def456"
 *         description: The session identifier from the shared link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otpCode
 *             properties:
 *               otpCode:
 *                 type: string
 *                 pattern: "^[A-Z0-9]{6}$"
 *                 description: 6-character access code
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: OTP verified successfully, calculator data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates successful verification
 *                 calculatorData:
 *                   type: object
 *                   description: Shared calculator configuration and inputs
 *                   properties:
 *                     grossSalary:
 *                       type: number
 *                       example: 75000
 *                       description: Annual gross salary in euros
 *                     customerRate:
 *                       type: number
 *                       example: 110
 *                       description: Hourly billing rate in euros
 *                     config:
 *                       type: object
 *                       description: Calculator configuration settings
 *                       properties:
 *                         employerSocialContributionRate:
 *                           type: number
 *                           example: 0.20
 *                         vacationDays:
 *                           type: number
 *                           example: 30
 *                         targetNetMargin:
 *                           type: number
 *                           example: 0.20
 *       400:
 *         description: Missing or invalid OTP code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "OTP code is required"
 *       401:
 *         description: Invalid or expired OTP code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired OTP code. The code rotates every 30 minutes."
 *       404:
 *         description: Session not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session not found or expired"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to verify OTP"
 */

import { json } from '@sveltejs/kit';
import { verifyOTP, getSharedSession } from '$lib/collaboration';
import { isCollaborationApiEnabled } from '$lib/feature-flags';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	if (!isCollaborationApiEnabled()) {
		return json({ error: 'Collaboration features are disabled' }, { status: 404 });
	}

	try {
		const { sessionId } = params;
		const { otpCode } = await request.json();

		if (!otpCode) {
			return json({ error: 'OTP code is required' }, { status: 400 });
		}

		if (!/^[A-Z0-9]{6}$/.test(otpCode.toUpperCase())) {
			return json(
				{ error: 'OTP code must be 6 characters (letters and numbers)' },
				{ status: 400 }
			);
		}

		const isValid = verifyOTP(sessionId, otpCode);

		if (!isValid) {
			return json(
				{
					error: 'Invalid or expired OTP code. The code rotates every 30 minutes.'
				},
				{ status: 401 }
			);
		}

		const session = getSharedSession(sessionId);

		if (!session) {
			return json({ error: 'Session not found or expired' }, { status: 404 });
		}

		return json({
			valid: true,
			calculatorData: session.calculatorData
		});
	} catch (error) {
		console.error('Error verifying OTP:', error);
		return json({ error: 'Failed to verify OTP' }, { status: 500 });
	}
};
