<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import Code from '@lucide/svelte/icons/code';
	import FileText from '@lucide/svelte/icons/file-text';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	
	const endpoints = [
		{
			method: 'POST',
			path: '/api/v1/share',
			description: 'Create or update shared calculator session',
			params: [],
			body: {
				grossSalary: 'number (>0)',
				customerRate: 'number (>0)',
				config: 'CalculatorConfig object'
			}
		},
		{
			method: 'GET',
			path: '/api/v1/share/history',
			description: 'Get current active session',
			params: [],
			body: null
		},
		{
			method: 'POST',
			path: '/api/v1/share/deactivate',
			description: 'Deactivate current shared session',
			params: [],
			body: null
		},
		{
			method: 'POST',
			path: '/api/v1/share/{sessionId}/verify',
			description: 'Verify OTP and access shared calculator data',
			params: [{ name: 'sessionId', description: 'Session identifier' }],
			body: {
				otpCode: 'string (6 characters, A-Z0-9)'
			}
		}
	];
	
	function getMethodColor(method: string) {
		switch (method) {
			case 'GET': return 'bg-blue-100 text-blue-800';
			case 'POST': return 'bg-green-100 text-green-800';
			case 'PUT': return 'bg-yellow-100 text-yellow-800';
			case 'DELETE': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>API Documentation - Salary Calculator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
	<div class="mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
				Salary Calculator Collaboration API
			</h1>
			<p class="text-gray-600 dark:text-gray-300 mb-4">
				API documentation for sharing salary calculator sessions with secure OTP-based access
			</p>
			<div class="flex gap-4">
				<Badge variant="secondary" class="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
					Version 1.0.0
				</Badge>
				<Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
					OpenAPI 3.0.3
				</Badge>
				<a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="flex items-center gap-2">
						<FileText class="h-4 w-4" />
						OpenAPI Spec
						<ExternalLink class="h-3 w-3" />
					</Button>
				</a>
			</div>
		</div>

		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Code class="h-5 w-5" />
						Overview
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<p class="text-sm text-muted-foreground">
							The Collaboration API enables secure sharing of salary calculator sessions through unique links and rotating OTP codes.
						</p>
						
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div class="p-4 bg-blue-50 rounded-lg dark:bg-blue-950/30">
								<h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Single Session</h4>
								<p class="text-sm text-blue-700 dark:text-blue-200">Only one active session per user at a time</p>
							</div>
							<div class="p-4 bg-green-50 rounded-lg dark:bg-green-950/30">
								<h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">30-min OTP</h4>
								<p class="text-sm text-green-700 dark:text-green-200">Access codes rotate every 30 minutes for security</p>
							</div>
							<div class="p-4 bg-purple-50 rounded-lg dark:bg-purple-950/30">
								<h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">REST API</h4>
								<p class="text-sm text-purple-700 dark:text-purple-200">JSON request/response format</p>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Endpoints</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each endpoints as endpoint}
							<div class="border rounded-lg p-4 dark:border-gray-700">
								<div class="flex items-center gap-3 mb-3">
									<Badge class={getMethodColor(endpoint.method)}>
										{endpoint.method}
									</Badge>
									<code class="font-mono text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-800">
										{endpoint.path}
									</code>
								</div>
								
								<p class="text-sm text-muted-foreground mb-3">
									{endpoint.description}
								</p>
								
								{#if endpoint.params.length > 0}
									<div class="mb-3">
										<h5 class="font-medium mb-2">Path Parameters:</h5>
										<ul class="text-sm space-y-1">
											{#each endpoint.params as param}
												<li>
													<code class="font-mono bg-gray-100 px-1 rounded dark:bg-gray-800">{param.name}</code>
													- {param.description}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								
								{#if endpoint.body}
									<div>
										<h5 class="font-medium mb-2">Request Body:</h5>
										<div class="bg-gray-50 p-3 rounded font-mono text-sm dark:bg-gray-800">
											<pre>{JSON.stringify(endpoint.body, null, 2)}</pre>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Authentication & Security</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<div class="p-4 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-300">
							<h4 class="font-semibold mb-2">Security Features</h4>
							<ul class="text-sm space-y-1">
								<li>• OTP codes rotate every 30 minutes automatically</li>
								<li>• Session links remain valid, but require fresh OTP</li>
								<li>• Only one active session per user</li>
								<li>• Input validation on all endpoints</li>
								<li>• Secure session management</li>
							</ul>
						</div>
						
						<div class="p-4 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-300">
							<h4 class="font-semibold mb-2">Usage Flow</h4>
							<ol class="text-sm space-y-1">
								<li>1. Create/update session with calculator data</li>
								<li>2. Share link and OTP through different channels</li>
								<li>3. Recipient accesses link and enters OTP</li>
								<li>4. Calculator data is loaded automatically</li>
								<li>5. OTP rotates every 30 minutes for ongoing access</li>
							</ol>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>