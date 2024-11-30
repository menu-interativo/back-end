import type { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

import { UnauthorizedError } from '../_errors/unauthorized-error';
import { ForbiddenError } from '../_errors/forbidden-error';

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (request, _) => {
		request.getCurrentUserId = async () => {
			try {
				const { sub } = await request.jwtVerify<{ sub: string }>();

				return sub;
			} catch (error) {
				throw new UnauthorizedError('Invalid or missing token');
			}
		};

		request.checkAnyRole = async (roles: Role[]) => {
			const userId = await request.getCurrentUserId();

			const user = await prisma.user.findUnique({
				select: {
					role: true,
				},
				where: {
					id: userId,
				},
			});

			if (!user || !roles.includes(user.role)) {
				throw new ForbiddenError('You do not have permission to access this resource');
			}
		};
	});
});
