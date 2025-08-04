
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type UpdateConversationInput } from '../schema';
import { updateConversation } from '../handlers/update_conversation';
import { eq } from 'drizzle-orm';

describe('updateConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testConversationId: string;

  beforeEach(async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        id: 'test-conversation-id',
        user_id: testUserId,
        title: 'Original Title',
        model_name: 'gpt-3.5-turbo'
      })
      .returning()
      .execute();

    testConversationId = conversationResult[0].id;
  });

  it('should update conversation title', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      title: 'Updated Title'
    };

    const result = await updateConversation(input);

    expect(result.id).toEqual(testConversationId);
    expect(result.title).toEqual('Updated Title');
    expect(result.model_name).toEqual('gpt-3.5-turbo'); // Should remain unchanged
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update conversation model name', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      model_name: 'gpt-4'
    };

    const result = await updateConversation(input);

    expect(result.id).toEqual(testConversationId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.model_name).toEqual('gpt-4');
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and model name', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      title: 'New Title',
      model_name: 'claude-3'
    };

    const result = await updateConversation(input);

    expect(result.id).toEqual(testConversationId);
    expect(result.title).toEqual('New Title');
    expect(result.model_name).toEqual('claude-3');
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      title: 'Database Update Test'
    };

    await updateConversation(input);

    // Verify changes were persisted
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, testConversationId))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toEqual('Database Update Test');
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalConversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, testConversationId))
      .execute();

    const originalUpdatedAt = originalConversation[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateConversationInput = {
      id: testConversationId,
      title: 'Timestamp Test'
    };

    const result = await updateConversation(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent conversation', async () => {
    const input: UpdateConversationInput = {
      id: 'non-existent-id',
      title: 'This should fail'
    };

    expect(updateConversation(input)).rejects.toThrow(/not found/i);
  });

  it('should handle update with no optional fields provided', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId
    };

    const result = await updateConversation(input);

    // Should still update the updated_at timestamp
    expect(result.id).toEqual(testConversationId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.model_name).toEqual('gpt-3.5-turbo'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
