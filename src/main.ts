import cors from '@fastify/cors';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { confirmTrip } from './routes/confirm-trip';
import { createTrip } from './routes/create-trip';

async function main() {
    const app = fastify();

    app.register(cors, {
        origin: true,
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(createTrip);
    app.register(confirmTrip);

    await app.listen({ port: 3333 });
}

void main()
    .then(() => console.log('Server running at port 3333'))
    .catch(console.error);
