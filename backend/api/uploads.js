const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../services/supabase'); // Importar supabaseAdmin

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET_NAME = process.env.STORAGE_BUCKET || 'imagenes';

// POST /api/upload-image (NO ESTÁ PROTEGIDA PARA FACILITAR PRUEBAS)
// Recibe un multipart/form-data con campo 'image'.
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
    }

    // 1. Crear una ruta única para el archivo en el bucket
    const filePath = `test-uploads/${Date.now()}_${req.file.originalname}`;

    // 2. Subir el archivo a Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false, // No sobrescribir si ya existe
      });

    if (uploadError) {
      console.error('Error al subir a Supabase Storage:', uploadError);
      throw uploadError; // Lanzar el error para que lo capture el catch
    }

    // 3. Obtener la URL pública del archivo subido
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo subido.');
    }
    
    console.log('[UPLOAD] Archivo subido con éxito. URL pública:', urlData.publicUrl);

    // 4. Devolver la URL pública al cliente
    return res.json({ success: true, url: urlData.publicUrl });

  } catch (err) {
    console.error('Error en el manejador de subida:', err);
    const status = err.status || 500;
    const message = err.message || 'Error desconocido en el servidor durante la subida.';
    return res.status(status).json({ error: message });
  }
});

module.exports = router;
