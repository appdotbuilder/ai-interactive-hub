
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, searchQueriesTable } from '../db/schema';
import { type SearchInput } from '../schema';
import { searchInternet } from '../handlers/search_internet';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('searchInternet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const userId = randomUUID();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      })
      .execute();
    return userId;
  };

  it('should create a search query with advanced search type', async () => {
    const userId = await createTestUser();
    
    const testInput: SearchInput = {
      user_id: userId,
      query: 'latest AI developments',
      search_type: 'advanced'
    };

    const result = await searchInternet(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.query).toEqual('latest AI developments');
    expect(result.search_type).toEqual('advanced');
    expect(result.status).toEqual('pending');
    expect(result.results).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a search query with extended search type', async () => {
    const userId = await createTestUser();
    
    const testInput: SearchInput = {
      user_id: userId,
      query: 'climate change research 2024',
      search_type: 'extended'
    };

    const result = await searchInternet(testInput);

    expect(result.user_id).toEqual(userId);
    expect(result.query).toEqual('climate change research 2024');
    expect(result.search_type).toEqual('extended');
    expect(result.status).toEqual('pending');
    expect(result.results).toBeNull();
  });

  it('should save search query to database', async () => {
    const userId = await createTestUser();
    
    const testInput: SearchInput = {
      user_id: userId,
      query: 'machine learning tutorials',
      search_type: 'advanced'
    };

    const result = await searchInternet(testInput);

    // Query database to verify record was saved
    const searchQueries = await db.select()
      .from(searchQueriesTable)
      .where(eq(searchQueriesTable.id, result.id))
      .execute();

    expect(searchQueries).toHaveLength(1);
    expect(searchQueries[0].user_id).toEqual(userId);
    expect(searchQueries[0].query).toEqual('machine learning tutorials');
    expect(searchQueries[0].search_type).toEqual('advanced');
    expect(searchQueries[0].status).toEqual('pending');
    expect(searchQueries[0].results).toBeNull();
    expect(searchQueries[0].created_at).toBeInstanceOf(Date);
    expect(searchQueries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple search queries for same user', async () => {
    const userId = await createTestUser();
    
    const firstInput: SearchInput = {
      user_id: userId,
      query: 'first search query',
      search_type: 'advanced'
    };

    const secondInput: SearchInput = {
      user_id: userId,
      query: 'second search query',
      search_type: 'extended'
    };

    const firstResult = await searchInternet(firstInput);
    const secondResult = await searchInternet(secondInput);

    // Verify both queries were created with different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.query).toEqual('first search query');
    expect(secondResult.query).toEqual('second search query');
    expect(firstResult.search_type).toEqual('advanced');
    expect(secondResult.search_type).toEqual('extended');

    // Verify both are in database
    const allQueries = await db.select()
      .from(searchQueriesTable)
      .where(eq(searchQueriesTable.user_id, userId))
      .execute();

    expect(allQueries).toHaveLength(2);
  });
});
