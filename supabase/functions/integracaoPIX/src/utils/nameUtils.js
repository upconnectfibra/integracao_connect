//utils/nameUtils.js
export const decodeUnicode = (str) => {
  return str.replace(/ u00([\dA-F]{2})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
};

export const sanitizeString = (str) => {
  let normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9]/g, "");
};

export const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};
