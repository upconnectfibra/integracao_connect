// src/api/services/boletosService.js
import { listarBoletos } from '../repositories/listarBoletosRepository.js';
import { listaDetalheBoletos } from '../repositories/detalheBoletosRepository.js';
import { formatDateToBB } from '../utils/dateUtils.js';
import { inserirBoletoNaFila, buscarBoletoPorNumero } from '../repositories/boletosRepository.js';

export const fetchBoletos = async (token) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = formatDateToBB(yesterday);

    const boletosData = await listarBoletos(token, formattedDate);

    if (!boletosData || boletosData.length === 0) {
      throw new Error('No boletos data returned');
    }

    const detalhesBoletos = await listaDetalheBoletos(token, boletosData);

    // Verificar e inserir boletos na fila
    for (const boleto of detalhesBoletos) {
      const existingBoleto = await buscarBoletoPorNumero(boleto.numeroBoletoBB);

      if (existingBoleto.length > 0) {
        if (existingBoleto[0].status === 'pendente') {
          await processarBoleto(boleto);  // Processar boletos pendentes
        }
        // Se o status for 'processado', não fazer nada
      } else {
        await inserirBoletoNaFila(boleto);  // Inserir na fila se não estiver presente
      }
    }

    return detalhesBoletos;
  } catch (error) {
    console.error('Error in fetchBoletos:', error);
    throw new Error('Failed to fetchBoletos');
  }
};