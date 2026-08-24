# Imágenes de la plataforma — prompts para Gemini

Genera cada imagen en Gemini, guárdala con el **nombre exacto** indicado y déjala en la
carpeta que dice cada bloque. Yo las implemento después.

---

## Estilo base (pégalo al final de CADA prompt)

```
Fotografía realista, luz cálida de atardecer, paleta arena y dorado,
elegante y aspiracional, sin texto, sin logos, sin marcas de agua.
```

**Por qué:** las 24 imágenes tienen que verse como una sola campaña, no como stock suelto.
Esta línea es lo que las amarra. Si Gemini te pide proporción, usa la que indica cada bloque.

**Contexto geográfico:** costa de Santa Elena / Montañita, Ecuador. Cuando pidas playa o
paisaje, di *"costa del Pacífico ecuatoriano"* — evita que salga Caribe turquesa genérico,
que no se parece a donde están tus proyectos y rompe la credibilidad.

---

# PRIORIDAD 1 — Las 8 que más venden (empieza por aquí)

Proporción **16:9**. Carpeta: `frontend/public/images/secciones/`

### 1. `hero-home.jpg`
```
Vista aérea de un condominio moderno frente al mar en la costa del Pacífico
ecuatoriano al atardecer, piscina infinita, arquitectura blanca y madera.
```

### 2. `hero-referidos.jpg`
```
Mujer latina joven sonriendo mientras usa su celular en una terraza frente
al mar, ambiente relajado y próspero, luz dorada.
```

### 3. `hero-club.jpg`
```
Pareja latina caminando por la orilla de una playa al atardecer vista desde
atrás, maletas de viaje, sensación de libertad.
```

### 4. `hero-viajes.jpg`
```
Vista desde la ventana de un avión hacia nubes doradas al atardecer,
ala visible, sensación de viaje inminente.
```

### 5. `header-proyectos.jpg`
```
Detalle arquitectónico de una fachada moderna de hormigón y madera con
palmeras, ángulo bajo contra cielo despejado.
```

### 6. `header-tienda.jpg`
```
Escritorio elegante con maqueta arquitectónica, planos y una taza de café,
luz natural lateral, vista cenital parcial.
```

### 7. `header-nosotros.jpg`
```
Equipo latino profesional conversando en una oficina luminosa con ventanales,
ambiente cálido y colaborativo.
```

### 8. `header-contacto.jpg`
```
Manos estrechándose sobre una mesa de madera con planos arquitectónicos
al fondo, luz suave de ventana.
```

---

# PRIORIDAD 2 — Secciones de contenido

Proporción **4:3**. Carpeta: `frontend/public/images/secciones/`

### 9. `pilar-inversion.jpg`
```
Manos sosteniendo una tablet con gráficos de crecimiento financiero,
fondo de oficina moderna desenfocada.
```

### 10. `pilar-proyectos.jpg`
```
Balcón de departamento moderno con vista al océano Pacífico,
muebles de exterior en tonos arena.
```

### 11. `pilar-experiencias.jpg`
```
Mesa servida al aire libre frente al mar al atardecer, copas y luces
colgantes, ambiente celebratorio.
```

### 12. `paso-registro.jpg`
```
Persona latina registrándose en una laptop en una cafetería luminosa,
expresión concentrada y positiva.
```

### 13. `paso-comparte.jpg`
```
Primer plano de un celular compartiendo un enlace por mensajería,
mano latina, fondo cálido desenfocado.
```

### 14. `paso-gana.jpg`
```
Persona latina revisando su celular con expresión de satisfacción
en una terraza soleada, ambiente próspero.
```

### 15. `libertad-financiera.jpg`
```
Hombre latino de mediana edad relajado en una hamaca frente al mar
con laptop cerrada al lado, atardecer.
```

### 16. `comunidad-3i.jpg`
```
Grupo diverso de personas latinas conversando y riendo en un evento
al aire libre frente al mar, ambiente de comunidad.
```

Proporción **16:9**:

### 17. `cta-invertir.jpg`
```
Vista panorámica de terreno costero al amanecer con estacas de
levantamiento topográfico, neblina suave, promesa de desarrollo.
```

### 18. `nosotros-historia.jpg`
```
Construcción de obra civil en la costa con trabajadores y grúa
al atardecer, tonos cálidos, sensación de progreso.
```

---

# PRIORIDAD 3 — Materiales del socio

> Ahora mismo tus socios entran a Herramientas y ven tres cuadros que dicen
> literalmente **"Banner 3i #1 / #2 / #3 — próximamente"**. Es lo único de la
> plataforma que admite en voz alta que está incompleto, y lo ve justo la
> persona a la que le pides que salga a vender. Por eso está en prioridad alta
> pese a no ser una página pública.

Proporción **1:1**. Carpeta: `frontend/public/images/banners/`

### 19. `banner-viajes.jpg`
```
Playa paradisíaca del Pacífico al atardecer con sombrillas,
espacio vacío en el tercio superior para colocar texto encima.
```

### 20. `banner-inversion.jpg`
```
Edificio residencial moderno visto desde abajo contra cielo dorado,
espacio negativo amplio arriba para texto.
```

### 21. `banner-comunidad.jpg`
```
Manos latinas chocando los cinco sobre una mesa de trabajo,
fondo cálido, espacio libre en la parte superior.
```

---

# PRIORIDAD 4 — Proyecto Montañita View

> **Ibiza tiene 5 fotos. Montañita View no tiene ninguna.** Si alguien entra a
> ese proyecto hoy, la ficha se ve vacía comparada con la otra.

Carpeta: `frontend/public/images/proyectos/montanita/`

### 22. `portada.jpg` — **16:9**
```
Vista aérea de una lotización costera con calles trazadas y lotes
delimitados junto al mar del Pacífico ecuatoriano, atardecer.
```

### 23. `galeria-01.jpg` — **4:3**
```
Calle interior de urbanización costera con palmeras jóvenes,
aceras nuevas y postes de luz, día despejado.
```

### 24. `galeria-02.jpg` — **4:3**
```
Área comunal de urbanización con cancha deportiva y zona verde
frente al mar, sin personas.
```

---

## Cómo entregármelas

1. Nombre de archivo **exacto** (minúsculas, con guiones, `.jpg`).
2. Déjalas en la carpeta que indica cada bloque — ya están creadas.
3. Avísame y las implemento.

**Si vas a hacerlo por partes:** la Prioridad 1 sola ya cambia la percepción de
toda la plataforma, porque esas 8 cubren el hero de la home y las cabeceras que
hoy comparten las 4 páginas públicas. Es el 80% del resultado con el 30% del trabajo.
