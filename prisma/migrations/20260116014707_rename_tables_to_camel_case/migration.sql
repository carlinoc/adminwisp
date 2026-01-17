/*
  Warnings:

  - You are about to drop the `caja_nap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `configuracion_ont` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `detalle_pago_factura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `factura_recibo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `material_asignado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `persona_empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `persona_juridica` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `persona_usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tarifa_plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tipo_pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ubicacion_instalacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "caja_nap" DROP CONSTRAINT "caja_nap_puertoAlimentadorId_fkey";

-- DropForeignKey
ALTER TABLE "caja_nap" DROP CONSTRAINT "caja_nap_zonaId_fkey";

-- DropForeignKey
ALTER TABLE "configuracion_ont" DROP CONSTRAINT "configuracion_ont_ubicacionInstalacionId_fkey";

-- DropForeignKey
ALTER TABLE "contrato" DROP CONSTRAINT "contrato_tarifaPlanId_fkey";

-- DropForeignKey
ALTER TABLE "contrato" DROP CONSTRAINT "contrato_ubicacionInstalacionId_fkey";

-- DropForeignKey
ALTER TABLE "detalle_pago_factura" DROP CONSTRAINT "detalle_pago_factura_facturaReciboId_fkey";

-- DropForeignKey
ALTER TABLE "detalle_pago_factura" DROP CONSTRAINT "detalle_pago_factura_pagoId_fkey";

-- DropForeignKey
ALTER TABLE "factura_recibo" DROP CONSTRAINT "factura_recibo_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "material_asignado" DROP CONSTRAINT "material_asignado_materialId_fkey";

-- DropForeignKey
ALTER TABLE "material_asignado" DROP CONSTRAINT "material_asignado_personalEntregaId_fkey";

-- DropForeignKey
ALTER TABLE "material_asignado" DROP CONSTRAINT "material_asignado_tecnicoId_fkey";

-- DropForeignKey
ALTER TABLE "pedido" DROP CONSTRAINT "pedido_tipoPedidoId_fkey";

-- DropForeignKey
ALTER TABLE "persona_empleado" DROP CONSTRAINT "persona_empleado_personaId_fkey";

-- DropForeignKey
ALTER TABLE "persona_juridica" DROP CONSTRAINT "persona_juridica_personaId_fkey";

-- DropForeignKey
ALTER TABLE "persona_juridica" DROP CONSTRAINT "persona_juridica_representanteLegalId_fkey";

-- DropForeignKey
ALTER TABLE "persona_usuario" DROP CONSTRAINT "persona_usuario_personaId_fkey";

-- DropForeignKey
ALTER TABLE "puerto" DROP CONSTRAINT "puerto_cajaNapId_fkey";

-- DropForeignKey
ALTER TABLE "ubicacion_instalacion" DROP CONSTRAINT "ubicacion_instalacion_clienteId_fkey";

-- DropTable
DROP TABLE "caja_nap";

-- DropTable
DROP TABLE "configuracion_ont";

-- DropTable
DROP TABLE "detalle_pago_factura";

-- DropTable
DROP TABLE "factura_recibo";

-- DropTable
DROP TABLE "material_asignado";

-- DropTable
DROP TABLE "persona_empleado";

-- DropTable
DROP TABLE "persona_juridica";

-- DropTable
DROP TABLE "persona_usuario";

-- DropTable
DROP TABLE "tarifa_plan";

-- DropTable
DROP TABLE "tipo_pedido";

-- DropTable
DROP TABLE "ubicacion_instalacion";

-- CreateTable
CREATE TABLE "personaJuridica" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "telefono" TEXT,
    "representanteLegalId" UUID,

    CONSTRAINT "personaJuridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personaEmpleado" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "fechaContratacion" DATE NOT NULL,
    "esTecnico" BOOLEAN NOT NULL DEFAULT false,
    "estadoLaboral" "EstadoLaboral" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "personaEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personaUsuario" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "password" TEXT NOT NULL,
    "rolPrincipal" "RolPrincipal" NOT NULL,
    "estadoAcceso" "EstadoAcceso" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "personaUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajaNap" (
    "id" UUID NOT NULL,
    "zonaId" UUID NOT NULL,
    "puertoAlimentadorId" UUID,
    "splitterInstalado" TEXT,
    "capacidadPuertosTotal" INTEGER NOT NULL,
    "puertosUtilizados" INTEGER NOT NULL DEFAULT 0,
    "direccion" TEXT,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),

    CONSTRAINT "cajaNap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacionInstalacion" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "direccion" TEXT NOT NULL,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "referenciaVisual" TEXT,

    CONSTRAINT "ubicacionInstalacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifaPlan" (
    "id" UUID NOT NULL,
    "nombrePlan" TEXT NOT NULL,
    "velocidadDescarga" TEXT NOT NULL,
    "velocidadSubida" TEXT NOT NULL,
    "tarifaMensual" DECIMAL(10,2) NOT NULL,
    "incluyeTv" BOOLEAN NOT NULL DEFAULT false,
    "nroTvsBase" INTEGER NOT NULL DEFAULT 0,
    "comisionVenta" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "tarifaPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturaRecibo" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "periodoFacturado" DATE NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "saldoPendiente" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "facturaRecibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detallePagoFactura" (
    "id" UUID NOT NULL,
    "pagoId" UUID NOT NULL,
    "facturaReciboId" UUID NOT NULL,
    "montoAplicado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detallePagoFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracionOnt" (
    "id" UUID NOT NULL,
    "ubicacionInstalacionId" UUID NOT NULL,
    "macOnt" TEXT NOT NULL,
    "vlanGestion" INTEGER NOT NULL,
    "pppoeUsuario" TEXT NOT NULL,
    "pppoePassword" TEXT NOT NULL,
    "configWifi" TEXT,

    CONSTRAINT "configuracionOnt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipoPedido" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridadDefault" TEXT NOT NULL DEFAULT 'NORMAL',
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tipoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materialAsignado" (
    "id" UUID NOT NULL,
    "tecnicoId" UUID NOT NULL,
    "personalEntregaId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "serial" TEXT,
    "fechaAsignacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materialAsignado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personaJuridica_personaId_key" ON "personaJuridica"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "personaJuridica_ruc_key" ON "personaJuridica"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "personaEmpleado_personaId_key" ON "personaEmpleado"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "personaUsuario_personaId_key" ON "personaUsuario"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracionOnt_ubicacionInstalacionId_key" ON "configuracionOnt"("ubicacionInstalacionId");

-- AddForeignKey
ALTER TABLE "personaJuridica" ADD CONSTRAINT "personaJuridica_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personaJuridica" ADD CONSTRAINT "personaJuridica_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personaEmpleado" ADD CONSTRAINT "personaEmpleado_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personaUsuario" ADD CONSTRAINT "personaUsuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajaNap" ADD CONSTRAINT "cajaNap_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajaNap" ADD CONSTRAINT "cajaNap_puertoAlimentadorId_fkey" FOREIGN KEY ("puertoAlimentadorId") REFERENCES "puerto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puerto" ADD CONSTRAINT "puerto_cajaNapId_fkey" FOREIGN KEY ("cajaNapId") REFERENCES "cajaNap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicacionInstalacion" ADD CONSTRAINT "ubicacionInstalacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_tarifaPlanId_fkey" FOREIGN KEY ("tarifaPlanId") REFERENCES "tarifaPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_ubicacionInstalacionId_fkey" FOREIGN KEY ("ubicacionInstalacionId") REFERENCES "ubicacionInstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturaRecibo" ADD CONSTRAINT "facturaRecibo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detallePagoFactura" ADD CONSTRAINT "detallePagoFactura_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detallePagoFactura" ADD CONSTRAINT "detallePagoFactura_facturaReciboId_fkey" FOREIGN KEY ("facturaReciboId") REFERENCES "facturaRecibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracionOnt" ADD CONSTRAINT "configuracionOnt_ubicacionInstalacionId_fkey" FOREIGN KEY ("ubicacionInstalacionId") REFERENCES "ubicacionInstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_tipoPedidoId_fkey" FOREIGN KEY ("tipoPedidoId") REFERENCES "tipoPedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materialAsignado" ADD CONSTRAINT "materialAsignado_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "personaEmpleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materialAsignado" ADD CONSTRAINT "materialAsignado_personalEntregaId_fkey" FOREIGN KEY ("personalEntregaId") REFERENCES "personaEmpleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materialAsignado" ADD CONSTRAINT "materialAsignado_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
