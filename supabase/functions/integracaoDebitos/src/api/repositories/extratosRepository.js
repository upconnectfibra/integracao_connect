// src/api/repositories/extratosRepository.js
import { supabase } from '../supabaseClient.js';

export const inserirExtratoNaFila = async (extrato) => {
  const { error } = await supabase
    .from('extrextratopagamentoatos')
    .insert([
      {
        dados_extrato: extrato,
        status: 'pendente',
        tentativas: 0
      }
    ]);

  if (error) {
    console.error('Erro ao inserir extrato na fila:', error);
    throw new Error('Erro ao inserir extrato na fila');
  }
};

export const buscarExtratosPendentes = async () => {
  const { data, error } = await supabase
    .from('extratopagamento')
    .select('*')
    .eq('status', 'pendente');

  if (error) {
    console.error('Erro ao buscar extratos pendentes:', error);
    throw new Error('Erro ao buscar extratos pendentes');
  }

  return data;
};

export const atualizarStatusExtrato = async (numeroDocumento, status, tentativas) => {
  const { error } = await supabase
    .from('extratopagamento')
    .update({ status, tentativas, data_atualizacao: new Date() })
    .eq('dados_extrato->>numeroDocumento', numeroDocumento);

  if (error) {
    console.error('Erro ao atualizar status do extrato:', error);
    throw new Error('Erro ao atualizar status do extrato');
  }
};

export const buscarExtratosProcessadosHoje = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('extratopagamento')
    .select('*')
    .gte('data_atualizacao', `${today}T00:00:00Z`)
    .lte('data_atualizacao', `${today}T23:59:59Z`)
    .eq('status', 'processado');

  if (error) {
    console.error('Erro ao buscar extratos processados hoje:', error);
    throw new Error('Erro ao buscar extratos processados hoje');
  }

  return data;
};

export const buscarPagamentoPorNumero = async (numeroDocumento) => {
  const { data, error } = await supabase
    .from('extratopagamento')
    .select('*')
    .eq('dados_extrato->>numeroDocumento', numeroDocumento);

  if (error) {
    console.error('Erro ao buscar extrato por número:', error);
    throw new Error('Erro ao buscar extrato por número');
  }

  return data;
};