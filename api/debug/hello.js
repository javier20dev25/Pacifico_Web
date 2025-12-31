// api/debug/hello.js
export default function handler(req, res) {
  res.status(200).json({ ok: true, now: new Date().toISOString(), path: '/api/debug/hello' });
}
