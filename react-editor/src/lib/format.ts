export const fmt = (v: unknown, decimals = 2) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : (decimals === 0 ? '0' : '0.00');
};