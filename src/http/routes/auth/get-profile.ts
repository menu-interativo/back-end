import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

import { NotFoundError } from '@/http/_errors/not-found-error';

export async function getProfile(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/profile',
		schema: {
			tags: ['Auth'],
			summary: 'Get user profile',
			description: 'Get user profile',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					user: z.object({
						id: z.string().uuid(),
						name: z.string(),
						registrationNumber: z.string(),
						avatarUrl: z.string().url().nullable(),
						role: z.string(),
					}),
				}),
				404: z.object({ message: z.string() }),
			},
		},
		async handler(request, reply) {
			const userId = await request.getCurrentUserId();

			const user = await prisma.user.findUnique({
				select: {
					id: true,
					name: true,
					registrationNumber: true,
					avatarUrl: true,
					role: true,
				},
				where: {
					id: userId,
				},
			});

			if (!user) {
				throw new NotFoundError('User not found');
			}

			return reply.send({ user });
		},
	});
}
