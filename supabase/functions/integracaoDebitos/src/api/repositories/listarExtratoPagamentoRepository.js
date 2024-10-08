//src/api/repositories/listarExtratoPagamentoRepository.js
import { config } from '../../config.js';
import { getFormattedDateYesterday } from '../utils/dateUtils.js';

export const listarExtratoPagamento = async (token) => {
  const urlBB = config.hosts.bbUrl;
  const gw_app_key = config.credencialBB.gw_app_key;
  const agencia = config.credencialBB.agencia;
  const conta = config.credencialBB.conta;
  const formattedDate = getFormattedDateYesterday();
  const listarExtratoCall = `${urlBB}/conta-corrente/agencia/${agencia}/conta/${conta}?gw-dev-app-key=${gw_app_key}&numeroPaginaSolicitacao=1&quantidadeRegistroPaginaSolicitacao=200&dataInicioSolicitacao=${formattedDate}&dataFimSolicitacao=${formattedDate}`;
  
  console.log('listarExtratoCall URL:', listarExtratoCall);

  const response = await fetch(listarExtratoCall, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

   console.log('listarExtratoPagamento response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to list boletos:', errorText);
    throw new Error(`Failed to list boletos: ${errorText}`);
  }

  const data = await response.json();
  // Filtrando os registros com "indicadorSinalLancamento": "D"
  const filteredData = data.listaLancamento.filter(lancamento => lancamento.indicadorSinalLancamento === 'D');

  return filteredData; // Retornar os registros filtrados
};
