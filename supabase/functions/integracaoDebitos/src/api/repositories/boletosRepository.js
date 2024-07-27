// src/api/repositories/boletosRepository.js
import { supabase } from '../supabaseClient.js';

export const inserirBoletoNaFila = async (boleto) => {
  const { error } = await supabase
    .from('boletos')
    .insert([
      {
        dados_boleto: boleto,
        status: 'pendente',
        tentativas: 0
      }
    ]);

  if (error) {
    console.error('Erro ao inserir boleto na fila:', error);
    throw new Error('Erro ao inserir boleto na fila');
  }
};

export const buscarBoletosPendentes = async () => {
  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .eq('status', 'pendente');

  if (error) {
    console.error('Erro ao buscar boletos pendentes:', error);
    throw new Error('Erro ao buscar boletos pendentes');
  }

  return data;
};

export const atualizarStatusBoleto = async (numeroBoletoBB, status, tentativas) => {
  const { error } = await supabase
    .from('boletos')
    .update({ status, tentativas, data_atualizacao: new Date() })
    .eq('dados_boleto->>numeroBoletoBB', numeroBoletoBB);

  if (error) {
    console.error('Erro ao atualizar status do boleto:', error);
    throw new Error('Erro ao atualizar status do boleto');
  }
};

export const buscarBoletosProcessadosHoje = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .gte('data_atualizacao', `${today}T00:00:00Z`)
    .lte('data_atualizacao', `${today}T23:59:59Z`)
    .eq('status', 'processado');

  if (error) {
    console.error('Erro ao buscar boletos processados hoje:', error);
    throw new Error('Erro ao buscar boletos processados hoje');
  }

  return data;
};

export const buscarBoletoPorNumero = async (numeroBoletoBB) => {
  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .eq('dados_boleto->>numeroBoletoBB', numeroBoletoBB);

  if (error) {
    console.error('Erro ao buscar boleto por número:', error);
    throw new Error('Erro ao buscar boleto por número');
  }

  return data;
};