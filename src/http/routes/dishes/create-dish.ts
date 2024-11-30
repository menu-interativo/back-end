import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { DishCategory } from '@prisma/client';
import { z } from 'zod';

import { ConflictError } from '@/http/_errors/conflict-error';
import { prisma } from '@/lib/prisma';

export async function createDish(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/dishes',
		schema: {
			tags: ['Dishes'],
			summary: 'Create a new dish',
			security: [{ bearerAuth: [] }],
			body: z.object({
				name: z.string(),
				description: z.string(),
				category: z.nativeEnum(DishCategory),
				price: z.number().positive(),
				stock: z.number().int().positive(),
			}),
			response: {
				201: z.object({
					dishId: z.string().uuid(),
				}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { name, description, category, price, stock } = request.body;
			const slug = name
				.normalize('NFKD')
				.toLowerCase()
				.trim()
				.replace(/\s+/g, '-')
				.replace(/[^\w-]/g, '')
				.replace(/_/g, '-')
				.replace(/-{2,}/g, '-')
				.replace(/-$/, '');

			const dishWithSameSlug = await prisma.dish.findFirst({
				where: { slug },
			});

			if (dishWithSameSlug) {
				throw new ConflictError('A dish with the same name already exists');
			}

			const { id } = await prisma.dish.create({
				data: {
					name,
					slug,
					description,
					category,
					price,
					stock,
				},
				select: {
					id: true,
				},
			});

			return reply.status(201).send({ dishId: id });
		},
	});
}
