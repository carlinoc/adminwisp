-- CreateEnum
CREATE TYPE "TipoEntidad" AS ENUM ('NATURAL', 'JURIDICO');

-- CreateEnum
CREATE TYPE "EstadoLaboral" AS ENUM ('ACTIVO', 'INACTIVO', 'VACACIONES', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "RolPrincipal" AS ENUM ('ADMIN', 'VENDEDOR', 'TECNICO', 'SOPORTE', 'CONTADOR');

-- CreateEnum
CREATE TYPE "EstadoAcceso" AS ENUM ('ACTIVO', 'BLOQUEADO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoConexion" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'CORTADO', 'BAJA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'YAPE', 'PLIN');

-- CreateTable
CREATE TABLE "persona" (
    "id" UUID NOT NULL,
    "tipoEntidad" "TipoEntidad" NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT,
    "fechaNacimiento" DATE,
    "dni" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "contactosAdicionales" JSONB,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_juridica" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "telefono" TEXT,
    "representanteLegalId" UUID,

    CONSTRAINT "persona_juridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_empleado" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "fechaContratacion" DATE NOT NULL,
    "esTecnico" BOOLEAN NOT NULL DEFAULT false,
    "estadoLaboral" "EstadoLaboral" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "persona_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_usuario" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "password" TEXT NOT NULL,
    "rolPrincipal" "RolPrincipal" NOT NULL,
    "estadoAcceso" "EstadoAcceso" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "persona_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "puertoId" UUID,
    "zonaId" UUID,
    "vendedorId" UUID,
    "codigoCliente" TEXT,
    "estadoConexion" "EstadoConexion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaAlta" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBaja" DATE,
    "saldoFavor" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabecera" (
    "id" UUID NOT NULL,
    "arrendadorId" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),

    CONSTRAINT "cabecera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zona" (
    "id" UUID NOT NULL,
    "cabeceraId" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "esActivo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_nap" (
    "id" UUID NOT NULL,
    "zonaId" UUID NOT NULL,
    "puertoAlimentadorId" UUID,
    "splitterInstalado" TEXT,
    "capacidadPuertosTotal" INTEGER NOT NULL,
    "puertosUtilizados" INTEGER NOT NULL DEFAULT 0,
    "direccion" TEXT,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),

    CONSTRAINT "caja_nap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puerto" (
    "id" UUID NOT NULL,
    "cajaNapId" UUID NOT NULL,
    "clienteAsignadoId" UUID,
    "numeroPuerto" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "puerto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacion_instalacion" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "direccion" TEXT NOT NULL,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "referenciaVisual" TEXT,

    CONSTRAINT "ubicacion_instalacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifa_plan" (
    "id" UUID NOT NULL,
    "nombrePlan" TEXT NOT NULL,
    "velocidadDescarga" TEXT NOT NULL,
    "velocidadSubida" TEXT NOT NULL,
    "tarifaMensual" DECIMAL(10,2) NOT NULL,
    "incluyeTv" BOOLEAN NOT NULL DEFAULT false,
    "nroTvsBase" INTEGER NOT NULL DEFAULT 0,
    "comisionVenta" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "tarifa_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "tarifaPlanId" UUID NOT NULL,
    "ubicacionInstalacionId" UUID NOT NULL,
    "fechaContrato" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicioServicio" DATE,
    "cicloFacturacion" INTEGER NOT NULL DEFAULT 1,
    "montoActual" DECIMAL(10,2) NOT NULL,
    "comisionGenerada" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoPagado" DECIMAL(10,2) NOT NULL,
    "tipoPago" "TipoPago" NOT NULL,
    "masDetalles" TEXT,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factura_recibo" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "periodoFacturado" DATE NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "saldoPendiente" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "factura_recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_pago_factura" (
    "id" UUID NOT NULL,
    "pagoId" UUID NOT NULL,
    "facturaReciboId" UUID NOT NULL,
    "montoAplicado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_pago_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_ont" (
    "id" UUID NOT NULL,
    "ubicacionInstalacionId" UUID NOT NULL,
    "macOnt" TEXT NOT NULL,
    "vlanGestion" INTEGER NOT NULL,
    "pppoeUsuario" TEXT NOT NULL,
    "pppoePassword" TEXT NOT NULL,
    "configWifi" TEXT,

    CONSTRAINT "configuracion_ont_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_pedido" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridadDefault" TEXT NOT NULL DEFAULT 'NORMAL',
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tipo_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "contratoId" UUID,
    "empleadoReceptorId" UUID NOT NULL,
    "tipoPedidoId" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "motivoCancelacion" TEXT,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "unidadMedida" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "requiereDevolucion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_asignado" (
    "id" UUID NOT NULL,
    "tecnicoId" UUID NOT NULL,
    "personalEntregaId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "serial" TEXT,
    "fechaAsignacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_asignado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "cantidadDisponible" INTEGER NOT NULL DEFAULT 0,
    "puntoReorden" INTEGER NOT NULL DEFAULT 0,
    "ubicacionAlmacen" TEXT,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "persona_dni_key" ON "persona"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "persona_email_key" ON "persona"("email");

-- CreateIndex
CREATE UNIQUE INDEX "persona_juridica_personaId_key" ON "persona_juridica"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "persona_juridica_ruc_key" ON "persona_juridica"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "persona_empleado_personaId_key" ON "persona_empleado"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "persona_usuario_personaId_key" ON "persona_usuario"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_personaId_key" ON "cliente"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_puertoId_key" ON "cliente"("puertoId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_codigoCliente_key" ON "cliente"("codigoCliente");

-- CreateIndex
CREATE UNIQUE INDEX "cabecera_codigo_key" ON "cabecera"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "zona_codigo_key" ON "zona"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "puerto_cajaNapId_numeroPuerto_key" ON "puerto"("cajaNapId", "numeroPuerto");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_ont_ubicacionInstalacionId_key" ON "configuracion_ont"("ubicacionInstalacionId");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_numero_key" ON "pedido"("numero");

-- AddForeignKey
ALTER TABLE "persona_juridica" ADD CONSTRAINT "persona_juridica_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_juridica" ADD CONSTRAINT "persona_juridica_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_empleado" ADD CONSTRAINT "persona_empleado_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_usuario" ADD CONSTRAINT "persona_usuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_puertoId_fkey" FOREIGN KEY ("puertoId") REFERENCES "puerto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabecera" ADD CONSTRAINT "cabecera_arrendadorId_fkey" FOREIGN KEY ("arrendadorId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zona" ADD CONSTRAINT "zona_cabeceraId_fkey" FOREIGN KEY ("cabeceraId") REFERENCES "cabecera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_nap" ADD CONSTRAINT "caja_nap_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_nap" ADD CONSTRAINT "caja_nap_puertoAlimentadorId_fkey" FOREIGN KEY ("puertoAlimentadorId") REFERENCES "puerto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puerto" ADD CONSTRAINT "puerto_cajaNapId_fkey" FOREIGN KEY ("cajaNapId") REFERENCES "caja_nap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicacion_instalacion" ADD CONSTRAINT "ubicacion_instalacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_tarifaPlanId_fkey" FOREIGN KEY ("tarifaPlanId") REFERENCES "tarifa_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_ubicacionInstalacionId_fkey" FOREIGN KEY ("ubicacionInstalacionId") REFERENCES "ubicacion_instalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura_recibo" ADD CONSTRAINT "factura_recibo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pago_factura" ADD CONSTRAINT "detalle_pago_factura_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pago_factura" ADD CONSTRAINT "detalle_pago_factura_facturaReciboId_fkey" FOREIGN KEY ("facturaReciboId") REFERENCES "factura_recibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_ont" ADD CONSTRAINT "configuracion_ont_ubicacionInstalacionId_fkey" FOREIGN KEY ("ubicacionInstalacionId") REFERENCES "ubicacion_instalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_tipoPedidoId_fkey" FOREIGN KEY ("tipoPedidoId") REFERENCES "tipo_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_asignado" ADD CONSTRAINT "material_asignado_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "persona_empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_asignado" ADD CONSTRAINT "material_asignado_personalEntregaId_fkey" FOREIGN KEY ("personalEntregaId") REFERENCES "persona_empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_asignado" ADD CONSTRAINT "material_asignado_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
