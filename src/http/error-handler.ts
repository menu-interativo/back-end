import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { env } from '@/env';

import { ConflictError } from './_errors/conflict-error';
import { BadRequestError } from './_errors/bad-request-error';
import { UnauthorizedError } from './_errors/unauthorized-error';
import { NotFoundError } from './_errors/not-found-error';
import { ForbiddenError } from './_errors/forbidden-error';

type FastifyErrorHandler = FastifyInstance['errorHandler'];

export const errorHandler: FastifyErrorHandler = async (error, _er, reply) => {
	if (error instanceof ZodError) {
		return reply.status(400).send({
			message: 'Validation error.',
			issues: error.flatten().fieldErrors,
		});
	}

	if (error instanceof BadRequestError) {
		return reply.status(400).send({
			message: error.message,
		});
	}

	if (error instanceof UnauthorizedError) {
		return reply.status(401).send({
			message: error.message,
		});
	}

	if (error instanceof NotFoundError) {
		return reply.status(404).send({
			message: error.message,
		});
	}

	if (error instanceof ConflictError) {
		return reply.status(409).send({
			message: error.message,
		});
	}

	if (error instanceof ForbiddenError) {
		return reply.status(403).send({
			message: error.message,
		});
	}

	if (env.NODE_ENV === 'production') {
		/* TODO: Log error */
	} else {
		console.error(error);
	}

	return reply.status(500).send({
		message: 'Internal server error',
	});
};
