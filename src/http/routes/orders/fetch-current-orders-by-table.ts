import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function fetchCurrentOrdersByTable(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/tables/:tableId/orders/current',
		schema: {
			tags: ['Orders', 'Tables'],
			summary: 'Fetch current orders by table',
			security: [{ bearerAuth: [] }],
			params: z.object({
				tableId: z.string().uuid(),
			}),
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
			await request.checkAnyRole(['ADMIN', 'WAITER']);
			const orders = await prisma.order.findMany({
				where: {
					tableId: request.params.tableId,
					OR: [
						{
							bill: null,
						},
						{
							bill: {
								status: 'PENDING',
							},
						},
					],
				},
			});

			return reply.status(200).send({ orders });
		},
	});
}
