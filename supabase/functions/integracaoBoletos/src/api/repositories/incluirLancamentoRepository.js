// src/api/repositories/incluirLancamentoRepository.js
import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 segundo

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
  await delay(10000); // Delay de 10 segundos

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await incluirLancamentoRequest(cCodIntLanc, dDtLanc, nValorLanc, nCodCliente);
      return data;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`Attempt ${attempt} to include transaction failed: ${error.message}. Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      } else {
        console.error('Max retries reached. Error including transaction:', error.message);
        throw new Error(`Error including transaction: ${error.message}`);
      }
    }
  }
};
