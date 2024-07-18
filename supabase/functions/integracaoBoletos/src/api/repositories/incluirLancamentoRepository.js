// src/api/repositories/incluirLancamentoRepository.js
import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

export const incluirLancamento = async (cCodIntLanc, dDtLanc, nValorLanc, nCodCliente) => {
  await delay(10000); // Delay de 10 segundos

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
        cCodCateg: '1.01.96',
        cTipo: 'PIX',
        nCodCliente,
        cObs: 'Pagamento com transferências no PIX',
      },
    }],
  };

  console.log('Payload para incluirLancamento:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://app.omie.com.br/api/v1/financas/contacorrentelancamentos/', {
    method: 'POST',
    headers: omieHeaders,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error including transaction: ${data.faultstring || response.statusText}`);
  }

  return data;
};
