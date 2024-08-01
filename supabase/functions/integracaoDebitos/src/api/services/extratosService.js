// src/api/services/ExtratosService.js
import { listarExtratoPagamento } from '../repositories/listarExtratoPagamentoRepository.js';
import { formatDateToBB } from '../utils/dateUtils.js';
import { inserirExtratoNaFila, buscarExtratoPorNumero } from '../repositories/extratosRepository.js';
import { processExtrato } from './omieService.js';

export const fetchExtratos = async (token) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = formatDateToBB(yesterday);

    const extratoPagamentoResponse = await listarExtratoPagamento(token, formattedDate);

    if (!extratoPagamentoResponse || extratoPagamentoResponse.length === 0) {
      throw new Error('No Extratos data returned');
    }    
    
    // Verificar e inserir Extratos na fila
    for (const extratoData of extratoPagamentoResponse) {
      const existingExtrato = await buscarPagamentoPorNumero(extratoData.numeroDocumento);

      if (existingExtrato.length > 0) {
        if (existingExtrato[0].status === 'pendente') {
          await processExtrato(extratoData);  // Processar Extratos pendentes
        }
        // Se o status for 'processado', não fazer nada
      } else {
        await inserirExtratoNaFila(extratoData);  // Inserir na fila se não estiver presente
      }
    }

    return detalhesExtratos;
  } catch (error) {
    console.error('Error in fetchExtratos:', error);
    throw new Error('Failed to fetchExtratos');
  }
};