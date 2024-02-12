import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { randomUUID } from "node:crypto";
import { redis } from "../../lib/redis";

export async function voteOnPoll(server: FastifyInstance) {
  server.post("/polls/:pollId/votes", async (request, reply) => {
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParams.parse(request.params);
    const { pollOptionId } = voteOnPollBody.parse(request.body);

    let { sessionId } = request.cookies;
    if (!sessionId) {
      sessionId = randomUUID();
      reply.setCookie("sessionId", sessionId, {
        path: "/", // Cookie is accessible from all routes
        maxAge: 60 * 60 * 24 * 30, // 30 days,
        signed: true, // Cookie is signed
        httpOnly: true, // Cookie is only accessible via HTTP(S)/Backend
      });
    }

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          pollId_sessionId: {
            pollId,
            sessionId,
          },
        },
      });

      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.optionId === pollOptionId) {
        return reply.status(400).send({ message: "You have already voted on this poll option." });
      }

      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.optionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id,
          },
        });

        await redis.zincrby(`poll:${pollId}`, -1, userPreviousVoteOnPoll.optionId);
      }
    }
    
    await prisma.vote.create({
      data: {
        sessionId,
        pollId: pollId,
        optionId: pollOptionId,
      },
    });

    await redis.zincrby(`poll:${pollId}`, 1, pollOptionId);

    return reply.status(201).send();
  });
}