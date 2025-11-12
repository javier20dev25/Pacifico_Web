// backend/lib/normalize.js
module.exports.normalizeOrder = (p) => ({
  id: p.id,
  status: p.status || p.estado,
  total: Number(p.total_amount ?? p.total ?? 0),
  customer_name: p.customer_name ?? p.cliente_nombre ?? null,
  created_at: p.created_at ?? p.fecha ?? null,
  raw: p,
});
