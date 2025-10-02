import { IamAuthenticator, CloudPakForDataAuthenticator } from "ibm-cloud-sdk-core"
import { WatsonXAI } from "@ibm-cloud/watsonx-ai"

/**
 * Fetches available embedded IBM watsonx models
 *
 * @param apiKey - The watsonx API key (for IBM Cloud or Cloud Pak with API key auth)
 * @param projectId - The watsonx project ID (ibmCloud or cloudPak)
 * @param baseUrl - Optional base URL for the watsonx API (ibmCloud or cloudPak)
 * @param platform - Optional platform type (ibmCloud or cloudPak)
 * @param authType - Optional authentication type (API key or password) for Cloud Pak for Data
 * @param username - Optional username for Cloud Pak for Data
 * @param password - Optional password for Cloud Pak for Data (when using password as auth type)
 * @returns A promise resolving to an object with model IDs as keys and model info as values
 */
export async function getEmbeddedWatsonxModels(
	apiKey?: string,
	projectId?: string,
	baseUrl?: string,
	platform?: string,
	authType?: string,
	username?: string,
	password?: string,
): Promise<Record<string, { dimension: number }>> {
	try {
		let options: any = {
			serviceUrl: baseUrl,
			version: "2024-05-31",
		}

		if (!platform) {
			throw new Error("Platform selection is required for IBM watsonx embedded provider")
		}

		if (platform === "ibmCloud") {
			if (!apiKey) {
				throw new Error("API key in IBM watsonx embedded provider is required for IBM Cloud")
			}
			if (!projectId) {
				throw new Error("Project ID in IBM watsonx embedded provider is required for IBM Cloud")
			}
			options.authenticator = new IamAuthenticator({
				apikey: apiKey,
			})
		} else if (platform === "cloudPak") {
			if (!baseUrl) {
				throw new Error("Base URL in IBM watsonx embedded provider is required for IBM Cloud Pak for Data")
			}
			if (!projectId) {
				throw new Error("Project ID in IBM watsonx embedded provider is required for IBM Cloud Pak for Data")
			}
			if (!username) {
				throw new Error("Username in IBM watsonx embedded provider is required for IBM Cloud Pak for Data")
			}
			if (!authType) {
				throw new Error(
					"Auth Type selection in IBM watsonx embedded provider is required for IBM Cloud Pak for Data",
				)
			}
			if (authType === "apiKey" && !apiKey) {
				throw new Error("API key in IBM watsonx embedded provider is required for IBM Cloud Pak for Data")
			}
			if (authType === "password" && !password) {
				throw new Error("Password in IBM watsonx embedded provider is required for IBM Cloud Pak for Data")
			}

			if (username) {
				if (password) {
					options.authenticator = new CloudPakForDataAuthenticator({
						url: `${baseUrl}/icp4d-api`,
						username: username,
						password: password,
					})
				} else if (apiKey) {
					options.authenticator = new CloudPakForDataAuthenticator({
						url: `${baseUrl}/icp4d-api`,
						username: username,
						apikey: apiKey,
					})
				}
			}
		}

		const service = WatsonXAI.newInstance(options)

		let knownEmbeddedModels: Record<string, { dimension: number }> = {}

		try {
			const response = await service.listFoundationModelSpecs({ filters: "function_embedding" })
			if (response && response.result) {
				const result = response.result as any

				const modelsList = result.models || result.resources || result.foundation_models || []

				if (Array.isArray(modelsList)) {
					for (const model of modelsList) {
						const modelId = model.id || model.name || model.model_id
						if (modelId.startsWith("ibm")) {
							const dimension = model.model_limits.embedding_dimension
							knownEmbeddedModels[modelId] = { dimension }
						}
					}
				}
			}
		} catch (error) {
			console.warn("Error fetching embedded models from IBM watsonx API:", error)
			return {}
		}
		return knownEmbeddedModels
	} catch (apiError) {
		console.error("Error fetching embedded IBM watsonx models:", apiError)
		return {}
	}
}
