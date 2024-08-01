 // src/api/services/omieService.js
import { decodeUnicode, sanitizeString, adjustStringLength, removeAccents } from '../utils/stringUtils.js';
import { consultarCliente } from '../repositories/consultarClienteRepository.js';
import { incluirCliente } from '../repositories/incluirClienteRepository.js';
import { incluirLancamento } from '../repositories/incluirLancamentoRepository.js';
import { formatDateToDDMMYYYY } from '../utils/dateUtils.js';
import { delay } from '../utils/commonUtils.js';
import { buscarExtratosPendentes, atualizarStatusExtrato, buscarExtratoPorNumero } from '../repositories/extratosRepository.js';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 segundos
const MISUSE_API_PROCESS_RETRY_DELAY = 1800000; // 300 segundos (5 minutos)

export const processExtrato = async (extrato, successList, errorList) => {
  // Verifique se o extrato contém a estrutura esperada
  const extratoData = extrato.dados_extrato || extrato;

  if (!extratoData || !extratoData.numeroDocumento) {
    console.error('extrato ou número do extrato não definido:', extratoData);
    errorList.push({
      numeroTituloCedenteCobranca: extratoData ? extratoData.numeroDocumento : 'N/A',
      nomeSacadoCobranca: extratoData ? extratoData.nomeSacadoCobranca : 'N/A',
      valorAtualTituloCobranca: extratoData ? extratoData.valorLancamento : 'N/A',
      error: 'extrato ou número do extrato não definido',
      dataPagamento: formatDateToDDMMYYYY(new Date())
    });
    return;
  }

  const existingextrato = await buscarExtratoPorNumero(extratoData.numeroDocumento);
  if (existingextrato.length > 0 && existingextrato[0].status === 'processado') {
    console.log(`extrato ${extratoData.numeroDocumento} já processado, pulando...`);
    return;
  }
  
      //ajustar formato da data
      const dataLancamento = formatDateToDDMMYYYY(new Date(extratoData.dataLancamento.split('.').reverse().join('-')));

      try {
        await incluirLancamento(extratoData.numeroTituloCedenteCobranca, dataLancamento, extratoData.valorAtualTituloCobranca, codigoClienteOmie);
        successList.push({
          numeroTituloCedenteCobranca: extratoData.numeroTituloCedenteCobranca,          
          valorAtualTituloCobranca: extratoData.valorAtualTituloCobranca,
          dataPagamento: dataLancamento // Adiciona a data de pagamento
        });
        await atualizarStatusExtrato(extratoData.numeroextratoBB, 'processado', extrato.tentativas); // Atualiza o status na fila
        return; // Saída do loop de retry em caso de sucesso
      } catch (lancamentoError) {
        if (lancamentoError.message.includes("SOAP-ENV:Client-102")) {
          console.error('Error including transaction, but considering as processed:', lancamentoError.message);
          successList.push({
            numeroTituloCedenteCobranca: extratoData.numeroTituloCedenteCobranca,
            nomeSacadoCobranca: extratoData.nomeSacadoCobranca,
            valorAtualTituloCobranca: extratoData.valorAtualTituloCobranca,
            dataPagamento: dataLancamento // Adiciona a data de pagamento
          });
          await atualizarStatusExtrato(extratoData.numeroextratoBB, 'processado', extrato.tentativas); // Atualiza o status na fila como processado
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
          numeroTituloCedenteCobranca: extratoData.numeroTituloCedenteCobranca,
          nomeSacadoCobranca: extratoData.nomeSacadoCobranca,
          valorAtualTituloCobranca: extratoData.valorAtualTituloCobranca,
          error: error.message,
          dataPagamento: formatDateToDDMMYYYY(new Date()) // Adiciona a data atual se não puder obter a data de pagamento
        });
        await atualizarStatusExtrato(extratoData.numeroextratoBB, 'erro', extrato.tentativas + 1); // Atualiza o status na fila
        return;
      }
    }
  }
};

export const processClientes = async (extratosData) => {
  const successList = [];
  const errorList = [];

  for (const extrato of extratosData) {
    console.log('Processando extrato:', extrato);
    await processExtrato(extrato, successList, errorList);
  }

  return { successList, errorList };
};

export const processarFilaDeExtratos = async () => {
  const extratosPendentes = await buscarExtratosPendentes();

  for (const extrato of extratosPendentes) {
    try {
      console.log('Processando extrato pendente:', extrato);
      const { successList, errorList } = await processClientes([extrato]);

      if (successList.length > 0) {
        await atualizarStatusExtrato(extrato.dados_extrato.numeroextratoBB, 'processado', extrato.tentativas);
      } else {
        await atualizarStatusExtrato(extrato.dados_extrato.numeroextratoBB, 'erro', extrato.tentativas + 1);
      }
    } catch (error) {
      await atualizarStatusExtrato(extrato.dados_extrato.numeroextratoBB, 'erro', extrato.tentativas + 1);
    }
  }
};