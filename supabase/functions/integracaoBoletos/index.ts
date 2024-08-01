// src/index.js
import { sendStatusEmail } from './src/api/utils/emailUtils.js';
import { config } from './src/config.js';
import { fetchBoletos } from './src/api/services/boletosService.js';
import { processClientes, processarFilaDeBoletos } from './src/api/services/omieService.js';
import { getOAuthToken } from './src/api/utils/oauthUtils.js';

Deno.serve(async (req) => {
  try {
    const response = new Response(JSON.stringify({ message: 'Requisição solicitada com sucesso' }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

    

    // Processamento de boletos em segundo plano
    (async () => {
      // Processar boletos pendentes antes de qualquer coisa
      await processarFilaDeBoletos();
      try {
        const token = await getOAuthToken();
        const boletosData = await fetchBoletos(token);

        if (!boletosData || boletosData.length === 0) {
          console.error('No boletos data returned from fetchBoletos');
          return;
        }

        const { successList, errorList } = await processClientes(boletosData);

        // Enviar email com o resultado
        await sendStatusEmail();
      } catch (error) {
        console.error('Error in background processing:', error.message);
        await sendStatusEmail([], [{ error: error.message }]);
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