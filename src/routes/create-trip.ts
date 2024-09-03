import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { prisma } from "../lib/prisma";

const CreateTripSchema = {
    body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email(),
        emails_to_invite: z.array(z.string().email())
    })
};

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', { schema: CreateTripSchema }, async (request, reply) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body;

        if (dayjs(starts_at).isBefore(new Date()) || dayjs(ends_at).isBefore(starts_at)) {
            return reply.status(400).send({ error: 'Invalid trip date' });
        }

        const trip = await prisma.trip.create({
            data: {
                destination, starts_at, ends_at,
                participants: {
                    createMany: {
                        data: [
                            { email: owner_email, name: owner_name, is_confirmed: true, is_owner: true },
                            ...emails_to_invite.map(email => ({ email }))
                        ]
                    }
                }
            },
        });

        const formattedStartDate = dayjs(starts_at).format('LL');
        const formattedEndDate = dayjs(ends_at).format('LL');
        const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`;

        const mail = await getMailClient();
        const message = await mail.sendMail({
            from: { name: 'Equipe Planner', address: 'hi@plann.er' },
            to: { name: owner_name, address: owner_email },
            subject: `Planner - Confirme sua viagem para ${destination}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                    <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong>, nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
                    <p></p>
                    <p>Para confirmar sua viagem, clique no link abaixo:</p>
                    <p></p>
                    <p>
                        <a href="${confirmationLink}">Confirmar Viagem</a>
                    </p>
                    <p></p>
                    <p>Caso você não saiba do que se trata esse e-mail, apenas o ignore.</p>
                </div>
            `.trim()
        });

        console.log(nodemailer.getTestMessageUrl(message));

        return { tripId: trip.id };
    });
}
