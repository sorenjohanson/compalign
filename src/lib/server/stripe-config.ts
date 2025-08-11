import { STRIPE_PAYMENT_LINK, STRIPE_WEBHOOK_SECRET } from '$env/static/private';

export const STRIPE_CONFIG = {
	PAYMENT_LINK: STRIPE_PAYMENT_LINK,
	WEBHOOK_SECRET: STRIPE_WEBHOOK_SECRET,
	PRODUCT_NAME: 'Salary Calculator Pro',
	CURRENCY: 'eur'
};

export function generatePaymentLink(userId?: string): string {
	const baseUrl = STRIPE_CONFIG.PAYMENT_LINK;

	if (!baseUrl) {
		throw new Error('STRIPE_PAYMENT_LINK environment variable is not set');
	}

	if (userId) {
		const params = new URLSearchParams({
			client_reference_id: userId
		});
		return `${baseUrl}?${params.toString()}`;
	}

	return baseUrl;
}
