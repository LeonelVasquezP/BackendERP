const express = require('express');
const router = express.Router();
const { crearOrden } = require('../controllers/ordenesController');

router.post('/createOrder', crearOrden);

module.exports = router;
