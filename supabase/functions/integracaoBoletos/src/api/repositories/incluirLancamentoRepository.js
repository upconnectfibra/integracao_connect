import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 segundos

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

  return await response.json();
};

export const incluirLancamento = async (cCodIntLanc, dDtLanc, nValorLanc, nCodCliente) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await incluirLancamentoRequest(cCodIntLanc, dDtLanc, nValorLanc, nCodCliente);
      return data;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * attempt; // Exponential backoff
        console.warn(`Attempt ${attempt} to include transaction failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error including transaction:', error.message);
        throw new Error(`Error including transaction: ${error.message}`);
      }
    }
  }
};
