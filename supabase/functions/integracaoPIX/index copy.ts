import "https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts";
import config from './config.js';

const getOAuthToken = async () => {
  try {
    console.log('Requesting OAuth token...');

    const basicAuth = config.oauth.basicAuth;

    const response = await fetch(config.oauth.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: 'grant_type=client_credentials&scope=cob.write cob.read cobv.write cobv.read lotecobv.write lotecobv.read pix.write pix.read webhook.read webhook.write payloadlocation.write payloadlocation.read'
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

Deno.serve(async (req) => {
  try {
    const token = await getOAuthToken();

    const proxyUrl = 'https://node-proxy-app-eb9446def7c0.herokuapp.com/proxy';
    const proxyResponse = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (proxyResponse.status === 401) {
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
        return new Response(JSON.stringify(retryErrorData), {
          headers: { "Content-Type": "application/json" },
          status: retryResponse.status,
        });
      }

      const retryData = await retryResponse.json();
      return new Response(JSON.stringify(retryData), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!proxyResponse.ok) {
      // Handle non-401 errors here
      const errorData = await proxyResponse.json();
      console.error(`Error from proxy: ${JSON.stringify(errorData)}`);
      return new Response(JSON.stringify(errorData), {
        headers: { "Content-Type": "application/json" },
        status: proxyResponse.status,
      });
    }

    const data = await proxyResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in function execution:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
