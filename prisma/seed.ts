import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs'

// Cargar variables de entorno manualmente para el script
dotenv.config();

// 1. Crear el pool de conexión de la librería 'pg'
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });

// 2. Crear el adaptador de Prisma
const adapter = new PrismaPg(pool);

// 3. Inicializar el cliente pasando el adaptador
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes (opcional - comentar si no quieres borrar)
  // await prisma.materialAsignado.deleteMany()
  // await prisma.inventario.deleteMany()
  // await prisma.material.deleteMany()
  // ... etc

  // 1. Crear Usuario Administrador
  console.log('👤 Creando usuario administrador...')
  
  const adminPersona = await prisma.persona.create({
    data: {
      tipoEntidad: 'NATURAL',
      nombres: 'Admin',
      apellidos: 'Sistema',
      dni: '12345678',
      email: 'admin@isp.com',
      telefono: '987654321',
      direccion: 'Oficina Principal',
      fechaNacimiento: new Date('1990-01-01'),
      personaUsuario: {
        create: {
          password: await bcrypt.hash('admin123', 10),
          rolPrincipal: 'ADMIN',
          estadoAcceso: 'ACTIVO',
        }
      },
      personaEmpleado: {
        create: {
          fechaContratacion: new Date(),
          esTecnico: false,
          estadoLaboral: 'ACTIVO',
        }
      }
    }
  })

  console.log(`✅ Admin creado: ${adminPersona.email}`)

  // 2. Crear Vendedores
  console.log('👥 Creando vendedores...')
  
  const vendedor1 = await prisma.persona.create({
    data: {
      tipoEntidad: 'NATURAL',
      nombres: 'Carlos',
      apellidos: 'Vega',
      dni: '23456789',
      email: 'carlos.vega@isp.com',
      telefono: '987654322',
      fechaNacimiento: new Date('1992-05-15'),
      personaUsuario: {
        create: {
          password: await bcrypt.hash('vendedor123', 10),
          rolPrincipal: 'VENDEDOR',
          estadoAcceso: 'ACTIVO',
        }
      },
      personaEmpleado: {
        create: {
          fechaContratacion: new Date(),
          esTecnico: false,
          estadoLaboral: 'ACTIVO',
        }
      }
    }
  })

  console.log(`✅ Vendedor creado: ${vendedor1.email}`)

  // 3. Crear Técnicos
  console.log('🔧 Creando técnicos...')
  
  const tecnico1 = await prisma.persona.create({
    data: {
      tipoEntidad: 'NATURAL',
      nombres: 'Luis',
      apellidos: 'Ramirez',
      dni: '34567890',
      email: 'luis.ramirez@isp.com',
      telefono: '987654323',
      fechaNacimiento: new Date('1988-08-20'),
      personaUsuario: {
        create: {
          password: await bcrypt.hash('tecnico123', 10),
          rolPrincipal: 'TECNICO',
          estadoAcceso: 'ACTIVO',
        }
      },
      personaEmpleado: {
        create: {
          fechaContratacion: new Date(),
          esTecnico: true,
          estadoLaboral: 'ACTIVO',
        }
      }
    }
  })

  console.log(`✅ Técnico creado: ${tecnico1.email}`)

  // 4. Crear Cabecera y Zonas
  console.log('📍 Creando infraestructura...')
  
  const cabecera1 = await prisma.cabecera.create({
    data: {
      codigo: 'CAB-001',
      nombre: 'Cabecera Principal Cusco',
      ubicacion: 'Av. de la Cultura 1234',
      latitud: -13.5319,
      longitud: -71.9675,
      arrendadorId: adminPersona.id,
    }
  })

  const zona1 = await prisma.zona.create({
    data: {
      codigo: 'ZONA-001',
      nombre: 'Zona Centro',
      descripcion: 'Zona del centro histórico de Cusco',
      esActivo: true,
      cabeceraId: cabecera1.id,
    }
  })

  const zona2 = await prisma.zona.create({
    data: {
      codigo: 'ZONA-002',
      nombre: 'Zona San Sebastián',
      descripcion: 'Distrito de San Sebastián',
      esActivo: true,
      cabeceraId: cabecera1.id,
    }
  })

  console.log(`✅ Cabecera y zonas creadas`)

  // 5. Crear Cajas NAP y Puertos
  console.log('📦 Creando cajas NAP y puertos...')
  
  const cajaNap1 = await prisma.cajaNap.create({
    data: {
      zonaId: zona1.id,
      splitterInstalado: '1:8',
      capacidadPuertosTotal: 8,
      puertosUtilizados: 0,
      direccion: 'Av. El Sol 456',
      latitud: -13.5239,
      longitud: -71.9675,
    }
  })

  // Crear puertos para la caja NAP
  for (let i = 1; i <= 8; i++) {
    await prisma.puerto.create({
      data: {
        cajaNapId: cajaNap1.id,
        numeroPuerto: i,
        estado: 'DISPONIBLE',
      }
    })
  }

  console.log(`✅ Caja NAP creada con 8 puertos`)

  // 6. Crear Planes de Tarifa
  console.log('💰 Creando planes de tarifa...')
  
  const plan1 = await prisma.tarifaPlan.create({
    data: {
      nombrePlan: 'Plan Básico',
      velocidadDescarga: '20 Mbps',
      velocidadSubida: '10 Mbps',
      tarifaMensual: 50.00,
      incluyeTv: false,
      nroTvsBase: 0,
      comisionVenta: 10.00,
    }
  })

  const plan2 = await prisma.tarifaPlan.create({
    data: {
      nombrePlan: 'Plan Premium',
      velocidadDescarga: '100 Mbps',
      velocidadSubida: '50 Mbps',
      tarifaMensual: 100.00,
      incluyeTv: true,
      nroTvsBase: 1,
      comisionVenta: 20.00,
    }
  })

  const plan3 = await prisma.tarifaPlan.create({
    data: {
      nombrePlan: 'Plan Empresarial',
      velocidadDescarga: '200 Mbps',
      velocidadSubida: '100 Mbps',
      tarifaMensual: 200.00,
      incluyeTv: true,
      nroTvsBase: 2,
      comisionVenta: 40.00,
    }
  })

  console.log(`✅ 3 planes de tarifa creados`)

  // 7. Crear Clientes de Ejemplo
  console.log('👨‍💼 Creando clientes...')
  
  const clientePersona1 = await prisma.persona.create({
    data: {
      tipoEntidad: 'NATURAL',
      nombres: 'Juan',
      apellidos: 'Pérez García',
      dni: '45678901',
      email: 'juan.perez@email.com',
      telefono: '987654324',
      direccion: 'Jr. Lima 123',
      fechaNacimiento: new Date('1985-03-10'),
    }
  })

  const cliente1 = await prisma.cliente.create({
    data: {
      personaId: clientePersona1.id,
      zonaId: zona1.id,
      vendedorId: vendedor1.id,
      codigoCliente: 'CLI-00001',
      estadoConexion: 'ACTIVO',
      saldoFavor: 0,
    }
  })

  const clientePersona2 = await prisma.persona.create({
    data: {
      tipoEntidad: 'NATURAL',
      nombres: 'María',
      apellidos: 'Lopez Torres',
      dni: '56789012',
      email: 'maria.lopez@email.com',
      telefono: '987654325',
      direccion: 'Av. Cusco 456',
      fechaNacimiento: new Date('1990-07-22'),
    }
  })

  const cliente2 = await prisma.cliente.create({
    data: {
      personaId: clientePersona2.id,
      zonaId: zona1.id,
      vendedorId: vendedor1.id,
      codigoCliente: 'CLI-00002',
      estadoConexion: 'ACTIVO',
      saldoFavor: 0,
    }
  })

  console.log(`✅ 2 clientes creados`)

  // 8. Crear Contratos y Ubicaciones
  console.log('📄 Creando contratos...')
  
  const ubicacion1 = await prisma.ubicacionInstalacion.create({
    data: {
      clienteId: cliente1.id,
      direccion: 'Jr. Lima 123',
      latitud: -13.5289,
      longitud: -71.9675,
      referenciaVisual: 'Casa amarilla al lado de la panadería',
    }
  })

  const contrato1 = await prisma.contrato.create({
    data: {
      clienteId: cliente1.id,
      tarifaPlanId: plan2.id,
      ubicacionInstalacionId: ubicacion1.id,
      fechaContrato: new Date(),
      fechaInicioServicio: new Date(),
      cicloFacturacion: 1,
      montoActual: 100.00,
      comisionGenerada: 20.00,
      estado: 'ACTIVO',
    }
  })

  console.log(`✅ Contrato creado`)

  // 9. Crear Tipos de Pedido
  console.log('📋 Creando tipos de pedido...')
  
  await prisma.tipoPedido.createMany({
    data: [
      {
        nombre: 'Instalación Nueva',
        descripcion: 'Instalación de servicio nuevo',
        prioridadDefault: 'ALTA',
        requiereAprobacion: true,
      },
      {
        nombre: 'Soporte Técnico',
        descripcion: 'Atención de problemas técnicos',
        prioridadDefault: 'MEDIA',
        requiereAprobacion: false,
      },
      {
        nombre: 'Cambio de Plan',
        descripcion: 'Modificación del plan contratado',
        prioridadDefault: 'BAJA',
        requiereAprobacion: true,
      },
      {
        nombre: 'Baja de Servicio',
        descripcion: 'Cancelación del servicio',
        prioridadDefault: 'MEDIA',
        requiereAprobacion: true,
      },
    ]
  })

  console.log(`✅ 4 tipos de pedido creados`)

  // 10. Crear Materiales e Inventario
  console.log('📦 Creando materiales e inventario...')
  
  const material1 = await prisma.material.create({
    data: {
      nombre: 'ONT Huawei',
      descripcion: 'Modem ONT para fibra óptica',
      marca: 'Huawei',
      modelo: 'HG8245H',
      unidadMedida: 'Unidad',
      categoria: 'Equipos',
      requiereDevolucion: true,
    }
  })

  await prisma.inventario.create({
    data: {
      materialId: material1.id,
      cantidadDisponible: 50,
      puntoReorden: 10,
      ubicacionAlmacen: 'Estante A-1',
    }
  })

  const material2 = await prisma.material.create({
    data: {
      nombre: 'Cable de Fibra',
      descripcion: 'Cable de fibra óptica monomodo',
      marca: 'Furukawa',
      modelo: 'SM-G652D',
      unidadMedida: 'Metros',
      categoria: 'Cables',
      requiereDevolucion: false,
    }
  })

  await prisma.inventario.create({
    data: {
      materialId: material2.id,
      cantidadDisponible: 1000,
      puntoReorden: 200,
      ubicacionAlmacen: 'Estante B-3',
    }
  })

  const material3 = await prisma.material.create({
    data: {
      nombre: 'Conectores SC/APC',
      descripcion: 'Conectores para fibra óptica',
      marca: 'TP-Link',
      modelo: 'SC-APC-01',
      unidadMedida: 'Unidad',
      categoria: 'Conectores',
      requiereDevolucion: false,
    }
  })

  await prisma.inventario.create({
    data: {
      materialId: material3.id,
      cantidadDisponible: 200,
      puntoReorden: 50,
      ubicacionAlmacen: 'Estante C-2',
    }
  })

  console.log(`✅ 3 materiales con inventario creados`)

  console.log('\n🎉 ¡Seed completado exitosamente!')
  console.log('\n📝 Datos de acceso:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Administrador:')
  console.log('   Email: admin@isp.com')
  console.log('   Password: admin123')
  console.log('\n👥 Vendedor:')
  console.log('   Email: carlos.vega@isp.com')
  console.log('   Password: vendedor123')
  console.log('\n🔧 Técnico:')
  console.log('   Email: luis.ramirez@isp.com')
  console.log('   Password: tecnico123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });