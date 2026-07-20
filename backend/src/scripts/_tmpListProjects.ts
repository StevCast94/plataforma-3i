import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.project
  .findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      images: true,
      coverImage: true,
      priceLabel: true,
      priceFrom: true,
      location: true,
      description: true,
      showBrochure: true,
    },
  })
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .finally(() => p.$disconnect());
