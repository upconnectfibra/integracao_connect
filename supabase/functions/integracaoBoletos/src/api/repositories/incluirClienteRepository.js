// src/api/repositories/incluirClienteRepository.js
import { config } from '../../config.js';

const omieHeaders = {
  'Content-Type': 'application/json',
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
