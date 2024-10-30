const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' }); 

// Crear la conexión
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, 
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL WORKBENCH');
});

module.exports = connection;
