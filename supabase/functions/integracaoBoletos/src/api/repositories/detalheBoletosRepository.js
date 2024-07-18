// src/api/repositories/detalheBoletosRepository.js
import { config } from '../../config.js';

const fetchBoletoDetails = async (token, numeroBoletoBB) => {
  const urlBB = config.hosts.bbUrl;
  const gw_app_key = config.credencialBB.gw_app_key;
  const url = `${urlBB}/cobrancas/v2/boletos/${numeroBoletoBB}?gw-app-key=${gw_app_key}&numeroConvenio=3515111`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch boleto details');
  }

  const data = await response.json();
  return data;
};

export const listaDetalheBoletos = async (token, boletos) => {
  const detalhesBoletos = await Promise.all(
    boletos.map(async (boleto) => {
      const numeroBoletoBB = boleto.numeroBoletoBB;
      return await fetchBoletoDetails(token, numeroBoletoBB);
    })
  );
  console.log(detalhesBoletos);
  return detalhesBoletos;
};