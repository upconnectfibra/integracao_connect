// Função para converter os caracteres Unicode para seus equivalentes
export const decodeUnicode = (str) => {
  return str.replace(/ u00([\dA-F]{2})/gi,
                     (match, grp) => String.fromCharCode(parseInt(grp, 16)));
};

// Função para remover acentos dos caracteres
export const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};

// Função para sanitizar a string
export const sanitizeString = (str) => {
  // Normalizar para a forma decomposta NFD e remover os diacríticos
  let normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  // Remover caracteres especiais, mantendo apenas letras e números
  return normalized.replace(/[^a-zA-Z0-9]/g, "");
};

// Função para ajustar o comprimento da string
export const adjustStringLength = (str, maxLength) => {
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};
