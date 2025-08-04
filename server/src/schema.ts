
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Chat conversation schema
export const conversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  model_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Conversation = z.infer<typeof conversationSchema>;

// Chat message schema
export const messageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// Media file schema
export const mediaFileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  filename: z.string(),
  original_filename: z.string(),
  file_type: z.enum(['image', 'video']),
  file_size: z.number().int(),
  file_path: z.string(),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']),
  processing_result: z.record(z.any()).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MediaFile = z.infer<typeof mediaFileSchema>;

// Search query schema
export const searchQuerySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  query: z.string(),
  search_type: z.enum(['advanced', 'extended']),
  results: z.record(z.any()).nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// AI model schema
export const aiModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  description: z.string().nullable(),
  context_length: z.number().int(),
  pricing_input: z.number(),
  pricing_output: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AIModel = z.infer<typeof aiModelSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createConversationInputSchema = z.object({
  user_id: z.string(),
  title: z.string(),
  model_name: z.string()
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

export const sendMessageInputSchema = z.object({
  conversation_id: z.string(),
  content: z.string(),
  model_name: z.string()
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const uploadMediaInputSchema = z.object({
  user_id: z.string(),
  filename: z.string(),
  original_filename: z.string(),
  file_type: z.enum(['image', 'video']),
  file_size: z.number().int(),
  file_path: z.string()
});

export type UploadMediaInput = z.infer<typeof uploadMediaInputSchema>;

export const processMediaInputSchema = z.object({
  media_id: z.string(),
  processing_type: z.string(),
  model_name: z.string()
});

export type ProcessMediaInput = z.infer<typeof processMediaInputSchema>;

export const searchInputSchema = z.object({
  user_id: z.string(),
  query: z.string(),
  search_type: z.enum(['advanced', 'extended'])
});

export type SearchInput = z.infer<typeof searchInputSchema>;

export const thinkInputSchema = z.object({
  query: z.string(),
  model_name: z.string(),
  show_reasoning: z.boolean().optional()
});

export type ThinkInput = z.infer<typeof thinkInputSchema>;

export const updateConversationInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  model_name: z.string().optional()
});

export type UpdateConversationInput = z.infer<typeof updateConversationInputSchema>;
