export interface PaymentLinkResponse {
	paymentLink: string;
	productName: string;
	price: number;
	currency: string;
}

export interface PaymentLinkError {
	error: string;
}

/**
 * Fetches the Stripe payment link from the server
 * @param userId - Optional user ID to associate with the payment
 * @returns Promise with payment link data or error
 */
export async function getPaymentLink(
	userId?: string
): Promise<PaymentLinkResponse | PaymentLinkError> {
	try {
		const params = new URLSearchParams();
		if (userId) {
			params.append('userId', userId);
		}

		const url = `/api/v1/stripe/payment-link${params.toString() ? '?' + params.toString() : ''}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});

		const data = await response.json();

		if (!response.ok) {
			return data as PaymentLinkError;
		}

		return data as PaymentLinkResponse;
	} catch (error) {
		console.error('Failed to get payment link:', error);
		return {
			error: 'Failed to load payment information'
		};
	}
}

export function isPaymentLinkError(
	response: PaymentLinkResponse | PaymentLinkError
): response is PaymentLinkError {
	return 'error' in response;
}
