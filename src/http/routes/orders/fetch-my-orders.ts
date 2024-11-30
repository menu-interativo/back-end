import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function fetchMyOrders(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/orders/my',
		schema: {
			tags: ['Orders'],
			summary: 'Fetch my orders',
			security: [{ cookieAuth: [] }],
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
			const sessionId = request.cookies.sessionId;

			if (!sessionId) {
				return reply.status(200).send({ orders: [] });
			}

			const orders = await prisma.order.findMany({
				where: {
					sessionId,
				},
			});

			return reply.status(200).send({ orders });
		},
	});
}
