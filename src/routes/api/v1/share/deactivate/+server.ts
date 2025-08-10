/**
 * @openapi
 * /api/v1/share/deactivate:
 *   post:
 *     tags:
 *       - Collaboration
 *     summary: Deactivate current shared session
 *     description: Deactivates the currently active shared calculator session, making the link and OTP invalid
 *     responses:
 *       200:
 *         description: Session successfully deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates successful deactivation
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to deactivate session"
 */

import { json } from '@sveltejs/kit';
import { deactivateSession } from '$lib/collaboration';
import { isCollaborationApiEnabled } from '$lib/feature-flags';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	if (!isCollaborationApiEnabled()) {
		return json({ error: 'Collaboration features are disabled' }, { status: 404 });
	}

	try {
		deactivateSession();

		return json({ success: true });
	} catch (error) {
		console.error('Error deactivating session:', error);
		return json({ error: 'Failed to deactivate session' }, { status: 500 });
	}
};
