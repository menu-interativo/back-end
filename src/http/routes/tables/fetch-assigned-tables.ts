import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';
import { TableStatus, type Table } from '@prisma/client';

import { prisma } from '@/lib/prisma';

type TableWithWaiter = Omit<Table, 'waiterId'> & { waiterId: NonNullable<Table['waiterId']> };

export async function fetchAssignedTables(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/tables/assigned',
		schema: {
			tags: ['Tables'],
			summary: 'Fetch all assigned tables',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					tables: z.array(
						z.object({
							id: z.string().uuid(),
							waiterId: z.string().uuid(),
							location: z.string().nullable(),
							tableNumber: z.string(),
							status: z.nativeEnum(TableStatus),
						}),
					),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['WAITER']);
			const waiterId = await request.getCurrentUserId();

			const tables = (await prisma.table.findMany({
				where: {
					waiterId: {
						not: null,
						equals: waiterId,
					},
				},
			})) as TableWithWaiter[];

			reply.status(200).send({ tables });
		},
	});
}
