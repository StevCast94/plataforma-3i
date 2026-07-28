import { Router } from 'express';
import { prisma } from '../prisma';

export const purchaseRoutes = Router();

// GET /api/purchases/:id/confirmation — comprobante público de una compra.
// Sin auth: el id (uuid) actúa como token de acceso — se comparte por WhatsApp.
// Solo expone lo necesario para el comprobante, nada sensible del sistema.
purchaseRoutes.get('/:id/confirmation', async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        amount: true,
        status: true,
        confirmedAt: true,
        createdAt: true,
        notes: true,
        product: { select: { name: true, type: true, images: true } },
        referrer: { select: { fullName: true } },
      },
    });
    if (!purchase) {
      res.status(404).json({ error: 'Comprobante no encontrado' });
      return;
    }
    res.json(purchase);
  } catch (err) {
    console.error('GET /api/purchases/:id/confirmation', err);
    res.status(400).json({ error: 'Error al obtener el comprobante' });
  }
});
