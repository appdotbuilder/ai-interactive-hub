
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import {
  createUserInputSchema,
  createConversationInputSchema,
  sendMessageInputSchema,
  uploadMediaInputSchema,
  processMediaInputSchema,
  searchInputSchema,
  thinkInputSchema,
  updateConversationInputSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { createConversation } from './handlers/create_conversation';
import { sendMessage } from './handlers/send_message';
import { getConversations } from './handlers/get_conversations';
import { getMessages } from './handlers/get_messages';
import { uploadMedia } from './handlers/upload_media';
import { processMedia } from './handlers/process_media';
import { searchInternet } from './handlers/search_internet';
import { aiThink } from './handlers/ai_think';
import { getAIModels } from './handlers/get_ai_models';
import { getMediaFiles } from './handlers/get_media_files';
import { getSearchHistory } from './handlers/get_search_history';
import { updateConversation } from './handlers/update_conversation';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Conversation management
  createConversation: publicProcedure
    .input(createConversationInputSchema)
    .mutation(({ input }) => createConversation(input)),

  getConversations: publicProcedure
    .input(z.string())
    .query(({ input }) => getConversations(input)),

  updateConversation: publicProcedure
    .input(updateConversationInputSchema)
    .mutation(({ input }) => updateConversation(input)),

  // Chat functionality
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),

  getMessages: publicProcedure
    .input(z.string())
    .query(({ input }) => getMessages(input)),

  // Media handling
  uploadMedia: publicProcedure
    .input(uploadMediaInputSchema)
    .mutation(({ input }) => uploadMedia(input)),

  processMedia: publicProcedure
    .input(processMediaInputSchema)
    .mutation(({ input }) => processMedia(input)),

  getMediaFiles: publicProcedure
    .input(z.string())
    .query(({ input }) => getMediaFiles(input)),

  // Search functionality
  searchInternet: publicProcedure
    .input(searchInputSchema)
    .mutation(({ input }) => searchInternet(input)),

  getSearchHistory: publicProcedure
    .input(z.string())
    .query(({ input }) => getSearchHistory(input)),

  // AI thinking
  aiThink: publicProcedure
    .input(thinkInputSchema)
    .mutation(({ input }) => aiThink(input)),

  // AI models
  getAIModels: publicProcedure
    .query(() => getAIModels()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
