import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { DishCategory } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function fetchAvailableDishesByCategory(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/dishes/:category/available',
		schema: {
			tags: ['Dishes'],
			summary: 'Fetch available dishes by category',
			params: z.object({
				category: z.nativeEnum(DishCategory),
			}),
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
							stock: z.number(),
							imageUrl: z.string().url().nullable(),
						}),
					),
				}),
			},
		},
		async handler(request, reply) {
			const { category } = request.params;

			// Busca os pratos no banco
			const dishes = await prisma.dish.findMany({
				where: {
					category,
					stock: {
						gt: 0,
					},
				},
			});

			// Formata os dados para o esquema esperado
			const formattedDishes = dishes.map(dish => ({
				id: dish.id, // Certifique-se que é UUID no banco
				name: dish.name,
				slug: dish.slug,
				description: dish.description,
				category: dish.category,
				price: dish.price,
				stock: dish.stock,
				imageUrl: dish.imageUrl || null, // Mapeia image_url para imageUrl
			}));

			// Retorna os dados formatados
			return reply.status(200).send({ dishes: formattedDishes });
		},
	});
}
