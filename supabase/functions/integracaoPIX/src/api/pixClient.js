import config from '../config.js';

export const fetchPfxFile = async () => {
  try {
    console.log('Fetching PFX file from URL:', config.supabase.pfxUrl);
    const response = await fetch(config.supabase.pfxUrl);
    if (!response.ok) {
      console.error('Failed to fetch PFX file:', response.statusText);
      throw new Error(`Failed to fetch PFX file: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    console.log('PFX file fetched successfully');
    return new Uint8Array(buffer);
  } catch (error) {
    console.error('Unable to load PFX certificate:', error.message);
    throw new Error('Unable to load PFX certificate');
  }
};

export const fetchPixData = async (token) => {
  try {
    console.log('Creating HTTPS request to PIX API via proxy');
    const proxyUrl = 'https://node-proxy-app-eb9446def7c0.herokuapp.com/proxy';
    const response = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Retry with a new token if unauthorized
      const newToken = await getOAuthToken();
      const retryResponse = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!retryResponse.ok) {
        const retryErrorData = await retryResponse.json();
        console.error(`Error from proxy on retry: ${JSON.stringify(retryErrorData)}`);
        throw new Error(`Error from proxy on retry: ${JSON.stringify(retryErrorData)}`);
      }

      const retryData = await retryResponse.json();
      return retryData;
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error from proxy: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from proxy: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Problem with request:', error.message);
    throw new Error(`Problem with request: ${error.message}`);
  }
};
