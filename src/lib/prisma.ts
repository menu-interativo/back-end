import { PrismaClient } from '@prisma/client';
import { env } from '../env';

console.log(env.NODE_ENV);

export const prisma = new PrismaClient({
	log: env.NODE_ENV === 'production' ? [] : ['query'],
});
