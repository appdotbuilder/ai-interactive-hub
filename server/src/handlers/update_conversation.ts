
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type UpdateConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConversation = async (input: UpdateConversationInput): Promise<Conversation> => {
  try {
    // Check if conversation exists
    const existingConversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, input.id))
      .execute();

    if (existingConversation.length === 0) {
      throw new Error(`Conversation with id ${input.id} not found`);
    }

    // Build update data only with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.model_name !== undefined) {
      updateData.model_name = input.model_name;
    }

    // Update conversation
    const result = await db.update(conversationsTable)
      .set(updateData)
      .where(eq(conversationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Conversation update failed:', error);
    throw error;
  }
};
