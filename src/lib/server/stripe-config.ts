export const STRIPE_CONFIG = {
	PAYMENT_LINK: process.env.STRIPE_PAYMENT_LINK,
	WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
	PRODUCT_NAME: 'Salary Calculator Pro',
	PRICE: parseFloat(process.env.STRIPE_PRICE || '0'),
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
