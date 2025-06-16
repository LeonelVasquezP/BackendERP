const supabase = require('../supabaseClient');

/**
 * Controlador para crear una orden de compra.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 */

const crearOrden = async (req, res) => {
  const { numero_orden, fecha, proveedor_id, detalle, estado = 'pendiente' } = req.body;

  if (!numero_orden || !proveedor_id || !detalle || !Array.isArray(detalle)) {
    return res.status(400).json({ error: 'Faltan datos requeridos o el detalle no es válido.' });
  }

  try {
    // dtos a nivel de cabecera
    const { data: orden, error: errorCabecera } = await supabase
      .from('ordenes_compra')
      .insert([{ numero_orden, fecha, proveedor_id, estado}])
      .select()
      .single();

    if (errorCabecera) throw errorCabecera;

    const orden_id = orden.id;

    // datos a nivel de detalle
    const detalleConOrdenId = detalle.map(item => ({
      ...item,
      orden_id,
    }));

    const { error: errorDetalle } = await supabase
      .from('detalle_orden')
      .insert(detalleConOrdenId);

    if (errorDetalle) throw errorDetalle;

    res.status(201).json({ mensaje: 'Orden registrada exitosamente', orden_id });
  } catch (err) {
    console.error('ERROR:', err); 
    res.status(500).json({ error: err.message || 'Error interno al registrar la orden.' });
  }
};

/**
 * Controlador para obtener órdenes de compra.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 */
const obtenerOrdenes = async (req, res) => {
  try {
    const numero = req.params.numero;

    let filtro = supabase
      .from('ordenes_compra')
      .select(`
        id,
        numero_orden,
        fecha,
        estado,
        proveedor_id,
        proveedores (
          id,
          nombre
        )
      `);

    if (numero !== '*') {
      filtro = filtro.eq('numero_orden', numero);
    }

    const { data: ordenes, error } = await filtro;
    if (error) throw error;

    const ordenesConDetalle = await Promise.all(
      ordenes.map(async (orden) => {
        const { data: detalle, error: errorDetalle } = await supabase
          .from('detalle_orden')
          .select(`
            producto_id,
            cantidad,
            productos (
              nombre
            )
          `)
          .eq('orden_id', orden.id);

        if (errorDetalle) throw errorDetalle;

        return {
          id: orden.id,
          numero_orden: orden.numero_orden,
          fecha: orden.fecha,
          estado: orden.estado,
          proveedor: {
            id: orden.proveedores.id,
            nombre: orden.proveedores.nombre,
          },
          detalle: detalle.map(item => ({
            producto_id: item.producto_id,
            nombre_producto: item.productos.nombre,
            cantidad: item.cantidad,
          })),
        };
      })
    );

    res.json(ordenesConDetalle);
  } catch (err) {
    console.error('Error al obtener órdenes:', err);
    res.status(500).json({ error: 'Error al obtener órdenes.' });
  }
};


/**
 * Controlador para eliminar una orden de compra por número de orden.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 */
const eliminarOrden = async (req, res) => {
  const { numero } = req.params;

  try {
    // Obtener orden
    const { data: orden, error: errorBuscar } = await supabase
      .from('ordenes_compra')
      .select('id, estado')
      .eq('numero_orden', numero)
      .single();

    if (errorBuscar || !orden) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    if (orden.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se puede eliminar una orden en estado pendiente.' });
    }

    // Eliminar detalle primero
    const { error: errorDetalle } = await supabase
      .from('detalle_orden')
      .delete()
      .eq('orden_id', orden.id);

    if (errorDetalle) throw errorDetalle;

    // Eliminar cabecera
    const { error: errorCabecera } = await supabase
      .from('ordenes_compra')
      .delete()
      .eq('id', orden.id);

    if (errorCabecera) throw errorCabecera;

    res.json({ mensaje: 'Orden eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar orden:', err);
    res.status(500).json({ error: 'Error al eliminar orden.' });
  }
};

/**

 * Controlador para actualizar el estado de una orden de compra por número de orden.

 * @param {Object} req - Request de Express.

 * @param {Object} res - Response de Express.

 */

const actualizarEstado = async (req, res) => {
  const { numero } = req.params;
  const { nuevoEstado } = req.body;

  const estadosValidos = ['pendiente', 'aprobado', 'cancelado', 'realizado'];

  if (!estadosValidos.includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado no válido.' });
  }

  try {
    const { error } = await supabase
      .from('ordenes_compra')
      .update({ estado: nuevoEstado })
      .eq('numero_orden', numero);

    if (error) throw error;

    res.json({ mensaje: `Estado actualizado a "${nuevoEstado}"` });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error al actualizar estado.' });
  }
};




module.exports = { 
    crearOrden, 
    obtenerOrdenes,
    eliminarOrden,
    actualizarEstado
};
