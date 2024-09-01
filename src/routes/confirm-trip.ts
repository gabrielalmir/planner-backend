import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

const ConfirmTripSchema = {
    params: z.object({
        tripId: z.string().uuid(),
    }),
};

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/confirm', { schema: ConfirmTripSchema }, async (request, reply) => {
        const { tripId } = request.params;
        return { tripId }
    });
}
