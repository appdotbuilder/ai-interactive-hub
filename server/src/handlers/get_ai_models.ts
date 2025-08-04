
import { db } from '../db';
import { aiModelsTable } from '../db/schema';
import { type AIModel } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getAIModels(): Promise<AIModel[]> {
  try {
    // Fetch only active AI models, ordered by name
    const results = await db.select()
      .from(aiModelsTable)
      .where(eq(aiModelsTable.is_active, true))
      .orderBy(desc(aiModelsTable.name))
      .execute();

    // Convert pricing from cents (integers) to dollars (numbers)
    return results.map(model => ({
      ...model,
      pricing_input: model.pricing_input / 100, // Convert cents to dollars
      pricing_output: model.pricing_output / 100 // Convert cents to dollars
    }));
  } catch (error) {
    console.error('Failed to fetch AI models:', error);
    throw error;
  }
}
