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
	
	// Format number with European formatting (dots as thousands separators)
	function formatNumber(num: number): string {
		if (isNaN(num) || num === 0) return '';
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}
	
	// Parse formatted string back to number
	function parseFormattedNumber(str: string): number {
		if (!str || str.trim() === '') return 0;
		// Remove all dots (thousand separators) and parse as number
		const cleaned = str.replace(/\./g, '');
		const parsed = parseInt(cleaned, 10);
		return isNaN(parsed) ? 0 : parsed;
	}
	
	// Update display value when the bound value changes
	$effect(() => {
		if (!isFocused) {
			displayValue = formatNumber(value);
		}
	});
	
	// Initialize display value
	$effect(() => {
		displayValue = formatNumber(value);
	});
	
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let inputValue = target.value;
		
		// Allow only digits when focused (user is typing)
		if (isFocused) {
			inputValue = inputValue.replace(/[^0-9]/g, '');
		}
		
		// Update the display value
		displayValue = inputValue;
		
		// Parse and update the bound value
		const numericValue = parseFormattedNumber(inputValue);
		value = numericValue;
	}
	
	function handleFocus() {
		isFocused = true;
		// Show unformatted value for editing
		displayValue = value > 0 ? value.toString() : '';
	}
	
	function handleBlur() {
		isFocused = false;
		// Format the display value
		displayValue = formatNumber(value);
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		// Allow: backspace, delete, tab, escape, enter
		if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
			// Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
			(event.keyCode === 65 && event.ctrlKey) ||
			(event.keyCode === 67 && event.ctrlKey) ||
			(event.keyCode === 86 && event.ctrlKey) ||
			(event.keyCode === 88 && event.ctrlKey) ||
			// Allow: home, end, left, right
			(event.keyCode >= 35 && event.keyCode <= 39)) {
			return;
		}
		// Ensure that it's a number and stop the keypress
		if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
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