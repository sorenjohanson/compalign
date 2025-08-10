/**
 * @openapi
 * /api/v1/stripe/webhook:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Stripe webhook endpoint
 *     description: Handles Stripe webhook events for payment processing and Pro unlock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid webhook payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid webhook payload"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to process webhook"
 */

import { json } from '@sveltejs/kit';
import { STRIPE_CONFIG } from '$lib/server/stripe-config';
import type { RequestHandler } from './$types';

const proUsers = new Set<string>();

interface StripeWebhookEvent {
	id: string;
	type: string;
	data: {
		object: {
			id: string;
			client_reference_id?: string;
			customer_email?: string;
			payment_status?: string;
			status?: string;
		};
	};
}

function isValidWebhook(payload: any, signature: string): boolean {
	// For now, just check if the payload has the expected structure
	// In production, verify the signature using Stripe's webhook secret
	return payload && typeof payload === 'object' && payload.type && payload.data;
}

function processSuccessfulPayment(event: StripeWebhookEvent): boolean {
	try {
		const clientReferenceId = event.data.object.client_reference_id;

		if (clientReferenceId) {
			// Add user to Pro users set
			proUsers.add(clientReferenceId);
			console.log(`Pro unlocked for user: ${clientReferenceId}`);
			return true;
		} else {
			console.warn('No client_reference_id found in webhook event');
			return false;
		}
	} catch (error) {
		console.error('Error processing successful payment:', error);
		return false;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature') || '';

		let event: StripeWebhookEvent;

		try {
			event = JSON.parse(body);
		} catch (error) {
			console.error('Invalid JSON in webhook payload:', error);
			return json({ error: 'Invalid JSON payload' }, { status: 400 });
		}

		if (!isValidWebhook(event, signature)) {
			console.error('Invalid webhook signature or payload');
			return json({ error: 'Invalid webhook signature' }, { status: 400 });
		}

		switch (event.type) {
			case 'checkout.session.completed':
				if (event.data.object.payment_status === 'paid') {
					processSuccessfulPayment(event);
				}
				break;

			case 'payment_intent.succeeded':
				processSuccessfulPayment(event);
				break;

			case 'invoice.payment_succeeded':
				processSuccessfulPayment(event);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return json({ error: 'Failed to process webhook' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId');

	if (!userId) {
		return json({ error: 'Missing userId parameter' }, { status: 400 });
	}

	const hasProAccess = proUsers.has(userId);

	return json({
		userId,
		hasProAccess,
		message: hasProAccess ? 'Pro access confirmed' : 'No Pro access found'
	});
};
