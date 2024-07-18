import { incluirLancamentoCC } from '../api/omieClient.js';
import { formatDate } from '../utils/dateUtils.js';

export const processPayments = async (clients) => {
  const successList = [];
  const errorList = [];

  for (const client of clients) {
    if (client.error) {
      errorList.push(client);
      continue;
    }

    try {
      await incluirLancamentoCC(client.pix, client.nCodCliente);
      successList.push(client.pix);
    } catch (error) {
      console.error('Error processing payment:', error.message);
      errorList.push({ pix: client.pix, error: error.message });
    }
  }

  return { successList, errorList };
};
