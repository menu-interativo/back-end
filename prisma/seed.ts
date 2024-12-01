import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

import dishesFromJson from '../dishes.json';
import { slugify } from '../src/helpers/slugify';

const prisma = new PrismaClient();

async function seed() {
	await prisma.user.deleteMany();
	await prisma.dish.deleteMany();

	const slugs: string[] = [];
	const dishes = dishesFromJson
		.map(dish => {
			const name = dish['Item Name'];
			return {
				name,
				slug: slugify(name),
				description: dish.Description,
				price: dish.Price,
				imageUrl: dish.Image,
				category: dish.categoris,
				stock: 100,
			};
		})
		.filter(dish => {
			if (slugs.includes(dish.slug)) {
				return false;
			}

			slugs.push(dish.slug);
			return true;
		});

	await prisma.user.create({
		data: {
			name: 'admin',
			email: 'admin@email.com',
			registrationNumber: '0000',
			avatarUrl: 'https://api.dicebear.com/9.x/lorelei/svg?flip=true',
			role: 'ADMIN',
			passwordHash: await hash('admin', 1),
		},
	});

	await prisma.dish.createMany({
		data: dishes,
	});
}

seed()
	.then(() => {
		console.log('Seed completed');
	})
	.finally(() => {
		prisma.$disconnect();
	});
