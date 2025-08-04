
import { db } from '../db';
import { messagesTable, conversationsTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  try {
    // First verify the conversation exists
    const conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, input.conversation_id))
      .execute();

    if (conversation.length === 0) {
      throw new Error('Conversation not found');
    }

    // Store the user message first
    const userMessageId = randomUUID();
    const userMessageResult = await db.insert(messagesTable)
      .values({
        id: userMessageId,
        conversation_id: input.conversation_id,
        role: 'user',
        content: input.content,
        metadata: null
      })
      .returning()
      .execute();

    const userMessage = userMessageResult[0];

    // Get conversation history for context
    const conversationHistory = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, input.conversation_id))
      .orderBy(messagesTable.created_at)
      .execute();

    // Prepare messages for AI API (OpenRouter format)
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Call OpenRouter API (placeholder implementation)
    const aiResponse = await callOpenRouterAPI(messages, input.model_name);

    // Store the AI response
    const assistantMessageId = randomUUID();
    const assistantMessageResult = await db.insert(messagesTable)
      .values({
        id: assistantMessageId,
        conversation_id: input.conversation_id,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata
      })
      .returning()
      .execute();

    // Convert the database result to the expected Message type
    const dbMessage = assistantMessageResult[0];
    return {
      id: dbMessage.id,
      conversation_id: dbMessage.conversation_id,
      role: dbMessage.role,
      content: dbMessage.content,
      metadata: dbMessage.metadata as Record<string, any> | null,
      created_at: dbMessage.created_at
    };
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
}

// Placeholder function for OpenRouter API integration
async function callOpenRouterAPI(messages: Array<{role: string, content: string}>, modelName: string) {
  // This is a simplified placeholder for the actual OpenRouter API integration
  // In real implementation, this would make HTTP requests to OpenRouter
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate a simple response based on the last user message
  const lastMessage = messages[messages.length - 1];
  const responseContent = `AI response to: "${lastMessage.content}" using model ${modelName}`;
  
  return {
    content: responseContent,
    metadata: {
      model: modelName,
      timestamp: new Date().toISOString(),
      tokens_used: Math.floor(Math.random() * 100) + 50
    } as Record<string, any>
  };
}
