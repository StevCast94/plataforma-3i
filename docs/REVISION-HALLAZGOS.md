# Revisión de redacción ES/EN — hallazgos pendientes

> R0–R10 completas (11-oct-2026). Propuesta R10 aplicada en producción.

Registro de todo lo que aparece durante la revisión R0–R10 y **no** se corrigió
porque es una decisión del dueño, es contenido editado desde el admin, o queda fuera
del alcance de redacción. Cada punto dice dónde está y qué se propone.

Estado: ⬜ pendiente · ✅ resuelto

## A. Datos que no cuadran entre páginas

| # | Dónde | Qué pasa | Propuesta | Estado |
|---|---|---|---|---|
| A1 | Nosotros, pilar «Inversión accesible» | Dice «propiedades fraccionadas desde **$5,000**»; Ibiza se vende desde **$12,000** | Confirmar si existe un producto de $5,000; si no, cambiar a $12,000 | ✅ Corregido a «fracciones desde $12,000». |
| A2 | Propuesta comercial (ejemplo) vs. Montañita View | Ejemplo con **30 cuotas**; MV usa **24 cuotas** | El dueño decidió dejarlo (es un ejemplo genérico) | ✅ |
| A4 | Refiere y gana (/oficina) vs. reglamento | La tabla de niveles dice frecuencia de pago **mensual (Premiere) / quincenal (Elite)**; el reglamento no menciona frecuencia, solo plazos de liquidación (30 / 3 días) | Agregar la frecuencia al reglamento, o quitarla de la tabla si ya no aplica | ✅ Sin frecuencia de pago fija: la tabla pública muestra el retiro mínimo y el panel del socio dice «Disponible para retirar» con los mínimos reales y un enlace para solicitarlo. |
| A5 | Refiere y gana: «Elite es vitalicio» y reglamento: «El ascenso es permanente» | La promoción de lanzamiento puede devolver a Premiere a quien no tenga 1 venta al cerrar la temporada | Aclarar: «permanente, salvo el Elite de regalo de la promoción de lanzamiento» | ✅ Aclarado en la página de Refiere y gana y en el reglamento (sección 4). |
| A6 | Refiere y gana · «¿Cuánto podrías ganar?» | Precios escritos a mano (MV desde $41,721; Ibiza $12,000) | Leerlos del inventario en vivo, como ya hacen las páginas de aterrizaje, para que no queden desactualizados | ✅ Los ejemplos leen el «precio desde» de cada proyecto en vivo. |
| A7 | Montañita View (descripción) | El inglés depende de que el español sea idéntico al del diccionario: el admin dice «89 solares», el diccionario «90», y el párrafo probablemente sale en español en /en. El número escrito a mano también queda viejo con cada venta | Llenar la «Versión en inglés» del proyecto y quitar el número (ver R10) | ✅ |
| A3 | Atribución de referidos | Reglamento: ventana de **90 días** desde el primer clic. Desarrolladoras: **180 días** | Son dos programas distintos (socios vs. desarrolladoras); confirmar que es intencional | ✅ Intencional: son dos sistemas distintos (cookie de socios 90 días en referralRules.ts; contactos de desarrolladoras 180 días en projectLeads.ts). Sin cambios. |

## B. Contenido editado desde el admin (Configuración / Contenido del sitio)

| # | Sección | Texto actual | Propuesta | Estado |
|---|---|---|---|---|
| B1 | Portada · hero | «Invierte en un **P**araíso…» | «paraíso» en minúscula | ✅ |
| B2 | Portada · proyectos | «Nuestros **P**royectos» | «Nuestros proyectos» | ✅ |
| B3 | Portada · proyectos | «Oportunidades de inversión cuidadosamente desarrolladas y seleccionadas.» | «Proyectos que desarrollamos o seleccionamos, todos verificados.» | ✅ |
| B4 | Club · subtítulo | «…beneficios exclusivos con **comisiones increíbles**.» | «…y gana comisiones por recomendar.» | ✅ |
| B5 | Nosotros · título | «Grupo 3i — Invierte $12K. Gana 70% en Descuentos de Viaje.» (es un anuncio del Club, no un título de «Nosotros») | «Sobre Grupo 3i» | ✅ |
| B6 | Proyecto Ibiza · subtítulo | «Inversión premium en la costa ecuatoriana. Invierte inteligente, invierte en el futuro.» (EN: *Premium investment… Invest smart…*) | Subtítulo descriptivo, p. ej. «Fracciones de un condohotel frente al mar en Manglaralto» | ✅ |
| B7 | Proyecto Ibiza · brochure en inglés | Inglés británico (*programme*) y frases literales (*First investment opportunity*) | Reescribir la versión en inglés del proyecto | ✅ |
| B8 | Tienda · producto Ibiza | Descripción «Fracciona tu inversión, multiplica tu retorno» sin versión en inglés | Escribir la versión en inglés | ✅ |
| B9 | Plantillas para compartir de los socios (Contenido del sitio → referral_templates) | Faltas: «No pierdas tu oportunidad!» y «empieza a ganar tú también!» sin «¡» de apertura; «Registrate» sin tilde. «Estoy ganando ingresos refiriendo» suena forzado | «¡No pierdas tu oportunidad!», «¡Empieza a ganar tú también!», «Regístrate». Reescribir la 3: «Gano comisiones recomendando el Club 3i. Únete con mi enlace y empieza tú también:» | ✅ |

## C. Legal y cumplimiento (antes de lanzar campañas pagadas)

| # | Qué falta | Por qué importa | Estado |
|---|---|---|---|
| C1 | **Política de privacidad** de Grupo 3i (ES/EN) | Google Ads y Meta la piden publicada; recogemos nombre, WhatsApp y email; Ecuador tiene la Ley Orgánica de Protección de Datos Personales (LOPDP, 2021) | ✅ |
| C2 | **Términos y condiciones** generales del sitio (ES/EN) | Hoy solo existen los del Bosque; tienda, Club y formularios no tienen | ✅ |
| C3 | **Aviso de cookies** sin enlace a la política | El banner debe enlazar a la política de privacidad/cookies | ✅ |
| C4 | Pie de página sin enlaces legales | Agregar «Privacidad» y «Términos» al pie, en los dos idiomas | ✅ |
| C5 | Formularios sin aviso de uso de datos | Una línea bajo cada formulario: «Al enviar aceptas la política de privacidad» | ✅ |
| C6 | Datos de la empresa en las páginas legales | La política y los términos dicen «Grupo 3i … Manglaralto, Santa Elena» sin razón social ni RUC. Falta: nombre legal de la empresa responsable, RUC y dirección | Que el dueño los entregue; revisión de un abogado ecuatoriano antes de las campañas | ⬜ |
| C7 | Dominio propio del Bosque (futuro) | Cuando se active, /terminos en ese dominio mostrará la vista previa de los términos de Grupo 3i (la página sí es la del Bosque) | Al configurar el dominio, hacer que el servidor distinga el host del Bosque | ⬜ |

## D. Pendientes de otras etapas (ya identificados)

| # | Etapa | Qué | Estado |
|---|---|---|---|
| D1 | R9 | Títulos de pestaña y vistas previas en inglés con textos viejos: «Invest in paradise», «Tools guide for developers», «System gallery for developers», «3i Travel Club — up to 70% off», «Inversión Inmobiliaria Inteligente» (en /en/reglamento), «Refer and earn with Grupo 3i» (/en/oficina) | ✅ |
| D2 | — | El portal de desarrolladoras y la oficina de referidos están solo en español | Decisión del dueño: ¿traducir el portal de desarrolladoras? | ⬜ |
| D3 | R4 | Opciones de la propuesta MV: «Ruta A/B/C» → «Opción A/B/C» | ✅ |
| D4 | R1 | El botón de idioma no funcionaba en /publica-tu-proyecto y sus subpáginas | ✅ |
| D5 | R4 | «View the partner proposal» abría la propuesta en español | ✅ |
| D6 | R8 | **El Bosque no tiene versión en inglés** (ni rutas /en ni botón de idioma). Montañita recibe muchos turistas extranjeros, que son un público natural para adoptar un árbol o regalarlo | Decisión del dueño: ¿hacer la versión en inglés del Bosque? | ⬜ |
| D7 | R8 | Los términos del Bosque ya incluyen una cláusula de datos personales conforme a la LOPDP; sirve de base para la política de privacidad general (C1) | — | ⬜ |
| D8 | R9 | El correo de confirmación de reservas del Club de Viajes (voucher) está solo en español, aunque la reserva se haga desde /en | Enviar el correo en el idioma en que se hizo la reserva | ⬜ |
| D9 | R9 | Los avisos al celular de socios y desarrolladoras están solo en español (sus portales también lo están) | Se resuelve junto con D2 si se traducen los portales | ⬜ |
