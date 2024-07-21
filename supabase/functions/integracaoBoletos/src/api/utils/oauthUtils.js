import { config } from '../../config.js';

export const getOAuthToken = async () => {
  try {
    console.log('Requesting OAuth token...');

    const basicAuth = config.oauth.basicAuth;

    const response = await fetch(config.oauth.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'cobrancas.boletos-requisicao cobrancas.boletos-info'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to obtain OAuth token:', errorText);
      throw new Error(`Failed to obtain OAuth token: ${errorText}`);
    }

    const data = await response.json();
    console.log('OAuth token obtained:', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Error in getOAuthToken:', error.message);
    throw new Error('Failed to obtain OAuth token');
  }
};
