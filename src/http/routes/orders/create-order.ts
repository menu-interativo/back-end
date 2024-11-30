import { NotFoundError } from '@/http/_errors/not-found-error';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createOrder(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/orders',
		schema: {
			tags: ['Orders'],
			summary: 'Create a new order',
			body: z.object({
				tableId: z.string().uuid(),
				dishes: z.array(
					z.object({
						dishId: z.string().uuid(),
						quantity: z.number().int().positive(),
						customizations: z
							.array(
								z.object({
									customizationId: z.string().uuid(),
									quantity: z.number().int().positive(),
								}),
							)
							.optional(), // Optional customizations
					}),
				),
			}),
			response: {
				201: z.object({
					orderId: z.string().uuid(),
				}),
			},
		},
		async handler(request, reply) {
			const { tableId, dishes } = request.body;

			// Verify table is available
			const table = await prisma.table.findUnique({
				where: {
					id: tableId,
					status: { not: 'OUT_OF_SERVICE' },
					waiterId: { not: null },
				},
			});

			if (!table) {
				throw new NotFoundError('Table not found or not available for orders');
			}

			// Fetch all dishes with customizations in one query
			const dishIds = dishes.map(dish => dish.dishId);
			const dishesFound = await prisma.dish.findMany({
				where: { id: { in: dishIds } },
				include: { customizations: true },
			});

			if (dishesFound.length !== dishes.length) {
				throw new NotFoundError('Some dishes were not found');
			}

			// Map dishes for easier access
			const dishMap = new Map(dishesFound.map(dish => [dish.id, dish]));

			// Process dishes to create
			const dishesToCreate = dishes.map(({ dishId, quantity, customizations = [] }) => {
				const dish = dishMap.get(dishId);
				if (!dish) {
					throw new NotFoundError(`Dish not found: ${dishId}`);
				}

				// Map customizations if present
				const customizationMap = new Map(dish.customizations.map(c => [c.id, c]));
				const customizationData = customizations.map(({ customizationId, quantity }) => {
					const customization = customizationMap.get(customizationId);
					if (!customization) {
						throw new NotFoundError(`Customization not found: ${customizationId}`);
					}
					return { customizationId, quantity, price: customization.price };
				});

				return {
					dishId,
					quantity,
					price: dish.price,
					customizations: customizationData,
				};
			});

			// Calculate total price
			const totalPrice = dishesToCreate.reduce((acc, { price, quantity, customizations }) => {
				const customizationsPrice = customizations.reduce(
					(customAcc, { price, quantity }) => customAcc + price * quantity,
					0,
				);
				return acc + price * quantity + customizationsPrice;
			}, 0);

			// Generate order number
			const orderNumber = (await prisma.order.count()) + 1;

			// Handle sessionId and set cookie if needed
			const sessionId = request.cookies.sessionId || randomUUID();
			if (!request.cookies.sessionId) {
				reply.setCookie('sessionId', sessionId, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					path: '/',
				});
			}

			// Use a transaction for creating order and updating stock
			await prisma.$transaction(async tsx => {
				const { id: orderId } = await tsx.order.create({
					data: {
						orderNumber: orderNumber.toString().padStart(4, '0'),
						tableId,
						waiterId: table.waiterId!,
						total: totalPrice,
						sessionId,
					},
				});

				// Create order items and update stock concurrently
				const orderItemsPromises = dishesToCreate.map(
					({ dishId, quantity, price, customizations }) =>
						tsx.orderItem.create({
							data: {
								orderId,
								dishId,
								quantity,
								price,
								customizations: {
									createMany: { data: customizations },
								},
							},
						}),
				);

				const stockUpdatesPromises = dishesToCreate.map(({ dishId, quantity }) =>
					tsx.dish.update({
						where: { id: dishId },
						data: { stock: { decrement: quantity } },
					}),
				);

				await Promise.all([...orderItemsPromises, ...stockUpdatesPromises]);

				reply.status(201).send({ orderId });
			});
		},
	});
}
