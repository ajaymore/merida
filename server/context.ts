import { PubSub } from 'apollo-server-express';
import { Request as ExpressRequest } from 'express';
import { Prisma } from './generated/prisma-client';

export interface Context {
  request: ExpressRequest;
  user: any;
  pubsub: PubSub;
  prisma: Prisma;
}

export interface Request extends ExpressRequest {
  user: any;
  pubsub: PubSub;
  puppeteer: any;
  prisma: Prisma;
}
