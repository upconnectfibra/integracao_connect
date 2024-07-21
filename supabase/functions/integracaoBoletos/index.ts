import { sendStatusEmail } from './src/api/utils/emailUtils.js';
import { config } from './src/config.js';
import { fetchBoletos } from './src/api/services/boletosService.js';
import { processClientes } from './src/api/services/omieService.js';
import { getOAuthToken } from './src/api/utils/oauthUtils.js';

Deno.serve(async (req) => {
  try {
    const response = new Response(JSON.stringify({ message: 'Requisição solicitada com sucesso' }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
//processamento de boletos em segundo plano
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
