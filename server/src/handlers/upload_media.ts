
import { db } from '../db';
import { mediaFilesTable } from '../db/schema';
import { type UploadMediaInput, type MediaFile } from '../schema';
import { nanoid } from 'nanoid';

export const uploadMedia = async (input: UploadMediaInput): Promise<MediaFile> => {
  try {
    // Generate unique ID for the media file
    const mediaId = nanoid();

    // Insert media file record
    const result = await db.insert(mediaFilesTable)
      .values({
        id: mediaId,
        user_id: input.user_id,
        filename: input.filename,
        original_filename: input.original_filename,
        file_type: input.file_type,
        file_size: input.file_size,
        file_path: input.file_path,
        processing_status: 'pending',
        processing_result: null
      })
      .returning()
      .execute();

    // Convert the database result to match MediaFile schema
    const mediaFile = result[0];
    return {
      ...mediaFile,
      processing_result: mediaFile.processing_result as Record<string, any> | null
    };
  } catch (error) {
    console.error('Media upload failed:', error);
    throw error;
  }
};
