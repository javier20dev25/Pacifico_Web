const bcrypt = require('bcryptjs'); // 👈 cambio aquí
const hash = '$2a$10$MTeAONuk6oHcD0QEFbBmyVY8TMzDoyjWAnkmMZZGR.GsxMXAv8K26';
const candidate = process.argv[2]; // node check.js miPosiblePass

bcrypt.compare(candidate, hash, (err, ok) => {
  if (err) return console.error(err);
  console.log(ok ? '✅ Coincide' : '❌ No coincide');
});

