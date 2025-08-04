
import { db } from '../db';
import { mediaFilesTable } from '../db/schema';
import { type MediaFile } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getMediaFiles(userId: string): Promise<MediaFile[]> {
  try {
    const results = await db.select()
      .from(mediaFilesTable)
      .where(eq(mediaFilesTable.user_id, userId))
      .orderBy(desc(mediaFilesTable.created_at))
      .execute();

    // Cast processing_result from unknown to the expected type
    return results.map(file => ({
      ...file,
      processing_result: file.processing_result as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Media files retrieval failed:', error);
    throw error;
  }
}
