// backend/api/uploads.js
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../services/supabase');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configuración: nombre del bucket desde env (por defecto 'imagenes')
const BUCKET = process.env.STORAGE_BUCKET || 'imagenes';

// Helper: sanitize filename
function sanitizeFilename(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
}

// POST /api/upload-image
// Recibe un multipart/form-data con campo 'image'.
// Opcional: campo form 'folder' para subcarpeta (ej: 'productos' o 'logos')
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = (req.user && (req.user.uuid || req.user.id)) || 'anon';
    const subfolder = req.body.folder ? sanitizeFilename(req.body.folder) : 'uploads';
    
    // Usar un ID predecible para el nombre del archivo, o 'logo' por defecto
    const fileId = req.body.fileId ? sanitizeFilename(req.body.fileId) : 'logo';
    const ext = req.file.originalname.includes('.') ? req.file.originalname.slice(req.file.originalname.lastIndexOf('.')) : '';
    const filename = `${fileId}${ext}`;

    const path = `${subfolder}/${userId}/${filename}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true // <--- ¡IMPORTANTE! Habilitar la sobrescritura
      });

    if (uploadError) {
      console.error('[upload-image] supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Error subiendo archivo a storage', details: uploadError });
    }

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uploadData.path);
    const publicUrl = publicData?.publicUrl || publicData?.publicURL || null;

    return res.json({
      path: uploadData.path,
      publicUrl
    });
  } catch (err) {
    console.error('[upload-image] exception:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Error interno al subir archivo.' });
  }
});

module.exports = router;