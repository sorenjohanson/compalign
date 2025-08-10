export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatPercentage(percentage: number): string {
	return `${percentage.toFixed(1)}%`;
}