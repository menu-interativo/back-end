import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export async function fetchUsers(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/users',
		schema: {
			tags: ['Users'],
			summary: 'Fetch users',
			description: 'Returns a list of all users',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					users: z.array(
						z.object({
							id: z.string().uuid(),
							registrationNumber: z.string(),
							name: z.string(),
							email: z.string(),
							avatarUrl: z.string().url().nullable(),
						}),
					),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const users = await prisma.user.findMany({
				select: {
					id: true,
					registrationNumber: true,
					name: true,
					email: true,
					avatarUrl: true,
				},
			});

			return reply.send({ users });
		},
	});
}
