/**
 * OpenAPI specification for the Salary Calculator Collaboration API
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

const openApiSpec = {
	openapi: '3.0.3',
	info: {
		title: 'Salary Calculator Collaboration API',
		description: 'API for sharing salary calculator sessions with secure OTP-based access',
		version: '1.0.0',
		contact: {
			name: 'API Support',
			email: 'support@example.com'
		},
		license: {
			name: 'MIT',
			url: 'https://opensource.org/licenses/MIT'
		}
	},
	servers: [
		{
			url: '{protocol}://{host}/api/v1',
			description: 'API Server',
			variables: {
				protocol: {
					enum: ['http', 'https'],
					default: 'https'
				},
				host: {
					default: 'localhost:5173',
					description: 'Server hostname'
				}
			}
		}
	],
	tags: [
		{
			name: 'Collaboration',
			description: 'Endpoints for sharing salary calculator sessions'
		}
	],
	paths: {
		'/share': {
			post: {
				tags: ['Collaboration'],
				summary: 'Create or update shared calculator session',
				description: 'Creates a new shared session or updates an existing one with fresh calculator data and rotated OTP. Only one session can be active at a time.',
				operationId: 'createOrUpdateShare',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ShareRequest' }
						}
					}
				},
				responses: {
					'200': {
						description: 'Session created or updated successfully',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ShareResponse' }
							}
						}
					},
					'400': {
						description: 'Invalid request data',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'500': {
						description: 'Internal server error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/share/history': {
			get: {
				tags: ['Collaboration'],
				summary: 'Get current active session',
				description: 'Retrieves the currently active shared calculator session, if any',
				operationId: 'getActiveSession',
				responses: {
					'200': {
						description: 'Successfully retrieved session information',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/SessionResponse' }
							}
						}
					},
					'500': {
						description: 'Internal server error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/share/deactivate': {
			post: {
				tags: ['Collaboration'],
				summary: 'Deactivate current shared session',
				description: 'Deactivates the currently active shared calculator session',
				operationId: 'deactivateSession',
				responses: {
					'200': {
						description: 'Session successfully deactivated',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/SuccessResponse' }
							}
						}
					},
					'500': {
						description: 'Internal server error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/share/{sessionId}/verify': {
			post: {
				tags: ['Collaboration'],
				summary: 'Verify OTP and access shared calculator data',
				description: 'Verifies the provided OTP code and returns calculator data if valid',
				operationId: 'verifyOTP',
				parameters: [
					{
						in: 'path',
						name: 'sessionId',
						required: true,
						schema: { type: 'string' },
						description: 'Session identifier from shared link',
						example: 'abc123def456'
					}
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/OTPVerifyRequest' }
						}
					}
				},
				responses: {
					'200': {
						description: 'OTP verified successfully',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/OTPVerifyResponse' }
							}
						}
					},
					'400': {
						description: 'Invalid request data',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'401': {
						description: 'Invalid or expired OTP',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'404': {
						description: 'Session not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'500': {
						description: 'Internal server error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		}
	},
	components: {
		schemas: {
			ShareRequest: {
				type: 'object',
				required: ['grossSalary', 'customerRate', 'config'],
				properties: {
					grossSalary: {
						type: 'number',
						minimum: 0,
						exclusiveMinimum: true,
						description: 'Annual gross salary in euros',
						example: 75000
					},
					customerRate: {
						type: 'number',
						minimum: 0,
						exclusiveMinimum: true,
						description: 'Hourly billing rate in euros',
						example: 110
					},
					config: {
						$ref: '#/components/schemas/CalculatorConfig'
					}
				}
			},
			ShareResponse: {
				type: 'object',
				properties: {
					sessionId: {
						type: 'string',
						description: 'Unique session identifier',
						example: 'abc123def456'
					},
					otpCode: {
						type: 'string',
						pattern: '^[A-Z0-9]{6}$',
						description: '6-character access code (valid for 30 minutes)',
						example: 'ABC123'
					},
					shareableLink: {
						type: 'string',
						format: 'uri',
						description: 'Complete URL for sharing',
						example: 'https://app.example.com/share/abc123def456'
					},
					otpExpiresAt: {
						type: 'string',
						format: 'date-time',
						description: 'ISO timestamp when OTP expires',
						example: '2024-01-15T14:30:00Z'
					},
					isUpdate: {
						type: 'boolean',
						description: 'True if this was an update to existing session',
						example: false
					}
				}
			},
			SessionResponse: {
				type: 'object',
				properties: {
					session: {
						oneOf: [
							{ type: 'null', description: 'No active session' },
							{ $ref: '#/components/schemas/SessionInfo' }
						]
					}
				}
			},
			SessionInfo: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'Unique session identifier',
						example: 'abc123def456'
					},
					otpCode: {
						type: 'string',
						pattern: '^[A-Z0-9]{6}$',
						description: 'Current 6-character access code',
						example: 'ABC123'
					},
					createdAt: {
						type: 'string',
						format: 'date-time',
						description: 'When session was initially created',
						example: '2024-01-15T14:00:00Z'
					},
					otpExpiresAt: {
						type: 'string',
						format: 'date-time',
						description: 'When current OTP expires',
						example: '2024-01-15T14:30:00Z'
					},
					shareableLink: {
						type: 'string',
						format: 'uri',
						description: 'Complete URL for sharing',
						example: 'https://app.example.com/share/abc123def456'
					}
				}
			},
			OTPVerifyRequest: {
				type: 'object',
				required: ['otpCode'],
				properties: {
					otpCode: {
						type: 'string',
						pattern: '^[A-Z0-9]{6}$',
						description: '6-character access code',
						example: 'ABC123'
					}
				}
			},
			OTPVerifyResponse: {
				type: 'object',
				properties: {
					valid: {
						type: 'boolean',
						example: true,
						description: 'Indicates successful verification'
					},
					calculatorData: {
						$ref: '#/components/schemas/CalculatorData'
					}
				}
			},
			CalculatorData: {
				type: 'object',
				properties: {
					grossSalary: {
						type: 'number',
						example: 75000,
						description: 'Annual gross salary in euros'
					},
					customerRate: {
						type: 'number',
						example: 110,
						description: 'Hourly billing rate in euros'
					},
					config: {
						$ref: '#/components/schemas/CalculatorConfig'
					}
				}
			},
			CalculatorConfig: {
				type: 'object',
				description: 'Calculator configuration settings',
				properties: {
					employerSocialContributionRate: {
						type: 'number',
						minimum: 0,
						maximum: 1,
						description: 'Employer social contribution rate (decimal)',
						example: 0.20
					},
					vacationDays: {
						type: 'number',
						minimum: 0,
						maximum: 60,
						description: 'Annual vacation days',
						example: 30
					},
					sickDaysEstimate: {
						type: 'number',
						minimum: 0,
						maximum: 30,
						description: 'Estimated annual sick days',
						example: 5
					},
					targetNetMargin: {
						type: 'number',
						minimum: 0,
						maximum: 1,
						description: 'Target net profit margin (decimal)',
						example: 0.20
					},
					overheadAsPercentOfRevenue: {
						type: 'number',
						minimum: 0,
						maximum: 1,
						description: 'Overhead costs as percentage of revenue (decimal)',
						example: 0.15
					},
					utilisationRate: {
						type: 'number',
						minimum: 0,
						maximum: 1,
						description: 'Expected utilization rate (decimal)',
						example: 0.85
					}
				}
			},
			SuccessResponse: {
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						example: true,
						description: 'Indicates successful operation'
					}
				}
			},
			ErrorResponse: {
				type: 'object',
				properties: {
					error: {
						type: 'string',
						description: 'Error message describing what went wrong',
						example: 'Invalid request data'
					}
				}
			}
		},
		securitySchemes: {
			SessionBasedAuth: {
				type: 'apiKey',
				in: 'cookie',
				name: 'session',
				description: 'Session-based authentication (future implementation)'
			}
		}
	}
};

export const GET: RequestHandler = async () => {
	return json(openApiSpec, {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};