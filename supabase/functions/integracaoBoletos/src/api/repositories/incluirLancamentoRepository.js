//src/api/repositories/incluirLancamentoRepository.js
import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 20000; // 20 segundos
const MISUSE_API_PROCESS_RETRY_DELAY = 300000; // 300 segundos (5 minutos)

const incluirLancamentoRequest = async (cCodIntLanc, dDtLanc, nValorLanc, nCodCliente) => {
  const payload = {
    call: 'IncluirLancCC',
    app_key: config.omie.appKey,
    app_secret: config.omie.appSecret,
    param: [{
      cCodIntLanc,
      cabecalho: {
        nCodCC: 8425030844,
        dDtLanc,
        nValorLanc,
      },
      detalhes: {
        cCodCateg: '1.01.99',
        cTipo: 'BOL',
        nCodCliente,
        cObs: 'Liquidação Boleto Internet',
      },
    }],
  };

  console.log('Payload para incluirLancamento:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://app.omie.com.br/api/v1/financas/contacorrentelancamentos/', {
    method: 'POST',
    headers: omieHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();

  // Verifique se há um faultcode específico na resposta
  if (data.faultcode && (data.faultcode === 'SOAP-ENV:Client-102' || data.faultcode === 'MISUSE_API_PROCESS')) {
    throw new Error(`${data.faultcode}: ${data.faultstring}`);
  }

  return data;
};

export const incluirLancamento = async (cCodIntLanc, dDtLanc, nValorLanc, nCodCliente) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await incluirLancamentoRequest(cCodIntLanc, dDtLanc, nValorLanc, nCodCliente);
      return data;
    } catch (error) {
      if (error.message.includes('SOAP-ENV:Client-102')) {
        // Lançar o erro diretamente sem retry para SOAP-ENV:Client-102
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        const retryDelay = error.message.includes('MISUSE_API_PROCESS') ? MISUSE_API_PROCESS_RETRY_DELAY : INITIAL_RETRY_DELAY * attempt; // Exponential backoff or specific delay for MISUSE_API_PROCESS
        console.warn(`Attempt ${attempt} to include transaction failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error including transaction:', error.message);
        throw new Error(`Error including transaction: ${error.message}`);
      }
    }
  }
};
