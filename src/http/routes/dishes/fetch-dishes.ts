import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { DishCategory } from '@prisma/client';

export async function fetchDishes(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/dishes',
		schema: {
			tags: ['Dishes'],
			summary: 'Fetch all dishes',
			security: [{ bearerAuth: [] }],
			response: {
				200: z.object({
					dishes: z.array(
						z.object({
							id: z.string().uuid(),
							name: z.string(),
							slug: z.string(),
							description: z.string(),
							category: z.nativeEnum(DishCategory),
							price: z.number().positive(),
							stock: z.number().positive(),
						}),
					),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const dishes = await prisma.dish.findMany();

			return reply.status(200).send({ dishes });
		},
	});
}
