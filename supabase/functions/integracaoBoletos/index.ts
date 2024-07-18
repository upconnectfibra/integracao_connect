import { sendStatusEmail } from './src/api/utils/emailUtils.js';
import { config } from './src/config.js';
import { fetchBoletos } from './src/api/services/boletosService.js';
import { processClientes } from './src/api/services/omieService.js';

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

Deno.serve(async (req) => {
  try {

    // Retorna a resposta imediatamente
    const response = new Response(JSON.stringify({ message: 'Requisição solicitada com sucesso' }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

   // Processa os boletos em segundo plano
   (async () => {
    try {
      const token = await getOAuthToken();
      const boletosData = await fetchBoletos(token);

      if (!boletosData || boletosData.length === 0) {
        console.error('No boletos data returned from fetchBoletos');
        return;
      }

      const { successList, errorList } = await processClientes(boletosData);

      // Enviar email com o resultado
      await sendStatusEmail(successList, errorList);
    } catch (error) {
      console.error('Error in background processing:', error.message);
      await sendStatusEmail([], [{ error: error.message }]); // Enviar email com o erro
    }
  })();

  return response;

  } catch (error) {
    console.error('Error in function execution:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
