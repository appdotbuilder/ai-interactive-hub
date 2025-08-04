
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type Conversation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const results = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.user_id, userId))
      .orderBy(desc(conversationsTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get conversations:', error);
    throw error;
  }
}
