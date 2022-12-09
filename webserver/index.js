const { ApolloServer } = require("@apollo/server");
const gql = require("graphql-tag");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { createServer } = require("http");
const express = require("express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PubSub } = require("graphql-subscriptions");
const { RedisPubSub } = require("graphql-redis-subscriptions");
const Redis = require("ioredis");

const typeDefs = gql`
  type Query {
    user: String!
  }

  type User {
    id: ID!
    name: String!
  }

  type Mutation {
    register(name: String!): User
  }

  type Subscription {
    userRegistered: User
  }
`;

const NEW_USER = "new_user";

const resolvers = {
  Subscription: {
    userRegistered: {
      subscribe: (parent, args, context, info) => {
        // console.log("subscription ", context);
        const pubsub = context.pubsub;
        return pubsub.asyncIterator([NEW_USER]);
      },
    },
  },
  Query: {
    user: () => "dilbert",
  },
  Mutation: {
    register: (parent, args, { pubsub }, info) => {
      //   console.log(pubsub);
      pubsub.publish(NEW_USER, {
        userRegistered: {
          id: 1,
          name: "wally",
        },
      });
      return {
        id: 1,
        name: "wally",
      };
    },
  },
};

const start = async () => {
  const options = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT ? process.env.REDIS_PORT : "6379",
    retryStrategy: (times) => {
      // reconnect after
      return Math.min(times * 50, 2000);
    },
  };

  const pubsub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options),
  });

  // const pubsub = new PubSub();
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  const app = express();
  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        // You can define your own function for setting a dynamic context
        // or provide a static value
        console.log("context in use server");
        return { pubsub };
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      onConnect: async (ctx) => {
        console.log("on connect");
      },
      context: async ({ req }) => ({ req, pubsub }),
    })
  );

  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
};

start();
