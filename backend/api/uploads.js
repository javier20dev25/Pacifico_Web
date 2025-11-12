// backend/api/uploads.js
const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Configuración: nombre del bucket desde env (por defecto 'imagenes')
// POST /api/upload-image
// Recibe un multipart/form-data con campo 'image'.
// Opcional: campo form 'folder' para subcarpeta (ej: 'productos' o 'logos')
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('UPLOAD REQ =>', {
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      body: req.body,
      auth: !!req.headers.authorization,
    });
    if (!req.file) {
      return res.status(400).json({ error: 'no_file_provided' });
    } // Ejemplo: subir a Supabase Storage (ajusta según tu implementación)
    // const key = `${req.body.folder || 'store_logos'}/${req.body.fileId || Date.now()}_${req.file.originalname}`;
    // const { data, error: supErr } = await supabaseAdmin.storage.from('store_logos').upload(key, req.file.buffer, { contentType: req.file.mimetype });
    // if (supErr) throw supErr;
    // const publicUrl = supabaseAdmin.storage.from('store_logos').getPublicUrl(key).data.publicUrl;    // Si no usas Supabase o la subida es distinta, inserta aquí tu código de almacenamiento.
    // Simular respuesta de éxito (reemplaza por tu lógica real):
    const simulatedUrl = `https://cdn.example.com/${Date.now()}_${req.file.originalname}`;
    return res.json({ ok: true, url: simulatedUrl });
  } catch (err) {
    console.error('UPLOAD HANDLER ERROR:', err);
    // Multer file limit
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'file_too_large' });
    }
    // Si es un error de un SDK (ej. Supabase), suele tener .status / .message / .details
    const status = err.status || 400;
    const detail = err.response?.data || err.details || null;
    return res
      .status(status)
      .json({ error: err.message || 'upload_failed', detail });
  }
});
module.exports = router;
