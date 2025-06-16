require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function probarConexion() {
  const { data, error } = await supabase.from('proveedores').select('*').limit(1);

  if (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
  } else {
    console.log('✅ Conexión exitosa. Primer proveedor:', data);
  }
}

probarConexion();
