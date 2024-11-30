import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';
import { hash } from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { ConflictError } from '@/http/_errors/conflict-error';

export async function createUser(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/users',
		schema: {
			tags: ['Users'],
			summary: 'Create a new user',
			security: [{ bearerAuth: [] }],
			body: z.object({
				name: z.string().min(2),
				email: z.string().email(),
				registrationNumber: z.string(),
				password: z.string().min(8),
			}),
			response: {
				201: z.object({
					userId: z.string().uuid(),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { name, email, registrationNumber, password } = request.body;

			const userFromEmail = await prisma.user.findUnique({
				where: {
					email,
				},
			});

			if (userFromEmail) {
				throw new ConflictError('Email already in use');
			}

			const userFromRegistrationNumber = await prisma.user.findUnique({
				where: {
					registrationNumber,
				},
			});

			if (userFromRegistrationNumber) {
				throw new ConflictError('Registration number already in use');
			}

			const passwordHash = await hash(password, 6);
			const { id } = await prisma.user.create({
				data: {
					name,
					email,
					registrationNumber,
					passwordHash,
				},
				select: {
					id: true,
				},
			});

			reply.status(201).send({ userId: id });
		},
	});
}
