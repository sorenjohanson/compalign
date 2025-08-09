<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	interface Props {
		value: number;
		placeholder?: string;
		min?: string;
		max?: string;
		step?: string;
		class?: string;
		id?: string;
		disabled?: boolean;
	}

	let {
		value = $bindable(),
		placeholder = '',
		min,
		max,
		step,
		class: className = '',
		id,
		disabled = false
	}: Props = $props();

	let displayValue = $state('');
	let isFocused = $state(false);

	function formatNumber(num: number): string {
		if (isNaN(num) || num === 0) return '';
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	function parseFormattedNumber(str: string): number {
		if (!str || str.trim() === '') return 0;
		const cleaned = str.replace(/\./g, '');
		const parsed = parseInt(cleaned, 10);
		return isNaN(parsed) ? 0 : parsed;
	}

	$effect(() => {
		if (!isFocused) {
			displayValue = formatNumber(value);
		}
	});

	$effect(() => {
		displayValue = formatNumber(value);
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let inputValue = target.value;

		if (isFocused) {
			inputValue = inputValue.replace(/[^0-9]/g, '');
		}

		displayValue = inputValue;

		const numericValue = parseFormattedNumber(inputValue);
		value = numericValue;
	}

	function handleFocus() {
		isFocused = true;
		displayValue = value > 0 ? value.toString() : '';
	}

	function handleBlur() {
		isFocused = false;
		displayValue = formatNumber(value);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (
			['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(event.key) ||
			(event.key === 'a' && event.ctrlKey) ||
			(event.key === 'c' && event.ctrlKey) ||
			(event.key === 'v' && event.ctrlKey) ||
			(event.key === 'x' && event.ctrlKey) ||
			['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)
		) {
			return;
		}
		if (event.shiftKey || (!/\d/.test(event.key) && event.key.length === 1)) {
			event.preventDefault();
		}
	}
</script>

<Input
	type="text"
	{id}
	value={displayValue}
	{placeholder}
	{min}
	{max}
	{step}
	{disabled}
	class={className}
	oninput={handleInput}
	onfocus={handleFocus}
	onblur={handleBlur}
	onkeydown={handleKeyDown}
	inputmode="numeric"
/>
