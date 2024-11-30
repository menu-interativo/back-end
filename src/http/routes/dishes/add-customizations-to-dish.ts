import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/http/_errors/not-found-error';

export async function addCustomizationsToDish(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'PUT',
		url: '/dishes/:slug/customizations',
		schema: {
			tags: ['Dishes'],
			summary: 'Add customizations to a dish',
			security: [{ bearerAuth: [] }],
			params: z.object({
				slug: z.string(),
			}),
			body: z.object({
				customizationIds: z.array(z.string().uuid()),
			}),
			response: {
				204: z.object({}),
			},
		},
		async handler(request, reply) {
			await request.checkAnyRole(['ADMIN']);

			const { customizationIds } = request.body;
			const { slug } = request.params;

			const dish = await prisma.dish.findUnique({
				where: {
					slug,
				},
				select: {
					id: true,
				},
			});

			if (!dish) {
				throw new NotFoundError('Dish not found');
			}

			await prisma.customization.updateMany({
				where: {
					id: {
						in: customizationIds,
					},
				},
				data: {
					dishId: dish.id,
				},
			});

			return reply.status(204).send();
		},
	});
}
