import {
  makeSchema,
  asNexusMethod,
  queryType,
  mutationType,
  stringArg,
  subscriptionField
} from 'nexus';
import path from 'path';
import { GraphQLJSON } from 'graphql-type-json';
import { GraphQLDateTime } from 'graphql-iso-date';
import { withFilter } from 'apollo-server-express';
import { Context } from '../context';

asNexusMethod(GraphQLJSON, 'json');
asNexusMethod(GraphQLDateTime, 'date');

const Query = queryType({
  definition(t) {
    t.field('me', {
      type: 'String',
      resolve(_, _args, _ctx) {
        return 'ctx.user';
      }
    });
  }
});
const Mutation = mutationType({
  definition(t) {
    t.string('announce', {
      args: { announcement: stringArg({ required: true }) },
      resolve(_, args, ctx) {
        ctx.pubsub.publish(ANNOUNCEMENT_SENT, args.announcement);
        return 'Sent!';
      }
    });
  }
});

export const ANNOUNCEMENT_SENT = 'announcementSent';

const announcementSent = subscriptionField('announcementSent', {
  type: 'String',
  // args: {
  //   id: idArg()
  // },
  subscribe: withFilter(
    (_, _args, { pubsub }: Context) => {
      return pubsub.asyncIterator([ANNOUNCEMENT_SENT]);
    },
    (_payload, _args, _ctx) => {
      // return args.id === ctx.user._id.toString();
      return true;
    }
  ),
  resolve(payload) {
    return payload;
  }
});

const Subscription = {
  announcementSent
};

export const schema = makeSchema({
  types: [GraphQLJSON, GraphQLDateTime, Query, Mutation, Subscription],
  outputs: {
    schema: path.join(__dirname, '../generated/schema.graphql'),
    typegen: path.join(__dirname, '../generated/schema.typegen.ts')
  },
  typegenAutoConfig: {
    sources: [
      {
        source: path.join(__dirname, '../context.ts'),
        alias: 'ctx'
      }
    ],
    contextType: 'ctx.Context'
  },
  nonNullDefaults: {
    input: false,
    output: false
  }
});
