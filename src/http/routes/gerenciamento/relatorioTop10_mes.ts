import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function salesStatistics(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/sales/statistics',
    schema: {
      tags: ['Sales'],
      summary: 'Get sales statistics',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          bestDish: z.object({
            name: z.string(),
            totalSales: z.number(),
          }),
          totalSales: z.number(),
          bestWaiter: z.object({
            name: z.string(),
            totalSales: z.number(),
          }),
          peakHour: z.object({
            hour: z.string(),
            totalSales: z.number(),
          }),
          weeklySales: z.array(
            z.object({
              date: z.string(),
              totalSales: z.number(),
            })
          ),
        }),
      },
    },
    async handler(request, reply) {
      // Verifique se o usuário tem o papel apropriado
      await request.checkAnyRole(['ADMIN', 'WAITER']);

      // Total de vendas
      const totalSalesResult = await prisma.bill.aggregate({
        _sum: {
          total: true,
        },
      });

      const totalSales = totalSalesResult._sum.total || 0;

      // Melhor prato
      const bestDish = await prisma.orderItem.groupBy({
        by: ['dishId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 1,
      });

      let bestDishData = {
        name: 'Unknown Dish',
        totalSales: 0,
      };

      if (bestDish.length > 0) {
        const dish = await prisma.dish.findUnique({
          where: { id: bestDish[0].dishId },
          select: { name: true },
        });

        bestDishData = {
          name: dish?.name || 'Unknown Dish',
          totalSales: bestDish[0]._sum.quantity || 0,
        };
      }

      // Melhor garçom
      const bestWaiter = await prisma.order.groupBy({
        by: ['waiterId'],
        _sum: {
          total: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 1,
      });

      let bestWaiterData = {
        name: 'Unknown Waiter',
        totalSales: 0,
      };

      if (bestWaiter.length > 0) {
        const waiter = await prisma.user.findUnique({
          where: { id: bestWaiter[0].waiterId },
          select: { name: true },
        });

        bestWaiterData = {
          name: waiter?.name || 'Unknown Waiter',
          totalSales: bestWaiter[0]._sum.total || 0,
        };
      }

      // Horário de pico do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Consulta para encontrar as vendas por hora
      const peakHours = await prisma.order.groupBy({
        by: ['createdAt'],
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 1,
      });

      let peakHourData = {
        hour: '00:00',
        totalSales: 0,
      };

      if (peakHours.length > 0) {
        const peak = peakHours[0];
        const hour = new Date(peak.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        peakHourData = {
          hour,
          totalSales: peak._sum.total || 0,
        };
      }

      // Controle semanal de vendas
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weeklySales = await prisma.bill.groupBy({
        by: ['createdAt'],
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
      });

      // Formatar os resultados das vendas semanais
      const formattedWeeklySales = weeklySales.map((sale) => ({
        date: new Date(sale.createdAt).toISOString().split('T')[0],
        totalSales: sale._sum.total || 0,
      }));

      reply.status(200).send({
        bestDish: bestDishData,
        totalSales,
        bestWaiter: bestWaiterData,
        peakHour: peakHourData,
        weeklySales: formattedWeeklySales,
      });
    },
  });
}
