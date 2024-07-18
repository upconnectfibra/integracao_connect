// src/api/repositories/consultarClienteRepository.js
import { config } from '../../config.js';
import { delay } from '../utils/commonUtils.js';

export const consultarCliente = async (codigoClienteIntegracao) => {
  await delay(10000); // Delay de 10 segundos
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