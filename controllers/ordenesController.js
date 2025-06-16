const supabase = require('../supabaseClient');

// crear ordenes de compra
/**
 * Controlador para crear una orden de compra.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 */

const crearOrden = async (req, res) => {
  const { numero_orden, fecha, proveedor_id, detalle } = req.body;

  if (!numero_orden || !proveedor_id || !detalle || !Array.isArray(detalle)) {
    return res.status(400).json({ error: 'Faltan datos requeridos o el detalle no es válido.' });
  }

  try {
    // dtos a nivel de cabecera
    const { data: orden, error: errorCabecera } = await supabase
      .from('ordenes_compra')
      .insert([{ numero_orden, fecha, proveedor_id }])
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

// Obtener orden por número de orden o todas las órdenes
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
    console.error('🔥 Error al obtener órdenes:', err);
    res.status(500).json({ error: 'Error al obtener órdenes.' });
  }
};


module.exports = { 
    crearOrden, 
    obtenerOrdenes
};
