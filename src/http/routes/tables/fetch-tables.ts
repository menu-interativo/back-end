import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';
import { TableStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function fetchTables(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/tables',
		schema: {
			tags: ['Tables'],
			summary: 'Fetch all tables',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					tables: z.array(
						z.object({
							id: z.string().uuid(),
							waiterId: z.string().uuid().nullable(),
							location: z.string().nullable(),
							tableNumber: z.string(),
							status: z.nativeEnum(TableStatus),
						}),
					),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const tables = await prisma.table.findMany();

			reply.status(200).send({ tables });
		},
	});
}
