// If your test needs data from credentials, you can add it here.
// as JSON.stringify({ id: 'credentials_ID', name: 'credentials_name' }) for specific credentials
// or as 'credentials_type' for all credentials of that type
// expected keys for credentials can be found in packages/nodes-base/credentials/[credentials_type].credentials.ts
export const FAKE_CREDENTIALS_DATA = {
	cloudConvertApi: {
		apiKey: 'fake-cloudconvert-access-token',
		apiUrl: 'https://api.cloudconvert.com',
		syncApiUrl: 'https://sync.api.cloudconvert.com',
		storageUrl: 'https://storage.cloudconvert.com',
	},
} as const;
