import { config } from '../config.js';

const omieHeaders = {
  'Content-Type': 'application/json',
};

export const consultarCliente = async (codigoClienteIntegracao) => {
  const payload = {
    call: 'ConsultarCliente',
    app_key: config.omie.appKey,
    app_secret: config.omie.appSecret,
    param: [{ codigo_cliente_integracao: codigoClienteIntegracao }],
  };

  console.log('Payload para consultarCliente:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://app.omie.com.br/api/v1/geral/clientes/', {
    method: 'POST',
    headers: omieHeaders,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.faultstring.includes("Cliente não cadastrado para o Código [0]")) {
      console.log("Cliente não cadastrado, chamando API IncluirCliente...");
      return { data };
    } else {
      console.error('Error consulting client:', data.faultstring);
      await sendErrorEmail(data.faultstring);
      throw new Error(`Error consulting client: ${data.faultstring}`);
    }
  }

  return data;
};

export const incluirCliente = async (codigoClienteIntegracao, nomeCliente) => {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error including client: ${data.faultstring || response.statusText}`);
  }
  return data;
};

export const incluirLancamento = async (cCodIntLanc, dDtLanc, nValorLanc, nCodCliente) => {
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
