
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { createConversation } from '../handlers/create_conversation';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test user data
const testUserId = randomUUID();
const testUser = {
  id: testUserId,
  email: 'test@example.com',
  name: 'Test User'
};

// Test conversation input
const testInput: CreateConversationInput = {
  user_id: testUserId,
  title: 'Test Conversation',
  model_name: 'gpt-4'
};

describe('createConversation', () => {
  beforeEach(async () => {
    await createDB();
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
  });
  
  afterEach(resetDB);

  it('should create a conversation', async () => {
    const result = await createConversation(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Test Conversation');
    expect(result.model_name).toEqual('gpt-4');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save conversation to database', async () => {
    const result = await createConversation(testInput);

    // Query the database to verify the conversation was saved
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].user_id).toEqual(testUserId);
    expect(conversations[0].title).toEqual('Test Conversation');
    expect(conversations[0].model_name).toEqual('gpt-4');
    expect(conversations[0].created_at).toBeInstanceOf(Date);
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: CreateConversationInput = {
      user_id: 'non-existent-user-id',
      title: 'Test Conversation',
      model_name: 'gpt-4'
    };

    await expect(createConversation(invalidInput))
      .rejects.toThrow(/User with id non-existent-user-id does not exist/i);
  });

  it('should generate unique conversation IDs', async () => {
    const conversation1 = await createConversation(testInput);
    const conversation2 = await createConversation({
      ...testInput,
      title: 'Another Conversation'
    });

    expect(conversation1.id).not.toEqual(conversation2.id);
    expect(typeof conversation1.id).toBe('string');
    expect(typeof conversation2.id).toBe('string');
  });

  it('should handle different model names', async () => {
    const inputWithDifferentModel: CreateConversationInput = {
      user_id: testUserId,
      title: 'Claude Conversation',
      model_name: 'claude-3-opus'
    };

    const result = await createConversation(inputWithDifferentModel);

    expect(result.model_name).toEqual('claude-3-opus');
    expect(result.title).toEqual('Claude Conversation');
  });
});
