import { NotFoundError } from '@/http/_errors/not-found-error';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getUser(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/users/:userId',
		schema: {
			tags: ['Users'],
			summary: 'Get a user by ID',
			security: [{ bearerAuth: [] }],
			params: z.object({
				userId: z.string().uuid(),
			}),
			response: {
				200: z.object({
					user: z.object({
						id: z.string().uuid(),
						registrationNumber: z.string(),
						name: z.string(),
						email: z.string().email(),
						role: z.nativeEnum(Role),
					}),
				}),
			},
		},
		async handler(request, reply) {
			request.checkAnyRole(['ADMIN']);
			const { userId } = request.params;

			const user = await prisma.user.findUnique({ where: { id: userId } });

			if (!user) {
				throw new NotFoundError('User not found');
			}

			return reply.status(200).send({
				user,
			});
		},
	});
}
