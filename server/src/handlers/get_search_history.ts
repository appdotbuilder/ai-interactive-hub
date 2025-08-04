
import { db } from '../db';
import { searchQueriesTable } from '../db/schema';
import { type SearchQuery } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getSearchHistory(userId: string): Promise<SearchQuery[]> {
  try {
    const results = await db.select()
      .from(searchQueriesTable)
      .where(eq(searchQueriesTable.user_id, userId))
      .orderBy(desc(searchQueriesTable.created_at))
      .execute();

    // Convert the results to match the expected SearchQuery type
    return results.map(query => ({
      ...query,
      results: query.results as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch search history:', error);
    throw error;
  }
}
