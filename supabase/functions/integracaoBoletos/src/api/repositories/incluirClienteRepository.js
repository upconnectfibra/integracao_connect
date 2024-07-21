import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 segundos

const incluirClienteRequest = async (codigoClienteIntegracao, nomeCliente) => {
  const payload = {
    call: 'IncluirCliente',
    app_key: config.omie.appKey,
    app_secret: config.omie.appSecret,
    param: [{
      codigo_cliente_integracao: codigoClienteIntegracao,
      razao_social: nomeCliente,
      nome_fantasia: nomeCliente,
    }],
  };

  console.log('Payload para incluirCliente:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://app.omie.com.br/api/v1/geral/clientes/', {
    method: 'POST',
    headers: omieHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return await response.json();
};

export const incluirCliente = async (codigoClienteIntegracao, nomeCliente) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await incluirClienteRequest(codigoClienteIntegracao, nomeCliente);
      return data;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * attempt; // Exponential backoff
        console.warn(`Attempt ${attempt} to include client failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error including client:', error.message);
        throw new Error(`Error including client: ${error.message}`);
      }
    }
  }
};
