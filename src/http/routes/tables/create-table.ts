import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export async function createTable(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/tables',
		schema: {
			tags: ['Tables'],
			summary: 'Create a new table',
			security: [{ bearerAuth: [] }],
			body: z.object({
				tableNumber: z.string(),
				location: z.string().nullable(),
			}),
			response: {
				201: z.object({
					tableId: z.string().uuid(),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { tableNumber, location } = request.body;

			const { id } = await prisma.table.create({
				data: {
					tableNumber,
					location,
				},
				select: {
					id: true,
				},
			});

			reply.status(201).send({ tableId: id });
		},
	});
}
