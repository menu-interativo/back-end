import { fastify } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyJwt from '@fastify/jwt';

import {
	serializerCompiler,
	validatorCompiler,
	ZodTypeProvider,
	jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import fastifyCookie from '@fastify/cookie';

import { env } from '@/env';

import { errorHandler } from './error-handler';

import { auth } from './middlewares/auth';

import { createUser } from './routes/users/create-user';
import { authenticate } from './routes/auth/authenticate';
import { getProfile } from './routes/auth/get-profile';
import { fetchUsers } from './routes/users/fetch-users';
import { updateUser } from './routes/users/update-user';
import { createTable } from './routes/tables/create-table';
import { fetchTables } from './routes/tables/fetch-tables';
import { fetchAssignedTables } from './routes/tables/fetch-assigned-tables';
import { updateTable } from './routes/tables/update-table';
import { assignTables } from './routes/users/assign-tables';
import { getTable } from './routes/tables/get-table';
import { getUser } from './routes/users/get-user';
import { addCustomizationsToDish } from './routes/dishes/add-customizations-to-dish';
import { createCustomization } from './routes/dishes/create-customization';
import { createDish } from './routes/dishes/create-dish';
import { fetchAvailableDishesByCategory } from './routes/dishes/fetch-available-dishes-by-category';
import { fetchDishes } from './routes/dishes/fetch-dishes';
import { createOrder } from './routes/orders/create-order';
import { fetchOrders } from './routes/orders/fetch-orders';
import { fetchCurrentOrdersByTable } from './routes/orders/fetch-current-orders-by-table';
import { fetchMyOrders } from './routes/orders/fetch-my-orders';
import { salesStatistics } from './routes/gerenciamento/relatorioTop10_mes';
import { reviewStatistics } from './routes/gerenciamento/reviewsStatistics';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
});

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'SampleApi',
			description: 'Sample backend service',
			version: '1.0.0',
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
				cookieAuth: {
					type: 'apiKey',
					in: 'cookie',
					name: 'sessionId',
				},
			},
		},
	},
	transform: jsonSchemaTransform,
});

app.register(fastifyCookie);

app.register(fastifySwaggerUI, {
	routePrefix: '/documentation',
});

app.register(auth);

app.register(authenticate);
app.register(getProfile);

app.register(createUser);
app.register(fetchUsers);
app.register(updateUser);
app.register(assignTables);
app.register(getUser);

app.register(fetchTables);
app.register(fetchAssignedTables);
app.register(createTable);
app.register(updateTable);
app.register(getTable);

app.register(addCustomizationsToDish);
app.register(createCustomization);
app.register(createDish);
app.register(fetchAvailableDishesByCategory);
app.register(fetchDishes);

app.register(createOrder);
app.register(fetchOrders);
app.register(fetchCurrentOrdersByTable);
app.register(fetchMyOrders);

app.register(salesStatistics);
app.register(reviewStatistics);

app.listen({ port: env.PORT }).then(() => {
	console.log(`Server listening on port ${env.PORT}`);
});
