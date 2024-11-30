import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function fetchOrders(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/orders',
		schema: {
			tags: ['Orders'],
			summary: 'Fetch all orders',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					orders: z.array(
						z.object({
							id: z.string().uuid(),
							orderNumber: z.string(),
							tableId: z.string().uuid(),
							waiterId: z.string().uuid(),
							total: z.number().positive(),
							status: z.nativeEnum(OrderStatus),
						}),
					),
				}),
			},
		},

		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const orders = await prisma.order.findMany();

			return reply.status(200).send({ orders });
		},
	});
}
