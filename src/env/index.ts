import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
	DATABASE_URL: z.string(),
	JWT_SECRET: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
	console.error(_env.error.format());
	process.exit(1);
}

export const env = _env.data;
