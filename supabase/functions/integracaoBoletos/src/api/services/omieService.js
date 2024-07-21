import { decodeUnicode, sanitizeString, adjustStringLength, removeAccents } from '../utils/stringUtils.js';
import { consultarCliente } from '../repositories/consultarClienteRepository.js';
import { incluirCliente } from '../repositories/incluirClienteRepository.js';
import { incluirLancamento } from '../repositories/incluirLancamentoRepository.js';
import { formatDateToDDMMYYYY } from '../utils/dateUtils.js';
import { delay } from '../utils/commonUtils.js';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 segundos

const processBoleto = async (boleto, successList, errorList) => {
  const decodedString = decodeUnicode(boleto.nomeSacadoCobranca);
  const sanitizedString = sanitizeString(decodedString);
  const codigoClienteIntegracao = adjustStringLength(sanitizedString, 15);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let clienteData;
      try {
        clienteData = await consultarCliente(codigoClienteIntegracao);
      } catch (error) {
        if (error.message.includes("SOAP-ENV:Client-103")) {
          const nomeCliente = removeAccents(decodedString);
          clienteData = await incluirCliente(codigoClienteIntegracao, nomeCliente);
        } else {
          throw error; // Re-lançar erro para retentativa
        }
      }

      const codigoClienteOmie = clienteData.codigo_cliente_omie;
      const dataLancamento = formatDateToDDMMYYYY(new Date(boleto.dataRecebimentoTitulo.split('.').reverse().join('-')));
      await incluirLancamento(boleto.numeroTituloCedenteCobranca, dataLancamento, boleto.valorAtualTituloCobranca, codigoClienteOmie);

      successList.push({
        numeroTituloCedenteCobranca: boleto.numeroTituloCedenteCobranca,
        nomeSacadoCobranca: boleto.nomeSacadoCobranca,
        valorAtualTituloCobranca: boleto.valorAtualTituloCobranca
      });
      return; // Saída do loop de retry em caso de sucesso
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * attempt; // Exponential backoff
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error processing client or transaction:', error.message);
        errorList.push({
          numeroTituloCedenteCobranca: boleto.numeroTituloCedenteCobranca,
          nomeSacadoCobranca: boleto.nomeSacadoCobranca,
          valorAtualTituloCobranca: boleto.valorAtualTituloCobranca,
          error: error.message
        });
        return;
      }
    }
  }
};

export const processClientes = async (boletosData) => {
  const successList = [];
  const errorList = [];

  for (const boleto of boletosData) {
    await processBoleto(boleto, successList, errorList);
  }

  return { successList, errorList };
};
