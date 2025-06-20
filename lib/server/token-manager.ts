import axios from "axios";

// This will hold the last known working token to avoid re-validating on every call.
let currentWorkingToken: string | null = null;
let lastValidationTimestamp: number = 0;
// We can shorten the validation timeout now that we have a self-healing mechanism
const VALIDATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Invalidates the currently cached working token.
 * This is called when an API request fails with the cached token,
 * forcing a re-validation on the next request.
 */
export function invalidateToken() {
    console.warn("Invalidating cached Qobuz token due to an API error.");
    currentWorkingToken = null;
    lastValidationTimestamp = 0;
}

/**
 * Checks if a token belongs to a user with an active subscription by inspecting the credential parameters.
 * @param token The Qobuz auth token to test.
 * @returns True if the token is valid and subscribed, false otherwise.
 */
async function testToken(token: string): Promise<boolean> {
    if (!token) return false;
    try {
        const url = new URL(process.env.QOBUZ_API_BASE + 'user/get');
        const response = await axios.get(url.toString(), {
            headers: {
                "x-app-id": process.env.QOBUZ_APP_ID!,
                "x-user-auth-token": token,
            },
            timeout: 5000 
        });

        const user = response.data;
        const canStream = user?.credential?.parameters?.lossless_streaming;

        if (canStream === true) {
            console.log(`Token validated successfully for user: ${user.login}`);
            return true;
        } else {
            console.warn(`Token is valid but does not have an active streaming subscription. User: ${user.login || 'Unknown'}`);
            return false;
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
             console.warn(`Token validation failed with status ${error.response?.status}. It is likely invalid or expired.`);
        } else {
            console.error('An unexpected error occurred during token validation:', error);
        }
        return false;
    }
}

/**
 * Retrieves a valid Qobuz token. It uses a cached token if available and still recent.
 * If no token is cached or the cache is stale, it iterates through the token pool to find a new working one.
 * @returns A valid Qobuz auth token.
 * @throws An error if no valid tokens are found in the environment pool.
 */
export async function getValidToken(): Promise<string> {
    const now = Date.now();
    
    // 1. Use cached token if it's not stale
    if (currentWorkingToken && (now - lastValidationTimestamp < VALIDATION_TIMEOUT_MS)) {
        return currentWorkingToken;
    }

    const tokens: string[] = JSON.parse(process.env.QOBUZ_AUTH_TOKENS || '[]');
    if (!tokens || tokens.length === 0) {
        throw new Error("QOBUZ_AUTH_TOKENS environment variable is empty. Please provide at least one valid token.");
    }

    // 2. Iterate through all tokens to find a working one
    console.log("No valid cached token found or cache is stale. Searching for a new working token...");
    for (const token of tokens) {
        if (await testToken(token)) {
            console.log("Found a working Qobuz token. Caching it for future requests.");
            currentWorkingToken = token;
            lastValidationTimestamp = now;
            return token;
        } else {
            console.warn("A token in the pool is invalid or unsubscribed. Trying next one...");
        }
    }

    // 3. If no tokens worked, throw an error.
    currentWorkingToken = null;
    throw new Error("No valid, subscribed Qobuz tokens were found in the provided list. All downloads will fail.");
}