import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';
import { TableStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function updateTable(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'PUT',
		url: '/tables',
		schema: {
			tags: ['Tables'],
			summary: 'Update a table',
			security: [{ bearerAuth: [] }],
			params: z.object({
				id: z.string().uuid(),
			}),
			body: z.object({
				waiterId: z.string().uuid().nullable(),
				location: z.string().nullable(),
				status: z.nativeEnum(TableStatus),
			}),
			response: {
				204: z.undefined(),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);
			const { id } = request.params;
			const { waiterId, location, status } = request.body;

			await prisma.table.update({
				where: { id },
				data: {
					waiterId,
					location,
					status,
				},
			});

			reply.status(204).send();
		},
	});
}
