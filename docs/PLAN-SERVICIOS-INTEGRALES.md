# Plan de trabajo: servicios integrales y seguimiento de trámites

Estado: **construido** (12-oct-2026): S0–S6 en producción. Falta validar las etapas de cada plantilla con el abogado y el topógrafo.

## Objetivo

Grupo 3i no solo publica y vende proyectos de terceros. Ofrece un servicio integral:

| Área | Servicios |
|---|---|
| Territorio | Topografía, levantamientos georreferenciados, planos, fraccionamientos |
| Trámites | Asesoría en compraventas, trámites notariales, municipales y de registro |
| Marketing | Páginas de aterrizaje, campañas, producción audiovisual, diseño gráfico |
| Desarrollo de proyectos | Agroturismo, residenciales, forestales, agricultura |

Los precios **no se publican**. Cada cliente recibe una propuesta privada según el tipo de proyecto y los servicios que necesita.

El plan convierte esa oferta en procesos con **expediente, etapas, responsables, plazos, documentos y seguimiento visible para el cliente**.

## Principios

- **Un expediente por servicio contratado:** cliente, proyecto, servicio, etapas, documentos, pagos e historial.
- **Plantillas de trámite:** cada tipo de servicio trae sus etapas y requisitos. El equipo no arma el proceso desde cero.
- **El cliente siempre sabe en qué va:** un enlace privado muestra la etapa actual, lo que falta y quién lo tiene.
- **Reutilizar lo que ya existe:** CRM, avisos al celular, WhatsApp, documentos privados, portal de desarrolladoras y GEO 3i.
- **Español primero.** El inglés solo en las partes que ve el cliente extranjero.

## Fases

### S0. Catálogo de servicios y presentación comercial
- Tabla `Service`: área, nombre, descripción, si se cotiza por hectárea, por unidad o por proyecto, y si está activo.
- Sección «Servicios integrales» en la propuesta para desarrolladoras y en «Publica tu proyecto».
- Página pública `/servicios` (ES/EN), con un formulario «Solicita una propuesta» que permite marcar uno o varios servicios.
- La solicitud entra al CRM como contacto, con los servicios marcados y el origen de campaña.

### S1. Propuestas privadas (cotizaciones)
- Modelo `Quote`: cliente, proyecto, renglones (servicio, alcance, valor), condiciones, validez y estado (borrador → enviada → aceptada / rechazada / vencida).
- PDF con la marca de Grupo 3i y un enlace privado para revisarla y aceptarla.
- Aviso por WhatsApp al enviarla y aviso al equipo cuando el cliente la abre o la acepta.
- Al aceptarla se crean solos el expediente (S2) y el plan de cobros (S4).

### S2. Expedientes y plantillas de trámite
- Modelo `Case`: servicio, cliente, proyecto, responsable, etapa actual, fechas comprometidas y estado.
- Modelo `CaseStep`: etapa, responsable (equipo, cliente o institución), requisitos, plazo, fecha de inicio y de cierre, y notas.
- Documentos por etapa: cédulas, escrituras, certificados, planos, aprobaciones. Se guardan como los documentos privados de la verificación legal.
- Bitácora de cada cambio, con quién lo hizo y cuándo.
- Plantillas iniciales (las etapas se ajustan con el equipo y el abogado):
  - **Levantamiento topográfico:** visita → levantamiento con GPS o dron → procesamiento → plano firmado → entrega.
  - **Fraccionamiento o lotización:** levantamiento → anteproyecto → informe de regulación municipal → aprobación municipal → protocolización notarial → inscripción en el Registro de la Propiedad → claves catastrales por lote.
  - **Compraventa:** certificado de gravámenes → impuestos (alcabala y plusvalía) → minuta → firma de escritura → inscripción → catastro → entrega al comprador.
  - **Trámite municipal suelto:** línea de fábrica, permisos de construcción o uso de suelo.
  - **Campaña de marketing:** brief → guion y piezas → aprobación del cliente → publicación → reporte mensual.
  - **Producción audiovisual:** brief → rodaje o vuelo de dron → edición → revisión → entrega.
  - **Proyecto agroturístico, residencial, forestal o agrícola:** diagnóstico → concepto → estudios → plan maestro → presupuesto → acompañamiento.

### S3. Seguimiento para el cliente
- Enlace privado por expediente, sin contraseña, con un código difícil de adivinar y que se puede renovar. Muestra:
  - una línea de tiempo con las etapas hechas, la actual y las que faltan;
  - lo que se le pide al cliente (documentos, firmas, pagos), con un botón para subirlo;
  - documentos entregados para descargar.
- Avisos por WhatsApp y push en cada cambio de etapa y cuando un plazo está por vencer.
- En el portal de desarrolladoras, una pestaña «Mis trámites» con todos sus expedientes.

### S4. Cobros por hito
- Plan de pagos de la propuesta: anticipo, pagos por etapa cumplida y saldo contra entrega.
- Registro de pagos, saldo pendiente y recordatorio automático.
- Reporte de cartera de servicios en el admin, separado de las comisiones de ventas.

### S5. Integración con GEO 3i
- Un levantamiento terminado genera el plano en PDF y, si es lotización, importa los lotes con geometría al inventario del proyecto.
- Cotizador de topografía por hectárea y por tipo de terreno, que alimenta la propuesta (S1).
- Se conecta con el plan de adjudicaciones de GEO 3i, que ya tiene el formato de planos de la Subsecretaría de Tierras.

### S6. Indicadores
- Tiempo promedio por etapa y por institución (municipio, notaría, registro): dónde se atascan los trámites.
- Expedientes vencidos o en riesgo, y carga de trabajo por responsable.
- Conversión de propuestas: enviadas, aceptadas, valor y servicio más pedido.

## Orden sugerido

1. **S0**: hace visible la oferta y empieza a captar solicitudes.
2. **S2 + S3**: es el corazón del seguimiento y lo que más valor da al cliente.
3. **S1 y S4**: formalizan la venta y el cobro.
4. **S5 y S6**: automatizan y miden.

## Decisiones pendientes del dueño

- Lista final de servicios y quién es responsable de cada área (topografía, legal, marketing, audiovisual, agro).
- Si el cliente sube documentos por el enlace privado o solo los entrega en persona.
- Etapas exactas de cada trámite, a validar con el abogado y el topógrafo.
- Si los expedientes de terceros (clientes que no publican en la plataforma) también usan el portal.
