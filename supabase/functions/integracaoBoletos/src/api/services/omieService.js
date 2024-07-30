// src/api/services/omieService.js
import { decodeUnicode, sanitizeString, adjustStringLength, removeAccents } from '../utils/stringUtils.js';
import { consultarCliente } from '../repositories/consultarClienteRepository.js';
import { incluirCliente } from '../repositories/incluirClienteRepository.js';
import { incluirLancamento } from '../repositories/incluirLancamentoRepository.js';
import { formatDateToDDMMYYYY } from '../utils/dateUtils.js';
import { delay } from '../utils/commonUtils.js';
import { buscarBoletosPendentes, atualizarStatusBoleto, buscarBoletoPorNumero } from '../repositories/boletosRepository.js';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 15000; // 15 segundos
const MISUSE_API_PROCESS_RETRY_DELAY = 1800000; // 300 segundos (5 minutos)

const processBoleto = async (boleto, successList, errorList) => {
  // Verifique se o boleto contém a estrutura esperada
  const boletoData = boleto.dados_boleto || boleto;

  if (!boletoData || !boletoData.numeroBoletoBB) {
    console.error('Boleto ou número do boleto não definido:', boletoData);
    errorList.push({
      numeroTituloCedenteCobranca: boletoData ? boletoData.numeroTituloCedenteCobranca : 'N/A',
      nomeSacadoCobranca: boletoData ? boletoData.nomeSacadoCobranca : 'N/A',
      valorAtualTituloCobranca: boletoData ? boletoData.valorAtualTituloCobranca : 'N/A',
      error: 'Boleto ou número do boleto não definido',
      dataPagamento: formatDateToDDMMYYYY(new Date())
    });
    return;
  }

  const existingBoleto = await buscarBoletoPorNumero(boletoData.numeroBoletoBB);
  if (existingBoleto.length > 0 && existingBoleto[0].status === 'processado') {
    console.log(`Boleto ${boletoData.numeroBoletoBB} já processado, pulando...`);
    return;
  }

  const decodedString = decodeUnicode(boletoData.nomeSacadoCobranca);
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
        } else if (error.message.includes('MISUSE_API_PROCESS')) {
          const retryDelay = MISUSE_API_PROCESS_RETRY_DELAY;
          console.warn(`MISUSE_API_PROCESS detected. Retrying in ${retryDelay}ms...`);
          await delay(retryDelay);
          continue; // Tentar novamente após o delay
        } else {
          throw error; // Re-lançar erro para retentativa
        }
      }

      const codigoClienteOmie = clienteData.codigo_cliente_omie;
      const dataLancamento = formatDateToDDMMYYYY(new Date(boletoData.dataRecebimentoTitulo.split('.').reverse().join('-')));

      try {
        await incluirLancamento(boletoData.numeroTituloCedenteCobranca, dataLancamento, boletoData.valorAtualTituloCobranca, codigoClienteOmie);
        successList.push({
          numeroTituloCedenteCobranca: boletoData.numeroTituloCedenteCobranca,
          nomeSacadoCobranca: boletoData.nomeSacadoCobranca,
          valorAtualTituloCobranca: boletoData.valorAtualTituloCobranca,
          dataPagamento: dataLancamento // Adiciona a data de pagamento
        });
        await atualizarStatusBoleto(boletoData.numeroBoletoBB, 'processado', boleto.tentativas); // Atualiza o status na fila
        return; // Saída do loop de retry em caso de sucesso
      } catch (lancamentoError) {
        if (lancamentoError.message.includes("SOAP-ENV:Client-102")) {
          console.error('Error including transaction, but considering as processed:', lancamentoError.message);
          successList.push({
            numeroTituloCedenteCobranca: boletoData.numeroTituloCedenteCobranca,
            nomeSacadoCobranca: boletoData.nomeSacadoCobranca,
            valorAtualTituloCobranca: boletoData.valorAtualTituloCobranca,
            dataPagamento: dataLancamento // Adiciona a data de pagamento
          });
          await atualizarStatusBoleto(boletoData.numeroBoletoBB, 'processado', boleto.tentativas); // Atualiza o status na fila como processado
          return;
        } else if (lancamentoError.message.includes('MISUSE_API_PROCESS')) {
          const retryDelay = MISUSE_API_PROCESS_RETRY_DELAY;
          console.warn(`MISUSE_API_PROCESS detected. Retrying in ${retryDelay}ms...`);
          await delay(retryDelay);
          continue; // Tentar novamente após o delay
        } else {
          throw lancamentoError; // Re-lançar erro para retentativa
        }
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * attempt; // Exponential backoff
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error('Max retries reached. Error processing client or transaction:', error.message);
        errorList.push({
          numeroTituloCedenteCobranca: boletoData.numeroTituloCedenteCobranca,
          nomeSacadoCobranca: boletoData.nomeSacadoCobranca,
          valorAtualTituloCobranca: boletoData.valorAtualTituloCobranca,
          error: error.message,
          dataPagamento: formatDateToDDMMYYYY(new Date()) // Adiciona a data atual se não puder obter a data de pagamento
        });
        await atualizarStatusBoleto(boletoData.numeroBoletoBB, 'erro', boleto.tentativas + 1); // Atualiza o status na fila
        return;
      }
    }
  }
};

export const processClientes = async (boletosData) => {
  const successList = [];
  const errorList = [];

  for (const boleto of boletosData) {
    console.log('Processando boleto:', boleto);
    await processBoleto(boleto, successList, errorList);
  }

  return { successList, errorList };
};

export const processarFilaDeBoletos = async () => {
  const boletosPendentes = await buscarBoletosPendentes();

  for (const boleto of boletosPendentes) {
    try {
      console.log('Processando boleto pendente:', boleto);
      const { successList, errorList } = await processClientes([boleto]);

      if (successList.length > 0) {
        await atualizarStatusBoleto(boleto.dados_boleto.numeroBoletoBB, 'processado', boleto.tentativas);
      } else {
        await atualizarStatusBoleto(boleto.dados_boleto.numeroBoletoBB, 'erro', boleto.tentativas + 1);
      }
    } catch (error) {
      await atualizarStatusBoleto(boleto.dados_boleto.numeroBoletoBB, 'erro', boleto.tentativas + 1);
    }
  }
};