import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 segundos

const consultarClienteRequest = async (codigoClienteIntegracao) => {
  const urlOmie = `${config.omie.apiUrl}/geral/clientes/`;
  
  const payload = {
    call: "ConsultarCliente",
    app_key: config.omie.appKey,
    app_secret: config.omie.appSecret,
    param: [{
      codigo_cliente_integracao: codigoClienteIntegracao
    }]
  };

  console.log('Payload para consultarCliente:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(urlOmie, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return await response.json();
};

export const consultarCliente = async (codigoClienteIntegracao) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await consultarClienteRequest(codigoClienteIntegracao);
      
      if (data.faultstring && data.faultstring.includes("Cliente não cadastrado para o Código [0]")) {
        console.log("Cliente não cadastrado, chamando API IncluirCliente...");
        return { data };
      }

      return data;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      } else {
        console.error('Max retries reached. Error consulting client:', error.message);
        await sendErrorEmail(error.message);
        throw new Error(`Error consulting client: ${error.message}`);
      }
    }
  }
};
