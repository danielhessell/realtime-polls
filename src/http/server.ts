import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import z from "zod";

const server = fastify();

const prisma = new PrismaClient();

server.post("/polls", async (request, reply) => {
  const createPollBody = z.object({
    title: z.string()
  });

  const { title } = createPollBody.parse(request.body);

  const {id} = await prisma.poll.create({
    data: {
      title
    }
  });

  return reply.status(201).send({pollId: id});
});

server.listen({ port: 8080 }).then(() => {
  console.log("HTTP server is running on port 8080!");
});