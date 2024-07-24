// Função para formatar a data no formato dd/mm/aaaa
export const formatDateToDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateToBB = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  //const day = 22
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const getFormattedDateYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateToBB(date);
};

// Função para obter a data atual formatada
export const getCurrentDateFormatted = () => {
  const currentDate = new Date();
  return currentDate.toLocaleDateString('pt-BR'); // ou utilize outro formato conforme necessário
};
