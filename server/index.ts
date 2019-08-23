import express from 'express';
import next from 'next';
import morgan from 'morgan';
import path from 'path';
import passport from 'passport';
import { Strategy } from 'passport-local';
import flash from 'connect-flash';
import { ensureLoggedIn } from 'connect-ensure-login';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import puppeteer from 'puppeteer';
import { applyMiddleware } from 'graphql-middleware';
import { ApolloServer, PubSub } from 'apollo-server-express';
import { compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { Request } from './context';
import { schema } from './schema';
import { prisma } from './generated/prisma-client';

const port = parseInt(process.env.PORT as any, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextJSApp = next({ dev, dir: dev ? './' : './dist' });
// const nextJSApp = next({ dev });
const handle = nextJSApp.getRequestHandler();
const debug = require('debug')('merida:main');
const schemaWithMiddleware = applyMiddleware(schema);
const pubsub = new PubSub();
const FileStore = require('session-file-store')(session);
const sessionParser = session({
  secret: process.env.SESSION_SECRET as string,
  store: new FileStore({
    path: path.join(__dirname, '..', 'sessions'),
    secret: process.env.SESSION_SECRET as string
  }),
  proxy: true,
  resave: true,
  saveUninitialized: true
});

// passport setup
passport.use(
  new Strategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, cb) => {
      try {
        const user = await prisma.user({ email });
        if (!user) {
          return cb(null, false, { message: 'User not found!' });
        }
        const passwordValid = await compare(password, user.password);
        if (!passwordValid) {
          return cb(null, false, { message: 'Incorrect password!' });
        }
        return cb(null, user);
      } catch (err) {
        return cb(null, false, err);
      }
    }
  )
);

passport.serializeUser((user: any, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id: any, cb) => {
  const user = await prisma.user({ id });
  cb(null, user);
});

const checkToken = (req: Request) => {
  if (req.headers && (req.headers.authorization || req.headers.Authorization)) {
    try {
      const parts = req.headers.authorization
        ? req.headers.authorization.split(' ')
        : [];
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
      return false;
    } catch (err) {
      return false;
    }
  }
  return false;
};

const getUser = (id: string): Promise<any> => {
  return prisma.user({ id });
};

nextJSApp.prepare().then(() => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/static', express.static(path.join(__dirname, '..', 'static')));
  app.use(flash());
  app.use(
    process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev')
  );
  app.use(cookieParser());
  app.use(sessionParser);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(async (req: Request, _: any, nextMiddleware: any) => {
    // req.storage = storage;
    req.puppeteer = puppeteer;
    req.prisma = prisma;
    req.pubsub = pubsub;
    nextMiddleware();
  });

  app.use(async (req: Request, _res: any, nextMiddleware: any) => {
    try {
      req.user = null;
      const token = checkToken(req);
      if (!token) {
        return nextMiddleware();
      }
      const verifiedToken = verify(token, process.env
        .JWT_AUTH_SECRET as string) as {
        id: string;
      };
      if (verifiedToken && verifiedToken.id) {
        req.user = await getUser(verifiedToken.id);
      }
      return nextMiddleware();
    } catch (err) {
      return nextMiddleware();
    }
  });

  app.post(
    '/login',
    passport.authenticate('local', {
      successReturnToOrRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })
  );

  app.post('/device-login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Inavlid Request' });
    }

    const user = await prisma.user({ email });

    if (!user) {
      return res.status(400).json({ message: 'Incorrect email.' });
    }

    const passwordValid = await compare(password, user.password);

    if (!passwordValid) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }
    const token = sign({ id: user.id }, process.env.JWT_AUTH_SECRET);
    res.status(200).json({
      token
    });
  });

  app.get(['/logout'], (req: any, res) => {
    req.logout();
    res.redirect(`/login`);
  });

  app.get(['/admin**'], ensureLoggedIn(), (req: any, res) => {
    nextJSApp.render(req, res, req.path, {
      ...req.query,
      user: req.user ? JSON.stringify(req.user) : null
    });
  });

  app.get('/protected', (req: Request, res: any) => {
    if (req.user) {
      return res.json('Authenticated User');
    }
    res.status(400).json('You are not authenticated');
  });

  const apollo = new ApolloServer({
    schema: schemaWithMiddleware,
    introspection: true,
    formatError: error => {
      // logger.error(error);
      debug(error);
      return error;
    },
    context: async ({ req, connection }: any) => {
      if (connection) {
        return connection.context;
      }
      return {
        user: req.user,
        request: req,
        pubsub,
        prisma
      };
    },
    subscriptions: {
      onConnect: async (_connectionParams: any, ws: any) => {
        return new Promise((resolve, _reject) => {
          sessionParser(ws.upgradeReq, {} as any, async () => {
            if (
              ws.upgradeReq.session.passport &&
              ws.upgradeReq.session.passport.user
            ) {
              //   const user = await db.collection('users').findOne({
              //     _id: new ObjectID(ws.upgradeReq.session.passport.user)
              //   });
              const user = {};
              resolve({
                pubsub,
                user,
                prisma
              });
            } else {
              resolve({
                pubsub,
                user: null
              });
            }
          });
        });
      }
    },
    playground: dev
      ? {
          settings: {
            'request.credentials': 'same-origin'
          } as any
        }
      : false
  });
  apollo.applyMiddleware({ app, path: '/api/graphql' });

  // handle with nextjs
  app.get('*', (req, res) => {
    return handle(req, res);
  });

  // catch 404 and forward to error handler
  app.use((_req, _res, nextMiddleware) => {
    const err: any = new Error('Not Found');

    err.status = 404;
    nextMiddleware(err);
  });

  // error handler
  app.use((err: any, req: any, res: any, _nextMiddleware: any) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json({
      status: err.status,
      message: err.message
    });
  });

  const server = require('http').Server(app);
  apollo.installSubscriptionHandlers(server);

  server.listen(port, (err: any) => {
    if (err) {
      throw err;
    }
    debug(`🚂 Express Ready on http://localhost:${port}`);
    debug(
      `🚀 Apollo Server Ready on http://localhost:${port}${apollo.graphqlPath}`
    );
    debug(
      `🚀 Subscription Server Ready on ws://localhost:${port}${
        apollo.subscriptionsPath
      }`
    );
  });
});
