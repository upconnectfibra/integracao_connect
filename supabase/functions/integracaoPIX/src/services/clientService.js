import { consultarCliente, incluirCliente } from '../api/omieClient.js';
import { decodeUnicode, sanitizeString, removeAccents } from '../utils/stringUtils.js';

export const processClients = async (pixArray) => {
  const clients = [];

  for (const pix of pixArray) {
    try {
      const sanitizedClientCode = sanitizeString(decodeUnicode(pix.pagador.nome)).substring(0, 15);
      let clienteData = await consultarCliente(sanitizedClientCode);

      if (clienteData && clienteData.result && clienteData.result.faultstring && clienteData.result.faultstring.includes('Cliente não cadastrado para o Código [0]')) {
        clienteData = await incluirCliente(sanitizedClientCode, pix.pagador.nome);
      }

      if (clienteData && clienteData.result && clienteData.result.codigo_cliente_omie) {
        const nCodCliente = clienteData.result.codigo_cliente_omie;
        clients.push({ pix, nCodCliente });
      } else {
        throw new Error('Failed to get or create cliente');
      }
    } catch (error) {
      console.error('Error processing client:', error.message);
      clients.push({ pix, error: error.message });
    }
  }

  return clients;
};
