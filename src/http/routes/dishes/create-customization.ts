import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export async function createCustomization(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/dishes/customizations',
		schema: {
			tags: ['Dishes'],
			summary: 'Create a new customization for a dish',
			security: [{ bearerAuth: [] }],
			body: z.object({
				name: z.string(),
				price: z.number().positive(),
			}),
			response: {
				201: z.object({
					customizationId: z.string().uuid(),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { name, price } = request.body;

			const { id } = await prisma.customization.create({
				data: {
					name,
					price,
				},
				select: { id: true },
			});

			return reply.code(201).send({ customizationId: id });
		},
	});
}
