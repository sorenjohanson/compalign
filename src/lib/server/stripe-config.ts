import { PUBLIC_STRIPE_PAYMENT_LINK } from '$env/static/public';

export const STRIPE_CONFIG = {
	PAYMENT_LINK: PUBLIC_STRIPE_PAYMENT_LINK,
	PRODUCT_NAME: 'CompAlign Pro',
	CURRENCY: 'eur'
};

export function generatePaymentLink(userId?: string): string {
	const baseUrl = STRIPE_CONFIG.PAYMENT_LINK;

	if (!baseUrl) {
		throw new Error('PUBLIC_STRIPE_PAYMENT_LINK environment variable is not set');
	}

	if (userId) {
		const params = new URLSearchParams({
			client_reference_id: userId
		});
		return `${baseUrl}?${params.toString()}`;
	}

	return baseUrl;
}
