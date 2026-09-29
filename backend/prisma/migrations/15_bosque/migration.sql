-- CreateTable
CREATE TABLE "TreeSpecies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreeSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tree" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "zone" TEXT,
    "plantedAt" TIMESTAMP(3),
    "photos" TEXT[],
    "notes" TEXT,
    "adoptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeAdoption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "speciesId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "dedication" TEXT,
    "message" TEXT,
    "referralCode" TEXT,
    "source" TEXT NOT NULL DEFAULT 'web',
    "subscription" BOOLEAN NOT NULL DEFAULT false,
    "lotId" TEXT,
    "lotCode" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreeAdoption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeUpdate" (
    "id" TEXT NOT NULL,
    "treeId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreeSpecies_slug_key" ON "TreeSpecies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_code_key" ON "Tree"("code");

-- CreateIndex
CREATE INDEX "Tree_adoptionId_idx" ON "Tree"("adoptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TreeAdoption_code_key" ON "TreeAdoption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TreeAdoption_lotId_key" ON "TreeAdoption"("lotId");

-- CreateIndex
CREATE INDEX "TreeUpdate_treeId_idx" ON "TreeUpdate"("treeId");

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "TreeSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_adoptionId_fkey" FOREIGN KEY ("adoptionId") REFERENCES "TreeAdoption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeAdoption" ADD CONSTRAINT "TreeAdoption_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "TreeSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeUpdate" ADD CONSTRAINT "TreeUpdate_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Especies iniciales del piloto (precios tentativos: se ajustan desde el panel con el costo real del vivero)
INSERT INTO "TreeSpecies" ("id","slug","name","scientificName","category","description","price","sortOrder","updatedAt") VALUES
('sp-guayacan','guayacan','Guayacán','Handroanthus chrysanthus','NATIVE','El árbol estrella del bosque seco. Cada año se cubre de flores amarillas antes de las lluvias y tiñe la loma de oro.',30,1,CURRENT_TIMESTAMP),
('sp-ebano','ebano','Ébano','Ziziphus thyrsiflora','NATIVE','Especie emblemática de Santa Elena, de madera dura y copa amplia. Resiste la sequía y da sombra a la fauna.',30,2,CURRENT_TIMESTAMP),
('sp-cedro','cedro','Cedro','Cedrela odorata','NATIVE','Especie amenazada de gran porte. Se siembra en la zona baja, cerca del río, para ayudar a su conservación.',30,3,CURRENT_TIMESTAMP),
('sp-palo-santo','palo-santo','Palo santo','Bursera graveolens','NATIVE','Árbol aromático de la identidad costeña. Su madera caída perfuma el bosque; aquí nunca se corta.',30,4,CURRENT_TIMESTAMP),
('sp-ceibo','ceibo','Ceibo monumental','Ceiba trichistandra','MONUMENTAL','El gigante del bosque seco, de tronco verde y abombado. Se ubica en un punto destacado y lleva placa con el nombre de su padrino.',90,5,CURRENT_TIMESTAMP),
('sp-mango','mango','Mango','Mangifera indica','FRUIT','Frutal resistente a la sequía una vez establecido. Su cosecha abastece al restaurante de Montañita View Lobby.',25,6,CURRENT_TIMESTAMP),
('sp-guayaba','guayaba','Guayaba','Psidium guajava','FRUIT','Frutal rústico que empieza a producir en 2 a 3 años. Atrae aves y alimenta a la comunidad.',25,7,CURRENT_TIMESTAMP),
('sp-aguacate','aguacate','Aguacate','Persea americana','FRUIT','Se siembra solo junto al río, donde tiene el agua que necesita. Plazas limitadas.',30,8,CURRENT_TIMESTAMP);
