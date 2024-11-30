import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { BadRequestError } from '@/http/_errors/bad-request-error';

export async function assignTables(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'PUT',
		url: '/user/:userId/assign-tables',
		schema: {
			tags: ['Users'],
			summary: 'Assign tables to a user',
			security: [{ bearerAuth: [] }],
			params: z.object({
				userId: z.string().uuid(),
			}),
			body: z.object({
				tableIds: z.array(z.string().uuid()),
			}),
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { tableIds } = request.body;
			const { userId } = request.params;

			const isWaiter = await prisma.user.findFirst({
				where: {
					id: userId,
					role: 'WAITER',
				},
			});

			if (!isWaiter) {
				throw new BadRequestError('User is not a waiter');
			}

			const numberOfTablesFound = await prisma.table.count({
				where: {
					id: {
						in: tableIds,
					},
				},
			});
			if (numberOfTablesFound !== tableIds.length) {
				throw new BadRequestError('Some tables do not exist');
			}

			await prisma.table.updateMany({
				where: {
					id: {
						in: tableIds,
					},
				},
				data: {
					waiterId: userId,
				},
			});

			return reply.status(204).send();
		},
	});
}
