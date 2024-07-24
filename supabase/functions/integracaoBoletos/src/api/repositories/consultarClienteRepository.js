import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';
import { decodeUnicode } from '../utils/stringUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 15000; // 15 segundos
const MISUSE_API_PROCESS_RETRY_DELAY = 300000; // 300 segundos (5 minutos)

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
    headers: omieHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();

  // Verifique se o cliente não está cadastrado pelo faultcode
  if (data.faultcode && data.faultcode === "SOAP-ENV:Client-103") {
    const decodedError = decodeUnicode(data.faultstring);
    throw new Error(decodedError);
  }

  // Verifique se há um faultcode específico na resposta
  if (data.faultcode && data.faultcode === 'MISUSE_API_PROCESS') {
    throw new Error(`${data.faultcode}: ${data.faultstring}`);
  }

  return data;
};

export const consultarCliente = async (codigoClienteIntegracao) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await consultarClienteRequest(codigoClienteIntegracao);
    } catch (error) {
      if (error.message.includes("SOAP-ENV:Client-103")) {
        throw error; // Cliente não cadastrado, siga o fluxo para incluir o cliente
      }
      if (attempt < MAX_RETRIES) {
        const retryDelay = error.message.includes('MISUSE_API_PROCESS') ? MISUSE_API_PROCESS_RETRY_DELAY : INITIAL_RETRY_DELAY * attempt; // Exponential backoff or specific delay for MISUSE_API_PROCESS
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error consulting client:', error.message);
        throw new Error(`Error consulting client: ${error.message}`);
      }
    }
  }
};
