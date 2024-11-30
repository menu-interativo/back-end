import 'fastify';

import type { Role } from '@prisma/client';

declare module 'fastify' {
	interface FastifyRequest {
		getCurrentUserId: () => Promise<string>;
		checkAnyRole: (roles: Role[]) => Promise<void>;
	}
}
