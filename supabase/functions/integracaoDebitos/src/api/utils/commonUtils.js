// Função responsavel por ativar delay num processamento

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
