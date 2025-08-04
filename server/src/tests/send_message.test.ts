
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User'
};

const testConversation = {
  id: 'test-conversation-1',
  user_id: 'test-user-1',
  title: 'Test Conversation',
  model_name: 'gpt-3.5-turbo'
};

const testInput: SendMessageInput = {
  conversation_id: 'test-conversation-1',
  content: 'Hello, how are you?',
  model_name: 'gpt-3.5-turbo'
};

describe('sendMessage', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user and conversation
    await db.insert(usersTable)
      .values(testUser)
      .execute();
      
    await db.insert(conversationsTable)
      .values(testConversation)
      .execute();
  });
  
  afterEach(resetDB);

  it('should send a message and return assistant response', async () => {
    const result = await sendMessage(testInput);

    // Verify the response structure
    expect(result.id).toBeDefined();
    expect(result.conversation_id).toEqual('test-conversation-1');
    expect(result.role).toEqual('assistant');
    expect(result.content).toContain('AI response to');
    expect(result.content).toContain('Hello, how are you?');
    expect(result.content).toContain('gpt-3.5-turbo');
    expect(result.metadata).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should store both user and assistant messages in database', async () => {
    await sendMessage(testInput);

    // Check that both messages were stored
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, 'test-conversation-1'))
      .orderBy(messagesTable.created_at)
      .execute();

    expect(messages).toHaveLength(2);

    // Verify user message
    const userMessage = messages[0];
    expect(userMessage.role).toEqual('user');
    expect(userMessage.content).toEqual('Hello, how are you?');
    expect(userMessage.conversation_id).toEqual('test-conversation-1');
    expect(userMessage.metadata).toBeNull();

    // Verify assistant message
    const assistantMessage = messages[1];
    expect(assistantMessage.role).toEqual('assistant');
    expect(assistantMessage.content).toContain('AI response to');
    expect(assistantMessage.conversation_id).toEqual('test-conversation-1');
    expect(assistantMessage.metadata).toBeDefined();
    
    // Type assertion for metadata access
    const metadata = assistantMessage.metadata as Record<string, any>;
    expect(metadata['model']).toEqual('gpt-3.5-turbo');
  });

  it('should include conversation history in AI context', async () => {
    // Add some existing messages to the conversation
    await db.insert(messagesTable)
      .values([
        {
          id: 'existing-msg-1',
          conversation_id: 'test-conversation-1',
          role: 'user',
          content: 'Previous user message',
          metadata: null
        },
        {
          id: 'existing-msg-2',
          conversation_id: 'test-conversation-1',
          role: 'assistant',
          content: 'Previous assistant response',
          metadata: { model: 'gpt-3.5-turbo' }
        }
      ])
      .execute();

    const result = await sendMessage(testInput);

    // Verify the new assistant message was created
    expect(result.role).toEqual('assistant');
    expect(result.content).toContain('AI response to');

    // Verify total message count (2 existing + 2 new = 4)
    const allMessages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, 'test-conversation-1'))
      .execute();

    expect(allMessages).toHaveLength(4);
  });

  it('should handle metadata correctly', async () => {
    const result = await sendMessage(testInput);

    expect(result.metadata).toBeDefined();
    expect(result.metadata).not.toBeNull();
    
    // Type assertion for safe property access
    const metadata = result.metadata as Record<string, any>;
    expect(metadata['model']).toEqual('gpt-3.5-turbo');
    expect(metadata['timestamp']).toBeDefined();
    expect(metadata['tokens_used']).toBeTypeOf('number');
    expect(metadata['tokens_used']).toBeGreaterThan(0);
  });

  it('should throw error for non-existent conversation', async () => {
    const invalidInput: SendMessageInput = {
      conversation_id: 'non-existent-conversation',
      content: 'Hello',
      model_name: 'gpt-3.5-turbo'
    };

    await expect(sendMessage(invalidInput)).rejects.toThrow(/conversation not found/i);
  });

  it('should handle different model names', async () => {
    const input: SendMessageInput = {
      conversation_id: 'test-conversation-1',
      content: 'Test message',
      model_name: 'gpt-4'
    };

    const result = await sendMessage(input);

    expect(result.content).toContain('gpt-4');
    
    // Type assertion for metadata access
    const metadata = result.metadata as Record<string, any>;
    expect(metadata['model']).toEqual('gpt-4');
  });
});
