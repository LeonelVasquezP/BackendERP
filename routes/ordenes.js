const express = require('express');
const router = express.Router();
const { crearOrden,obtenerOrdenes, actualizarEstado, eliminarOrden} = require('../controllers/ordenesController');

// rutas para el master de compras
router.post('/ordenes', crearOrden);                        // Crear orden
router.get('/ordenes/:numero', obtenerOrdenes);            // Ver orden por número o todas con *
router.put('/ordenes/:numero/estado', actualizarEstado);   // Cambiar estado
router.delete('/ordenes/:numero', eliminarOrden);          // Eliminar orden (solo si está pendiente)

module.exports = router;
