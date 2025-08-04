
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { type CreateConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  try {
    // Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Generate unique ID for the conversation
    const conversationId = randomUUID();

    // Insert conversation record
    const result = await db.insert(conversationsTable)
      .values({
        id: conversationId,
        user_id: input.user_id,
        title: input.title,
        model_name: input.model_name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Conversation creation failed:', error);
    throw error;
  }
}
