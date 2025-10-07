const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../services/supabase');

// Configuración de Multer para manejar el archivo en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
    }

    // Usar el UUID del usuario autenticado para la ruta
    const userUuid = req.user.uuid;
    if (!userUuid) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const file = req.file;
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const filePath = `imagenes/${userUuid}/${timestamp}_${safeFileName}`;

    // Subir el buffer del archivo a Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('imagenes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir a Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    // Obtener la URL pública del archivo subido
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('imagenes')
      .getPublicUrl(data.path);

    res.json({ publicUrl: publicUrlData.publicUrl });

  } catch (error) {
    console.error('[ERROR /upload-image]', error);
    res.status(500).json({ error: 'Error interno del servidor al subir la imagen.' });
  }
});

module.exports = router;
