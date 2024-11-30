import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

import { NotFoundError } from '@/http/_errors/not-found-error';
import { prisma } from '@/lib/prisma';

export async function getTable(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/tables/:tableId',
		schema: {
			tags: ['Tables'],
			summary: 'Get a table with orders and assigned users',
			security: [{ bearerAuth: [] }],
			params: z.object({
				tableId: z.string().uuid(),
			}),
			response: {
				200: z.object({
					table: z.object({
						id: z.string().uuid(),
						tableNumber: z.string(),
						assignedTo: z
							.object({
								id: z.string().uuid(),
								name: z.string(),
								registrationNumber: z.string(),
							})
							.nullable(),
						orders: z.array(
							z.object({
								id: z.string().uuid(),
								orderNumber: z.string(),
								total: z.number().positive(),
								status: z.nativeEnum(OrderStatus),
							}),
						),
					}),
				}),
				404: z.object({
					message: z.string(),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN', 'WAITER']);

			const { tableId } = request.params;

			const table = await prisma.table.findFirst({
				where: { id: tableId },
				include: {
					assignedTo: {
						select: {
							id: true,
							name: true,
							registrationNumber: true,
						},
					},
					orders: {
						select: {
							id: true,
							orderNumber: true,
							total: true,
							status: true,
						},
					},
				},
			});

			if (!table) {
				throw new NotFoundError('Table not found');
			}

			return reply.status(200).send({ table });
		},
	});
}
