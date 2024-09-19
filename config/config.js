require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DB_URI = process.env.DB_URL;

const settings = {
  url: DB_URI,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true,
      // Убедитесь, что у вас есть CA сертификат. Если нет, закомментируйте следующую строку
      ca: fs.existsSync(path.join('/home/rdndzdht/ssl/certs', 'rdndzdht_a2hosted_com_b3779_1e9e7_1758300200_643e4daf1bf111c2b740b0486caf423d.crt'))
         ? fs.readFileSync(path.join('/home/rdndzdht/ssl/certs', 'rdndzdht_a2hosted_com_b3779_1e9e7_1758300200_643e4daf1bf111c2b740b0486caf423d.crt')).toString()
         : undefined,
      key: fs.readFileSync(path.join('/home/rdndzdht/ssl/keys', 'e35a7_1b5f3_dbc9229a95fa06cb8580598414e2597f.key')).toString(),
      cert: fs.readFileSync(path.join('/home/rdndzdht/ssl/certs', 'rdndzdht_a2hosted_com_b3779_1e9e7_1758300200_643e4daf1bf111c2b740b0486caf423d.crt')).toString()
    }
  }
};

module.exports = {
  development: { ...settings },
  test: { ...settings },
  production: { ...settings },
};
