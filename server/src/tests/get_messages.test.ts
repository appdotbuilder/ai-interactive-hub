
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { getMessages } from '../handlers/get_messages';

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return messages for a conversation ordered chronologically', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create test conversation
    await db.insert(conversationsTable).values({
      id: 'conv-1',
      user_id: 'user-1',
      title: 'Test Conversation',
      model_name: 'gpt-4'
    });

    // Create test messages with different timestamps
    const baseTime = new Date('2024-01-01T10:00:00Z');
    const message1Time = new Date(baseTime.getTime());
    const message2Time = new Date(baseTime.getTime() + 1000); // 1 second later
    const message3Time = new Date(baseTime.getTime() + 2000); // 2 seconds later

    await db.insert(messagesTable).values([
      {
        id: 'msg-3',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Third message',
        created_at: message3Time
      },
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'First message',
        created_at: message1Time
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Second message',
        created_at: message2Time
      }
    ]);

    const result = await getMessages('conv-1');

    expect(result).toHaveLength(3);
    
    // Verify chronological order
    expect(result[0].content).toEqual('First message');
    expect(result[1].content).toEqual('Second message');
    expect(result[2].content).toEqual('Third message');

    // Verify all message properties
    expect(result[0].id).toEqual('msg-1');
    expect(result[0].role).toEqual('user');
    expect(result[0].conversation_id).toEqual('conv-1');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].metadata).toBeNull();

    expect(result[1].id).toEqual('msg-2');
    expect(result[1].role).toEqual('assistant');
    expect(result[1].conversation_id).toEqual('conv-1');
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].metadata).toBeNull();
  });

  it('should return empty array for conversation with no messages', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create test conversation without messages
    await db.insert(conversationsTable).values({
      id: 'conv-empty',
      user_id: 'user-1',
      title: 'Empty Conversation',
      model_name: 'gpt-4'
    });

    const result = await getMessages('conv-empty');

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent conversation', async () => {
    const result = await getMessages('non-existent-conv');

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should filter messages by conversation ID correctly', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create two test conversations
    await db.insert(conversationsTable).values([
      {
        id: 'conv-1',
        user_id: 'user-1',
        title: 'Conversation 1',
        model_name: 'gpt-4'
      },
      {
        id: 'conv-2',
        user_id: 'user-1',
        title: 'Conversation 2',
        model_name: 'gpt-4'
      }
    ]);

    // Create messages for both conversations
    await db.insert(messagesTable).values([
      {
        id: 'msg-conv1-1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Message for conv 1'
      },
      {
        id: 'msg-conv1-2',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Response for conv 1'
      },
      {
        id: 'msg-conv2-1',
        conversation_id: 'conv-2',
        role: 'user',
        content: 'Message for conv 2'
      }
    ]);

    const conv1Messages = await getMessages('conv-1');
    const conv2Messages = await getMessages('conv-2');

    // Verify conversation 1 messages
    expect(conv1Messages).toHaveLength(2);
    expect(conv1Messages[0].content).toEqual('Message for conv 1');
    expect(conv1Messages[1].content).toEqual('Response for conv 1');
    conv1Messages.forEach(msg => {
      expect(msg.conversation_id).toEqual('conv-1');
    });

    // Verify conversation 2 messages
    expect(conv2Messages).toHaveLength(1);
    expect(conv2Messages[0].content).toEqual('Message for conv 2');
    expect(conv2Messages[0].conversation_id).toEqual('conv-2');
  });

  it('should handle messages with metadata correctly', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create test conversation
    await db.insert(conversationsTable).values({
      id: 'conv-1',
      user_id: 'user-1',
      title: 'Test Conversation',
      model_name: 'gpt-4'
    });

    // Create message with metadata
    await db.insert(messagesTable).values({
      id: 'msg-with-metadata',
      conversation_id: 'conv-1',
      role: 'assistant',
      content: 'Message with metadata',
      metadata: { tokens: 150, model: 'gpt-4' }
    });

    const result = await getMessages('conv-1');

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({ tokens: 150, model: 'gpt-4' });
    expect(typeof result[0].metadata).toBe('object');
  });
});
