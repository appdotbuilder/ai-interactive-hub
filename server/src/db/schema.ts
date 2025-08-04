
import { text, pgTable, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'video']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed']);
export const searchTypeEnum = pgEnum('search_type', ['advanced', 'extended']);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Conversations table
export const conversationsTable = pgTable('conversations', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  model_name: text('model_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: text('id').primaryKey(),
  conversation_id: text('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Media files table
export const mediaFilesTable = pgTable('media_files', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  original_filename: text('original_filename').notNull(),
  file_type: fileTypeEnum('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  file_path: text('file_path').notNull(),
  processing_status: processingStatusEnum('processing_status').notNull().default('pending'),
  processing_result: jsonb('processing_result'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Search queries table
export const searchQueriesTable = pgTable('search_queries', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  search_type: searchTypeEnum('search_type').notNull(),
  results: jsonb('results'),
  status: processingStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// AI models table
export const aiModelsTable = pgTable('ai_models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  description: text('description'),
  context_length: integer('context_length').notNull(),
  pricing_input: integer('pricing_input').notNull(), // Store as cents to avoid decimal precision issues
  pricing_output: integer('pricing_output').notNull(), // Store as cents to avoid decimal precision issues
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  conversations: many(conversationsTable),
  mediaFiles: many(mediaFilesTable),
  searchQueries: many(searchQueriesTable)
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [conversationsTable.user_id],
    references: [usersTable.id]
  }),
  messages: many(messagesTable)
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversation_id],
    references: [conversationsTable.id]
  })
}));

export const mediaFilesRelations = relations(mediaFilesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [mediaFilesTable.user_id],
    references: [usersTable.id]
  })
}));

export const searchQueriesRelations = relations(searchQueriesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [searchQueriesTable.user_id],
    references: [usersTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  conversations: conversationsTable,
  messages: messagesTable,
  mediaFiles: mediaFilesTable,
  searchQueries: searchQueriesTable,
  aiModels: aiModelsTable
};

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
export type MediaFile = typeof mediaFilesTable.$inferSelect;
export type NewMediaFile = typeof mediaFilesTable.$inferInsert;
export type SearchQuery = typeof searchQueriesTable.$inferSelect;
export type NewSearchQuery = typeof searchQueriesTable.$inferInsert;
export type AIModel = typeof aiModelsTable.$inferSelect;
export type NewAIModel = typeof aiModelsTable.$inferInsert;
