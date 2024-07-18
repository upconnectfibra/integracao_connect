import { consultarCliente, incluirCliente, incluirLancamento } from './src/api/omieClient.js';
import { decodeUnicode, sanitizeString, removeAccents } from './src/utils/nameUtils.js';
import { sendStatusEmail } from './src/utils/emailUtils.js';
import {config} from './src/config.js';

const getOAuthToken = async () => {
  try {
    console.log('Requesting OAuth token...');

    const basicAuth = config.oauth.basicAuth;

    const response = await fetch(config.oauth.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'cob.write cob.read cobv.write cobv.read lotecobv.write lotecobv.read pix.write pix.read webhook.read webhook.write payloadlocation.write payloadlocation.read'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to obtain OAuth token:', errorText);
      throw new Error(`Failed to obtain OAuth token: ${errorText}`);
    }

    const data = await response.json();
    console.log('OAuth token obtained:', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Error in getOAuthToken:', error.message);
    throw new Error('Failed to obtain OAuth token');
  }
};

const processPixPayload = async (pixPayload) => {
  const successList = [];
  const errorList = [];

  for (const pix of pixPayload.pix) {
    let { endToEndId, horario, valor, pagador } = pix;
    const { nome, cpf, cnpj } = pagador;

    endToEndId = endToEndId.slice(-20);

    const inputString = nome;
    const decodedString = decodeUnicode(inputString);
    const sanitizedString = sanitizeString(decodedString);
    const codigoClienteIntegracao = sanitizedString.length > 15 ? sanitizedString.substring(0, 15) : sanitizedString;

    try {
      let clienteResponse = await consultarCliente(codigoClienteIntegracao);
      console.log('Consult Client Response:', clienteResponse);
      if (clienteResponse.data && clienteResponse.data.faultstring && clienteResponse.data.faultstring.includes("Cliente não cadastrado para o Código [0]")) {
        const normalizedNome = removeAccents(decodedString);
        clienteResponse = await incluirCliente(codigoClienteIntegracao, normalizedNome);
      }

      const codigoClienteOmie = clienteResponse.codigo_cliente_omie;
      const dataLancamento = horario.split('T')[0].split('-').reverse().join('/');
      await incluirLancamento(endToEndId, dataLancamento, valor, codigoClienteOmie );

      successList.push({ endToEndId, cpf, nome, valor, chave: pix.chave, horario });
    } catch (error) {
      console.error('Error processing client or transaction:', error);
      errorList.push({ endToEndId, cpf, nome, valor, chave: pix.chave, horario, error: error.message });
    }
  }

  return { successList, errorList };
};

Deno.serve(async (req) => {
  try {
    const token = await getOAuthToken();

    const proxyUrl = 'https://node-proxy-app-eb9446def7c0.herokuapp.com/proxy';
    const proxyResponse = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (proxyResponse.status === 401) {
      const newToken = await getOAuthToken();
      const retryResponse = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!retryResponse.ok) {
        const retryErrorData = await retryResponse.json();
        console.error(`Error from proxy on retry: ${JSON.stringify(retryErrorData)}`);
        return new Response(JSON.stringify(retryErrorData), {
          headers: { "Content-Type": "application/json" },
          status: retryResponse.status,
        });
      }

      const retryData = await retryResponse.json();
      const { successList, errorList } = await processPixPayload(retryData);
      await sendStatusEmail(successList, errorList);

      return new Response(JSON.stringify({ success: successList, errors: errorList }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json();
      console.error(`Error from proxy: ${JSON.stringify(errorData)}`);
      return new Response(JSON.stringify(errorData), {
        headers: { "Content-Type": "application/json" },
        status: proxyResponse.status,
      });
    }

    const data = await proxyResponse.json();
    const { successList, errorList } = await processPixPayload(data);
    await sendStatusEmail(successList, errorList);

    return new Response(JSON.stringify({ success: successList, errors: errorList }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in function execution:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
