import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function updateUser(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'PUT',
		url: '/users/:id',
		schema: {
			tags: ['Users'],
			summary: 'Update user',
			description: 'update user information',
			security: [{ bearerAuth: [] }],
			body: z.object({
				name: z.string(),
				avatarUrl: z.string().url().nullable(),
				role: z.nativeEnum(Role),
			}),
			params: z.object({
				id: z.string().uuid(),
			}),
			response: {
				200: z.object({
					user: z.object({
						id: z.string().uuid(),
						registrationNumber: z.string(),
						name: z.string(),
						email: z.string(),
						avatarUrl: z.string().url().nullable(),
					}),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { name, avatarUrl, role } = request.body;

			const user = await prisma.user.update({
				where: { id: request.params.id },
				data: {
					name,
					avatarUrl,
					role,
				},
			});

			return reply.send({ user });
		},
	});
}
