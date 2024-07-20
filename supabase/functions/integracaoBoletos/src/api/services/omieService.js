// src/api/services/omieService.js
import { decodeUnicode, sanitizeString, adjustStringLength, removeAccents } from '../utils/stringUtils.js';
import { consultarCliente } from '../repositories/consultarClienteRepository.js';
import { incluirCliente } from '../repositories/incluirClienteRepository.js';
import { incluirLancamento } from '../repositories/incluirLancamentoRepository.js';
import { formatDateToDDMMYYYY } from '../utils/dateUtils.js';
import { sendStatusEmail } from '../utils/emailUtils.js';

export const processClientes = async (boletosData) => {
  const successList = [];
  const errorList = [];
  
  for (const boleto of boletosData) {
    const decodedString = decodeUnicode(boleto.nomeSacadoCobranca);
    const sanitizedString = sanitizeString(decodedString);
    const codigoClienteIntegracao = adjustStringLength(sanitizedString, 15);

    try {
      let clienteData = await consultarCliente(codigoClienteIntegracao);
      console.log('Consult Client Response:', clienteData);
      if (clienteData.data && clienteData.data.faultstring && clienteData.data.faultstring.includes("Cliente não cadastrado para o Código [0]")) {
        const nomeCliente = removeAccents(decodedString);
        clienteData = await incluirCliente(codigoClienteIntegracao, nomeCliente);
      }

      const codigoClienteOmie = clienteData.codigo_cliente_omie;
      const dataLancamento = formatDateToDDMMYYYY(new Date(boleto.dataRecebimentoTitulo.split('.').reverse().join('-')));
      await incluirLancamento(boleto.numeroTituloCedenteCobranca, dataLancamento, boleto.valorAtualTituloCobranca, codigoClienteOmie);

      successList.push({ numeroTituloCedenteCobranca: boleto.numeroTituloCedenteCobranca, nomeSacadoCobranca: boleto.nomeSacadoCobranca, valorAtualTituloCobranca: boleto.valorAtualTituloCobranca });
    } catch (error) {
      console.error('Error processing client or transaction:', error);
      errorList.push({ numeroTituloCedenteCobranca: boleto.numeroTituloCedenteCobranca, nomeSacadoCobranca: boleto.nomeSacadoCobranca, valorAtualTituloCobranca: boleto.valorAtualTituloCobranca, error: error.message });
    }
  }

 // await sendStatusEmail(successList, errorList);

  return { successList, errorList };
};
