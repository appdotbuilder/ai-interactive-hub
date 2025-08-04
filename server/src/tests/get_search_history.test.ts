
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, searchQueriesTable } from '../db/schema';
import { getSearchHistory } from '../handlers/get_search_history';

describe('getSearchHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no search history', async () => {
    // Create a user but no search queries
    await db.insert(usersTable).values({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    const result = await getSearchHistory('user1');
    expect(result).toEqual([]);
  });

  it('should return search history for a specific user', async () => {
    // Create users
    await db.insert(usersTable).values([
      { id: 'user1', email: 'user1@example.com', name: 'User 1' },
      { id: 'user2', email: 'user2@example.com', name: 'User 2' }
    ]).execute();

    // Create search queries for both users
    await db.insert(searchQueriesTable).values([
      {
        id: 'query1',
        user_id: 'user1',
        query: 'First search',
        search_type: 'advanced',
        results: { count: 5 },
        status: 'completed'
      },
      {
        id: 'query2',
        user_id: 'user1',
        query: 'Second search',
        search_type: 'extended',
        results: null,
        status: 'failed'
      },
      {
        id: 'query3',
        user_id: 'user2',
        query: 'Other user search',
        search_type: 'advanced',
        results: null,
        status: 'pending'
      }
    ]).execute();

    const result = await getSearchHistory('user1');

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual('user1');
    expect(result[1].user_id).toEqual('user1');
    
    // Verify all expected fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].query).toBeDefined();
    expect(result[0].search_type).toBeDefined();
    expect(result[0].status).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return search history ordered by most recent first', async () => {
    // Create user
    await db.insert(usersTable).values({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    // Create search queries with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(searchQueriesTable).values([
      {
        id: 'oldest',
        user_id: 'user1',
        query: 'Oldest search',
        search_type: 'advanced',
        results: null,
        status: 'completed',
        created_at: twoHoursAgo,
        updated_at: twoHoursAgo
      },
      {
        id: 'newest',
        user_id: 'user1',
        query: 'Newest search',
        search_type: 'extended',
        results: { data: 'test' },
        status: 'completed',
        created_at: now,
        updated_at: now
      },
      {
        id: 'middle',
        user_id: 'user1',
        query: 'Middle search',
        search_type: 'advanced',
        results: null,
        status: 'processing',
        created_at: oneHourAgo,
        updated_at: oneHourAgo
      }
    ]).execute();

    const result = await getSearchHistory('user1');

    expect(result).toHaveLength(3);
    expect(result[0].id).toEqual('newest');
    expect(result[1].id).toEqual('middle');
    expect(result[2].id).toEqual('oldest');

    // Verify ordering by checking timestamps
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should handle different search types and statuses correctly', async () => {
    // Create user
    await db.insert(usersTable).values({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User'
    }).execute();

    // Create search queries with different types and statuses
    await db.insert(searchQueriesTable).values([
      {
        id: 'query1',
        user_id: 'user1',
        query: 'Advanced search',
        search_type: 'advanced',
        results: { total: 10, results: ['item1', 'item2'] },
        status: 'completed'
      },
      {
        id: 'query2',
        user_id: 'user1',
        query: 'Extended search',
        search_type: 'extended',
        results: null,
        status: 'pending'
      },
      {
        id: 'query3',
        user_id: 'user1',
        query: 'Failed search',
        search_type: 'advanced',
        results: null,
        status: 'failed'
      }
    ]).execute();

    const result = await getSearchHistory('user1');

    expect(result).toHaveLength(3);
    
    // Verify search types
    const searchTypes = result.map(q => q.search_type);
    expect(searchTypes).toContain('advanced');
    expect(searchTypes).toContain('extended');
    
    // Verify statuses
    const statuses = result.map(q => q.status);
    expect(statuses).toContain('completed');
    expect(statuses).toContain('pending');
    expect(statuses).toContain('failed');
    
    // Verify results field handling
    const completedQuery = result.find(q => q.status === 'completed');
    expect(completedQuery?.results).toEqual({ total: 10, results: ['item1', 'item2'] });
    
    const pendingQuery = result.find(q => q.status === 'pending');
    expect(pendingQuery?.results).toBeNull();
  });
});
