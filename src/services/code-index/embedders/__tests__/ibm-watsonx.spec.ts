import { IbmWatsonxEmbedder } from "../ibm-watsonx"
import { WatsonXAI } from "@ibm-cloud/watsonx-ai"
import { IamAuthenticator, CloudPakForDataAuthenticator } from "ibm-cloud-sdk-core"
import { MAX_ITEM_TOKENS } from "../../constants"
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"

// Mock the WatsonXAI class and authenticators
vi.mock("@ibm-cloud/watsonx-ai")
vi.mock("ibm-cloud-sdk-core")
vi.mock("../../../../i18n", () => ({
	t: vi.fn((key, params) => {
		if (key === "embeddings:textExceedsTokenLimit") {
			return `Text at index ${params.index} exceeds token limit: ${params.itemTokens} > ${params.maxTokens}`
		}
		return key
	}),
}))

describe("IbmWatsonxEmbedder", () => {
	// Reset mocks before each test
	beforeEach(() => {
		vi.clearAllMocks()
		;(WatsonXAI.newInstance as any).mockImplementation(() => ({
			embedText: vi.fn(),
			listFoundationModelSpecs: vi.fn(),
		}))
	})

	describe("constructor", () => {
		test("should throw error if platform is not provided", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key")
			}).toThrow("Platform selection is required for IBM watsonx embedded provider")
		})

		test("should throw error if apiKey is not provided for ibmCloud platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("", undefined, undefined, "ibmCloud")
			}).toThrow("API key is required in IBM watsonx embedded provider for IBM Cloud")
		})

		test("should throw error if projectId is not provided for ibmCloud platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key", undefined, undefined, "ibmCloud")
			}).toThrow("Project ID is required in IBM watsonx embedded provider for IBM Cloud")
		})

		test("should throw error if baseUrl is not provided for ibmCloud platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key", undefined, "project-id", "ibmCloud")
			}).toThrow("Base URL is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should create instance with ibmCloud platform", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			expect(IamAuthenticator).toHaveBeenCalledWith({ apikey: "api-key" })
			expect(WatsonXAI.newInstance).toHaveBeenCalledWith(
				expect.objectContaining({
					version: "2024-05-31",
					serviceUrl: "https://api.example.com",
					authenticator: expect.any(Object),
				}),
			)
		})

		test("should throw error if baseUrl is not provided for cloudPak platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key", undefined, undefined, "cloudPak")
			}).toThrow("Base URL is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should throw error if projectId is not provided for cloudPak platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key", undefined, undefined, "cloudPak", "https://api.example.com")
			}).toThrow("Project ID is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should throw error if username is not provided for cloudPak platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder("api-key", undefined, "project-id", "cloudPak", "https://api.example.com")
			}).toThrow("Username is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should throw error if authType is not provided for cloudPak platform", () => {
			expect(() => {
				new IbmWatsonxEmbedder(
					"api-key",
					undefined,
					"project-id",
					"cloudPak",
					"https://api.example.com",
					undefined,
					undefined,
					"username",
				)
			}).toThrow("Auth Type selection is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should throw error if apiKey is not provided for cloudPak platform with apiKey auth", () => {
			expect(() => {
				new IbmWatsonxEmbedder(
					"",
					undefined,
					"project-id",
					"cloudPak",
					"https://api.example.com",
					undefined,
					"apiKey",
					"username",
				)
			}).toThrow("API key is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should throw error if password is not provided for cloudPak platform with password auth", () => {
			expect(() => {
				new IbmWatsonxEmbedder(
					"api-key",
					undefined,
					"project-id",
					"cloudPak",
					"https://api.example.com",
					undefined,
					"password",
					"username",
				)
			}).toThrow("Password is required in IBM watsonx embedded provider for IBM Cloud Pak for Data")
		})

		test("should create instance with cloudPak platform using password auth", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"cloudPak",
				"https://api.example.com",
				undefined,
				"password",
				"username",
				"password123",
			)

			expect(CloudPakForDataAuthenticator).toHaveBeenCalledWith({
				url: "https://api.example.com/icp4d-api",
				username: "username",
				password: "password123",
			})
			expect(WatsonXAI.newInstance).toHaveBeenCalledWith(
				expect.objectContaining({
					version: "2024-05-31",
					serviceUrl: "https://api.example.com",
					authenticator: expect.any(Object),
				}),
			)
		})

		test("should create instance with cloudPak platform using apiKey auth", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"cloudPak",
				"https://api.example.com",
				undefined,
				"apiKey",
				"username",
			)

			expect(CloudPakForDataAuthenticator).toHaveBeenCalledWith({
				url: "https://api.example.com/icp4d-api",
				username: "username",
				apikey: "api-key",
			})
			expect(WatsonXAI.newInstance).toHaveBeenCalledWith(
				expect.objectContaining({
					version: "2024-05-31",
					serviceUrl: "https://api.example.com",
					authenticator: expect.any(Object),
				}),
			)
		})

		test("should use default model if not provided", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				undefined,
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Access private property for testing
			expect((embedder as any).modelId).toBe("ibm/slate-125m-english-rtrvr-v2")
		})
	})

	describe("getExpectedDimension", () => {
		test("should return correct dimension for known models", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Access private method for testing
			const getExpectedDimension = (embedder as any).getExpectedDimension.bind(embedder)

			expect(getExpectedDimension("ibm/slate-125m-english-rtrvr-v2")).toBe(768)
			expect(getExpectedDimension("ibm/slate-125m-english-rtrvr")).toBe(768)
			expect(getExpectedDimension("ibm/slate-30m-english-rtrvr-v2")).toBe(384)
			expect(getExpectedDimension("ibm/slate-30m-english-rtrvr")).toBe(384)
			expect(getExpectedDimension("ibm/granite-embedding-107m-multilingual")).toBe(384)
			expect(getExpectedDimension("ibm/granite-embedding-278M-multilingual")).toBe(768)
		})

		test("should return default dimension for unknown models", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Access private method for testing
			const getExpectedDimension = (embedder as any).getExpectedDimension.bind(embedder)

			expect(getExpectedDimension("unknown-model")).toBe(768)
		})
	})

	describe("createEmbeddings", () => {
		test("should handle empty text input", async () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			const result = await embedder.createEmbeddings([""])

			expect(result.embeddings).toEqual([[]])
			expect(result.usage).toEqual({ promptTokens: 0, totalTokens: 0 })
			expect((embedder as any).watsonxClient.embedText).not.toHaveBeenCalled()
		})

		test("should handle text exceeding token limit", async () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Create a very long text that would exceed token limit
			const longText = "a".repeat(MAX_ITEM_TOKENS * 5)

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

			const result = await embedder.createEmbeddings([longText])

			expect(result.embeddings).toEqual([[]])
			expect(result.usage).toEqual({ promptTokens: 0, totalTokens: 0 })
			expect(consoleSpy).toHaveBeenCalled()
			expect((embedder as any).watsonxClient.embedText).not.toHaveBeenCalled()

			consoleSpy.mockRestore()
		})

		test("should process valid text and return embeddings", async () => {
			const mockEmbedding = [0.1, 0.2, 0.3]
			const mockResponse = {
				result: {
					results: [{ embedding: mockEmbedding }],
					input_token_count: 5,
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.embedText.mockResolvedValue(mockResponse)

			const result = await embedder.createEmbeddings(["test text"])

			expect(result.embeddings).toEqual([mockEmbedding])
			expect(result.usage).toEqual({ promptTokens: 5, totalTokens: 5 })
			expect((embedder as any).watsonxClient.embedText).toHaveBeenCalledWith({
				modelId: "model-id",
				inputs: ["test text"],
				projectId: undefined,
				parameters: {
					truncate_input_tokens: MAX_ITEM_TOKENS,
					return_options: {
						input_text: true,
					},
				},
			})
		})

		test("should handle empty embedding result and create fallback", async () => {
			const mockResponse = {
				result: {
					results: [{ embedding: [] }],
					input_token_count: 5,
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.embedText.mockResolvedValue(mockResponse)
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			const result = await embedder.createEmbeddings(["test text"])

			expect(result.embeddings[0].length).toBe(768) // Default dimension
			expect(result.embeddings[0].every((val) => val === 0.0001)).toBe(true) // All values should be 0.0001
			expect(consoleSpy).toHaveBeenCalled()

			consoleSpy.mockRestore()
		})

		test("should retry on API failure", async () => {
			const mockError = new Error("API error")
			const mockEmbedding = [0.1, 0.2, 0.3]
			const mockResponse = {
				result: {
					results: [{ embedding: mockEmbedding }],
					input_token_count: 5,
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Mock embedText to fail once then succeed
			;(embedder as any).watsonxClient.embedText
				.mockRejectedValueOnce(mockError)
				.mockResolvedValueOnce(mockResponse)

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
			const originalSetTimeout = global.setTimeout

			// Mock setTimeout without replacing the entire function
			vi.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
				callback()
				return 0 as any
			})

			const result = await embedder.createEmbeddings(["test text"])

			expect(result.embeddings).toEqual([mockEmbedding])
			expect((embedder as any).watsonxClient.embedText).toHaveBeenCalledTimes(2)
			expect(consoleSpy).toHaveBeenCalled()

			consoleSpy.mockRestore()
			global.setTimeout = originalSetTimeout
		})

		test("should handle multiple texts", async () => {
			const mockEmbedding1 = [0.1, 0.2, 0.3]
			const mockEmbedding2 = [0.4, 0.5, 0.6]

			const mockResponse1 = {
				result: {
					results: [{ embedding: mockEmbedding1 }],
					input_token_count: 5,
				},
			}

			const mockResponse2 = {
				result: {
					results: [{ embedding: mockEmbedding2 }],
					input_token_count: 7,
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.embedText
				.mockResolvedValueOnce(mockResponse1)
				.mockResolvedValueOnce(mockResponse2)

			const originalSetTimeout = global.setTimeout

			// Mock setTimeout without replacing the entire function
			vi.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
				callback()
				return 0 as any
			})

			const result = await embedder.createEmbeddings(["text1", "text2"])

			expect(result.embeddings).toEqual([mockEmbedding1, mockEmbedding2])
			expect(result.usage).toEqual({ promptTokens: 12, totalTokens: 12 })

			global.setTimeout = originalSetTimeout
		})

		test("should handle API failure after max retries", async () => {
			const mockError = new Error("API error")

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			// Mock embedText to always fail
			;(embedder as any).watsonxClient.embedText.mockRejectedValue(mockError)

			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
			const originalSetTimeout = global.setTimeout

			// Mock setTimeout without replacing the entire function
			vi.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
				callback()
				return 0 as any
			})

			const result = await embedder.createEmbeddings(["test text"])

			expect(result.embeddings).toEqual([[]])
			expect(result.usage).toEqual({ promptTokens: 0, totalTokens: 0 })
			expect((embedder as any).watsonxClient.embedText).toHaveBeenCalledTimes(3) // MAX_RETRIES = 3
			expect(consoleErrorSpy).toHaveBeenCalled()

			consoleWarnSpy.mockRestore()
			consoleErrorSpy.mockRestore()
			global.setTimeout = originalSetTimeout
		})
	})

	describe("validateConfiguration", () => {
		test("should return valid=true for successful validation", async () => {
			const mockResponse = {
				result: {
					results: [{ embedding: [0.1, 0.2, 0.3] }],
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.embedText.mockResolvedValue(mockResponse)

			const result = await embedder.validateConfiguration()

			expect(result).toEqual({ valid: true })
			expect((embedder as any).watsonxClient.embedText).toHaveBeenCalledWith({
				modelId: "model-id",
				inputs: ["test"],
				projectId: undefined,
				parameters: {
					truncate_input_tokens: MAX_ITEM_TOKENS,
					return_options: {
						input_text: true,
					},
				},
			})
		})

		test("should return valid=false for invalid response format", async () => {
			const mockResponse = {
				result: {
					// Missing results array
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.embedText.mockResolvedValue(mockResponse)
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			const result = await embedder.validateConfiguration()

			expect(result).toEqual({
				valid: false,
				error: "embeddings:validation.invalidResponse",
			})
			expect(consoleSpy).toHaveBeenCalled()

			consoleSpy.mockRestore()
		})

		test("should handle API errors with appropriate error messages", async () => {
			const testCases = [
				{
					error: new Error("401 Unauthorized"),
					expectedError: "embeddings:validation.invalidApiKey (401 Unauthorized)",
				},
				{
					error: new Error("404 Not found"),
					expectedError: "embeddings:validation.endpointNotFound (404 Not found)",
				},
				{
					error: new Error("Connection timeout"),
					expectedError: "embeddings:validation.connectionTimeout (Connection timeout)",
				},
				{
					error: new Error("Invalid project ID"),
					expectedError: "embeddings:validation.invalidProjectId (Invalid project ID)",
				},
				{
					error: new Error("Invalid model ID"),
					expectedError: "embeddings:validation.invalidModelId (Invalid model ID)",
				},
				{
					error: new Error("Some other error"),
					expectedError: "embeddings:validation.unknownError (Some other error)",
				},
			]

			for (const testCase of testCases) {
				const embedder = new IbmWatsonxEmbedder(
					"api-key",
					"model-id",
					"project-id",
					"ibmCloud",
					"https://api.example.com",
				)

				;(embedder as any).watsonxClient.embedText.mockRejectedValue(testCase.error)
				const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

				const result = await embedder.validateConfiguration()

				expect(result).toEqual({
					valid: false,
					error: testCase.expectedError,
				})

				consoleSpy.mockRestore()
			}
		})
	})

	describe("getAvailableModels", () => {
		test("should return models from API response", async () => {
			const mockResponse = {
				result: {
					models: [
						{
							id: "model1",
							model_limits: { embedding_dimension: 512 },
						},
						{
							id: "model2",
							model_limits: { embedding_dimension: 1024 },
						},
					],
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.listFoundationModelSpecs.mockResolvedValue(mockResponse)

			const result = await embedder.getAvailableModels()

			expect(result).toEqual({
				"ibm/slate-125m-english-rtrvr-v2": { dimension: 768 },
				model1: { dimension: 512 },
				model2: { dimension: 1024 },
			})
			expect((embedder as any).watsonxClient.listFoundationModelSpecs).toHaveBeenCalledWith({
				filters: "function_embedding",
			})
		})

		test("should handle resources format in API response", async () => {
			const mockResponse = {
				result: {
					resources: [
						{
							name: "model1",
							model_limits: { embedding_dimension: 512 },
						},
					],
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.listFoundationModelSpecs.mockResolvedValue(mockResponse)

			const result = await embedder.getAvailableModels()

			expect(result).toEqual({
				"ibm/slate-125m-english-rtrvr-v2": { dimension: 768 },
				model1: { dimension: 512 },
			})
		})

		test("should handle foundation_models format in API response", async () => {
			const mockResponse = {
				result: {
					foundation_models: [
						{
							model_id: "model1",
							model_limits: { embedding_dimension: 512 },
						},
					],
				},
			}

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.listFoundationModelSpecs.mockResolvedValue(mockResponse)

			const result = await embedder.getAvailableModels()

			expect(result).toEqual({
				"ibm/slate-125m-english-rtrvr-v2": { dimension: 768 },
				model1: { dimension: 512 },
			})
		})

		test("should handle API errors and return default models", async () => {
			const mockError = new Error("API error")

			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			;(embedder as any).watsonxClient.listFoundationModelSpecs.mockRejectedValue(mockError)
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

			const result = await embedder.getAvailableModels()

			expect(result).toEqual({
				"ibm/slate-125m-english-rtrvr-v2": { dimension: 768 },
			})
			expect(consoleSpy).toHaveBeenCalled()

			consoleSpy.mockRestore()
			consoleErrorSpy.mockRestore()
		})
	})

	describe("embedderInfo", () => {
		test("should return correct embedder info", () => {
			const embedder = new IbmWatsonxEmbedder(
				"api-key",
				"model-id",
				"project-id",
				"ibmCloud",
				"https://api.example.com",
			)

			expect(embedder.embedderInfo).toEqual({
				name: "ibm-watsonx",
			})
		})
	})
})

// Made with Bob
