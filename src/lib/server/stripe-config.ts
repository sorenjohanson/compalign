import { env } from '$env/dynamic/private';

function getEnvVar(key: string, platform?: App.Platform): string | undefined {
	// Try platform env first (Cloudflare Pages/Workers)
	if (platform?.env?.[key]) {
		return platform.env[key] as string;
	}
	// Fallback to SvelteKit env
	return env[key];
}

export const STRIPE_CONFIG = {
	PAYMENT_LINK: env.STRIPE_PAYMENT_LINK,
	WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
	PRODUCT_NAME: 'Salary Calculator Pro',
	CURRENCY: 'eur'
};

export function getStripeConfig(platform?: App.Platform) {
	return {
		PAYMENT_LINK: getEnvVar('STRIPE_PAYMENT_LINK', platform),
		WEBHOOK_SECRET: getEnvVar('STRIPE_WEBHOOK_SECRET', platform),
		PRODUCT_NAME: 'Salary Calculator Pro',
		CURRENCY: 'eur'
	};
}

export function generatePaymentLink(userId?: string, platform?: App.Platform): string {
	const config = getStripeConfig(platform);
	const baseUrl = config.PAYMENT_LINK;

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
