import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function reviewStatistics(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/reviews/statistics',
    schema: {
      tags: ['Reviews'],
      summary: 'Get review statistics',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          likedPercentage: z.number(),
          dislikedPercentage: z.number(),
          categories: z.array(z.object({
            name: z.string(),
            likedCount: z.number(),
            dislikedCount: z.number(),
          })),
        }),
      },
    },
    async handler(request, reply) {
      // Verifique se o usuário tem o papel apropriado
      await request.checkAnyRole(['ADMIN', 'WAITER']);

      // Obtenha todas as avaliações
      const reviews = await prisma.review.findMany();

      const totalReviews = reviews.length;
      const likedCount = reviews.filter(review => review.rating === 2).length; // "gostei"
      const dislikedCount = reviews.filter(review => review.rating === 1).length; // "não gostei"

      // Cálculo das porcentagens
      const likedPercentage = totalReviews > 0 ? (likedCount / totalReviews) * 100 : 0;
      const dislikedPercentage = totalReviews > 0 ? (dislikedCount / totalReviews) * 100 : 0;

      // Contagem de avaliações por categoria
      const categories = reviews.reduce((acc, review) => {
        const existingCategory = acc.find(cat => cat.name === review.category);

        if (existingCategory) {
          if (review.rating === 2) {
            existingCategory.likedCount += 1;
          } else {
            existingCategory.dislikedCount += 1;
          }
        } else {
          acc.push({
            name: review.category,
            likedCount: review.rating === 2 ? 1 : 0,
            dislikedCount: review.rating === 1 ? 1 : 0,
          });
        }

        return acc;
      }, [] as { name: string; likedCount: number; dislikedCount: number; }[]);

      reply.status(200).send({
        likedPercentage,
        dislikedPercentage,
        categories,
      });
    },
  });
}
