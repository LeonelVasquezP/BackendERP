const express = require('express');
const dotenv = require('dotenv');
const ordenesRoutes = require('./routes/ordenes');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/ordenes', ordenesRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
