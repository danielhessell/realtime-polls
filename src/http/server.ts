import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import fastifyWebsocket from "@fastify/websocket";
import { pollResult } from "./ws/poll-results";

const server = fastify();

server.register(fastifyCookie, {
  secret: "my-realtime-polls-secret-key",
  hook: 'onRequest',
});

server.register(fastifyWebsocket);

server.register(createPoll);
server.register(getPoll);
server.register(voteOnPoll);
server.register(pollResult);

server.listen({ port: 8080 }).then(() => {
  console.log("HTTP server is running on port 8080!");
});