import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';


import { compare } from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { BadRequestError } from '@/http/_errors/bad-request-error';

export async function authenticate(app: FastifyInstance) {

	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/sessions',
		schema: {
			tags: ['Auth'],
			summary: 'Authenticate a user',
			body: z
				.object({
					registrationNumber: z.string().optional(),
					email: z.string().email().optional(),
					password: z.string(),
				})
				.refine(
					data => {
						if (!data.registrationNumber && !data.email) {
							return false;
						}

						return true;
					},
					{
						message: 'You must provide either a registration number or an email',
						path: ['registrationNumber', 'email'],
					},
				),
			response: {
				200: z.object({
					token: z.string(),
				}),
			},
		},
		async handler(request, reply) {
			const { registrationNumber, email, password } = request.body;

			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{
							email,
						},
						{
							registrationNumber,
						},
					],
				},
			});

			console.log(user);

			if (!user) {
				throw new BadRequestError('Invalid credentials');
			}

			const passwordMatch = await compare(password, user.passwordHash);

			if (!passwordMatch) {
				throw new BadRequestError('Invalid credentials');
			}

			const token = await reply.jwtSign(
				{
					sub: user.id,
				},
				{
					sign: {
						expiresIn: '1d',
					},
				},
			);

			return reply.send({ token });
		},
	});
}
