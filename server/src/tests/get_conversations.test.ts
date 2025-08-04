
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { getConversations } from '../handlers/get_conversations';

describe('getConversations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no conversations', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    const result = await getConversations('user-1');

    expect(result).toHaveLength(0);
  });

  it('should return conversations for a user', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    // Create conversations with different timestamps to ensure predictable ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    await db.insert(conversationsTable).values([
      {
        id: 'conv-1',
        user_id: 'user-1',
        title: 'First Conversation',
        model_name: 'gpt-4',
        created_at: earlier,
        updated_at: earlier
      },
      {
        id: 'conv-2',
        user_id: 'user-1',
        title: 'Second Conversation',
        model_name: 'claude-3',
        created_at: now,
        updated_at: now
      }
    ]).execute();

    const result = await getConversations('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Conversation');
    expect(result[1].title).toEqual('First Conversation');
    expect(result[0].user_id).toEqual('user-1');
    expect(result[1].user_id).toEqual('user-1');
  });

  it('should return conversations ordered by most recent first', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    // Create conversations with specific timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    await db.insert(conversationsTable).values([
      {
        id: 'conv-old',
        user_id: 'user-1',
        title: 'Older Conversation',
        model_name: 'gpt-4',
        created_at: earlier,
        updated_at: earlier
      },
      {
        id: 'conv-new',
        user_id: 'user-1',
        title: 'Newer Conversation',
        model_name: 'claude-3',
        created_at: now,
        updated_at: now
      }
    ]).execute();

    const result = await getConversations('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Conversation');
    expect(result[1].title).toEqual('Older Conversation');
    expect(result[0].updated_at >= result[1].updated_at).toBe(true);
  });

  it('should only return conversations for the specified user', async () => {
    // Create two users
    await db.insert(usersTable).values([
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }
    ]).execute();

    // Create conversations for both users
    await db.insert(conversationsTable).values([
      {
        id: 'conv-1',
        user_id: 'user-1',
        title: 'User 1 Conversation',
        model_name: 'gpt-4'
      },
      {
        id: 'conv-2',
        user_id: 'user-2',
        title: 'User 2 Conversation',
        model_name: 'claude-3'
      }
    ]).execute();

    const result = await getConversations('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Conversation');
    expect(result[0].user_id).toEqual('user-1');
  });

  it('should return all conversation fields correctly', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    // Create a conversation
    await db.insert(conversationsTable).values({
      id: 'conv-1',
      user_id: 'user-1',
      title: 'Test Conversation',
      model_name: 'gpt-4'
    }).execute();

    const result = await getConversations('user-1');

    expect(result).toHaveLength(1);
    const conversation = result[0];
    expect(conversation.id).toEqual('conv-1');
    expect(conversation.user_id).toEqual('user-1');
    expect(conversation.title).toEqual('Test Conversation');
    expect(conversation.model_name).toEqual('gpt-4');
    expect(conversation.created_at).toBeInstanceOf(Date);
    expect(conversation.updated_at).toBeInstanceOf(Date);
  });
});
