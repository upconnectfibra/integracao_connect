// src/api/services/boletosServices.js
import { listarBoletos } from '../repositories/listarBoletosRepository.js';
import { listaDetalheBoletos } from '../repositories/detalheBoletosRepository.js';
import { formatDateToBB } from '../utils/dateUtils.js';

export const fetchBoletos = async (token) => {
  try {
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = formatDateToBB(yesterday);

    const boletosData = await listarBoletos(token, formattedDate);

    if (!boletosData || !boletosData.boletos) {
      throw new Error('No boletos data returned');
    }

    const detalhesBoletos = await listaDetalheBoletos(token, boletosData.boletos);    

    return detalhesBoletos;
  } catch (error) {
    console.error('Error in listaDetalheBoletos:', error);
    throw new Error('Failed to listaDetalheBoletos');
  }
};