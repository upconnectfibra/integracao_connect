// src/api/repositories/listarBoletosRepository.js
import { config } from '../../config.js';
import { getFormattedDateYesterday } from '../utils/dateUtils.js';

export const listarBoletos = async (token) => {
  const urlBB = config.hosts.bbUrl;
  const gw_app_key = config.credencialBB.gw_app_key;
  const formattedDate = getFormattedDateYesterday();
  const listarBoletosCall = `${urlBB}/cobrancas/v2/boletos?gw-app-key=${gw_app_key}&indicadorSituacao=B&agenciaBeneficiario=1836&contaBeneficiario=60612&dataInicioMovimento=${formattedDate}&dataFimMovimento=${formattedDate}&codigoEstadoTituloCobranca=6`;
    
  console.log('listarBoletosCall URL:', listarBoletosCall);

  const response = await fetch(listarBoletosCall, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

   console.log('listarBoletos response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to list boletos:', errorText);
    throw new Error(`Failed to list boletos: ${errorText}`);
  }

  const data = await response.json();
  return data;
};