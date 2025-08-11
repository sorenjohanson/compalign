<script lang="ts">
	import { onDestroy } from 'svelte';
	import { focusField, setTypingStatus, updateField } from '$lib/stores/collaboration';
	import { fieldFocuses } from '$lib/stores/collaboration';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		fieldId: string;
		value?: number;
		placeholder?: string;
		min?: string;
		max?: string;
		step?: string;
		disabled?: boolean;
		onchange?: (event: CustomEvent<{ value: number }>) => void;
		oninput?: (event: CustomEvent<{ value: number }>) => void;
		class?: string;
	}

	let {
		fieldId,
		value = $bindable(0),
		placeholder = '',
		min,
		max,
		step,
		disabled = false,
		onchange,
		oninput,
		class: className = '',
		...restProps
	}: Props = $props();

	const focusedUser = $derived($fieldFocuses[fieldId]);
	const hasFocus = $derived(!!focusedUser);
	const focusRingColor = $derived(focusedUser?.color || '#3b82f6');

	function dispatch(eventName: string, detail: unknown) {
		if (
			eventName === 'change' &&
			onchange &&
			typeof detail === 'object' &&
			detail !== null &&
			'value' in detail
		) {
			onchange(new CustomEvent('change', { detail: detail as { value: number } }));
		}
		if (
			eventName === 'input' &&
			oninput &&
			typeof detail === 'object' &&
			detail !== null &&
			'value' in detail
		) {
			oninput(new CustomEvent('input', { detail: detail as { value: number } }));
		}
	}

	let typingTimeout: ReturnType<typeof setTimeout>;
	let blurTimeout: ReturnType<typeof setTimeout>;
	let displayValue = $state('');
	let isExternalUpdate = false;

	function formatNumber(num: number): string {
		if (isNaN(num) || num === 0) return '';
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	function parseDisplayValue(str: string): number {
		if (!str) return 0;
		const cleanStr = str.replace(/\./g, '');
		const parsed = parseFloat(cleanStr);
		return isNaN(parsed) ? 0 : parsed;
	}

	$effect(() => {
		if (!isExternalUpdate) {
			displayValue = formatNumber(value);
		}
	});

	function handleFocus() {
		clearTimeout(blurTimeout);
		focusField(fieldId);
	}

	function handleBlur() {
		// Don't automatically clear focus on blur - let the focus management 
		// be handled by the new field gaining focus or explicit user actions
		clearTimeout(typingTimeout);
		setTypingStatus(fieldId, false);
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const rawValue = target.value;

		const cleanValue = rawValue.replace(/[^\d.]/g, '');

		const numericValue = parseDisplayValue(cleanValue);

		isExternalUpdate = true;
		value = numericValue;
		displayValue = cleanValue;
		isExternalUpdate = false;

		dispatch('input', { value: numericValue });

		setTypingStatus(fieldId, true);

		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			setTypingStatus(fieldId, false);
		}, 1000);
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const cleanValue = target.value.replace(/[^\d.]/g, '');
		const numericValue = parseDisplayValue(cleanValue);

		isExternalUpdate = true;
		displayValue = formatNumber(numericValue);
		value = numericValue;
		isExternalUpdate = false;

		updateField(fieldId, numericValue);
		dispatch('change', { value: numericValue });

		clearTimeout(typingTimeout);
		setTypingStatus(fieldId, false);
	}

	onDestroy(() => {
		clearTimeout(typingTimeout);
		clearTimeout(blurTimeout);
	});
</script>

<div class="relative">
	{#if hasFocus}
		<div
			class="pointer-events-none absolute -inset-1 z-10 rounded-lg border-2"
			style="border-color: {focusRingColor}"
		>
			<div
				class="absolute -top-6 left-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm"
				style="background-color: {focusRingColor}"
			>
				{focusedUser.name} is editing
			</div>
		</div>
	{/if}

	<Input
		bind:value={displayValue}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		type="text"
		inputmode="numeric"
		class="{hasFocus ? 'border-transparent ring-0' : ''} {className}"
		data-collaborative-input
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
		onchange={handleChange}
		{...restProps}
	/>
</div>
