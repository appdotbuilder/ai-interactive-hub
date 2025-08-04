
import { db } from '../db';
import { searchQueriesTable } from '../db/schema';
import { type SearchInput, type SearchQuery } from '../schema';
import { randomUUID } from 'crypto';

export async function searchInternet(input: SearchInput): Promise<SearchQuery> {
  try {
    // Create search query record in database
    const result = await db.insert(searchQueriesTable)
      .values({
        id: randomUUID(),
        user_id: input.user_id,
        query: input.query,
        search_type: input.search_type,
        results: null, // Initially null, would be populated by actual search implementation
        status: 'pending' // Default status as defined in schema
      })
      .returning()
      .execute();

    const searchQuery = result[0];
    return {
      ...searchQuery,
      results: searchQuery.results as Record<string, any> | null,
      created_at: searchQuery.created_at,
      updated_at: searchQuery.updated_at
    };
  } catch (error) {
    console.error('Search query creation failed:', error);
    throw error;
  }
}
