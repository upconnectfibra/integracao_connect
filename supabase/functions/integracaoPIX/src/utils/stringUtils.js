export const decodeUnicode = (str) => {
  return str.replace(/\\u([\dA-F]{2})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
};

export const sanitizeString = (str) => {
  let normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9]/g, "");
};

export const truncateString = (str, length) => {
  return str.length > length ? str.substring(0, length) : str;
};
