/**
 * @openapi
 * /api/v1/stripe/payment-link:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get Stripe payment link
 *     description: Returns the Stripe payment link for Pro unlock, optionally with user ID metadata
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: User ID to associate with the payment
 *     responses:
 *       200:
 *         description: Payment link retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentLink:
 *                   type: string
 *                   format: uri
 *                   example: "https://buy.stripe.com/test_14k9AQ9aR1234567890?client_reference_id=user_abc123"
 *                 productName:
 *                   type: string
 *                   example: "Salary Calculator Pro"
 *                 price:
 *                   type: number
 *                   example: 4.99
 *                 currency:
 *                   type: string
 *                   example: "usd"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to generate payment link"
 */

import { json } from '@sveltejs/kit';
import { generatePaymentLink, STRIPE_CONFIG } from '$lib/server/stripe-config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		const paymentLink = generatePaymentLink(userId || undefined);
		
		return json({
			paymentLink,
			productName: STRIPE_CONFIG.PRODUCT_NAME,
			price: STRIPE_CONFIG.PRICE,
			currency: STRIPE_CONFIG.CURRENCY
		});

	} catch (error) {
		console.error('Error generating payment link:', error);
		return json({ error: 'Failed to generate payment link' }, { status: 500 });
	}
};