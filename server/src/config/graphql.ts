// server/src/config/graphql.ts

import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'graphql';
import { Application } from 'express';
import { logger } from '../utils/logger';

const typeDefs = `
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    avatar: String
    role: String!
    isEmailVerified: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    me: User
    users: [User!]!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
  }
`;

const resolvers = {
  Query: {
    me: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },
    users: async (parent: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Not authorized');
      }
      return prisma.user.findMany();
    }
  },
  Mutation: {
    updateProfile: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      return prisma.user.update({
        where: { id: context.user.id },
        data: args.input
      });
    }
  }
};

export const setupGraphQL = async (app: Application): Promise<void> => {
  try {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        return {
          user: req.user // Assumes JWT middleware has run
        };
      },
      introspection: process.env.NODE_ENV === 'development',
      playground: process.env.NODE_ENV === 'development'
    });

    await server.start();
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // Use app-level CORS
    });

    logger.info('GraphQL server initialized at /graphql');
  } catch (error) {
    logger.error('GraphQL setup failed:', error);
  }
};