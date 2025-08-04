
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type Message } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const results = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, conversationId))
      .orderBy(asc(messagesTable.created_at))
      .execute();

    return results.map(result => ({
      ...result,
      metadata: result.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Get messages failed:', error);
    throw error;
  }
}
