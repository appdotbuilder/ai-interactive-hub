
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, mediaFilesTable } from '../db/schema';
import { type ProcessMediaInput } from '../schema';
import { processMedia } from '../handlers/process_media';
import { eq } from 'drizzle-orm';

// Test setup data
const testUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User'
};

const testImageFile = {
  id: 'media-image-123',
  user_id: 'user-123',
  filename: 'test-image.jpg',
  original_filename: 'original-image.jpg',
  file_type: 'image' as const,
  file_size: 1024000,
  file_path: '/uploads/test-image.jpg',
  processing_status: 'pending' as const
};

const testVideoFile = {
  id: 'media-video-123',
  user_id: 'user-123',
  filename: 'test-video.mp4',
  original_filename: 'original-video.mp4',
  file_type: 'video' as const,
  file_size: 5120000,
  file_path: '/uploads/test-video.mp4',
  processing_status: 'pending' as const
};

describe('processMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process image analysis successfully', async () => {
    // Create test user and media file
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(mediaFilesTable).values(testImageFile).execute();

    const input: ProcessMediaInput = {
      media_id: 'media-image-123',
      processing_type: 'analysis',
      model_name: 'vision-model-v1'
    };

    const result = await processMedia(input);

    // Verify result structure
    expect(result.id).toEqual('media-image-123');
    expect(result.processing_status).toEqual('completed');
    expect(result.processing_result).toBeDefined();
    expect(result.processing_result?.['analysis']).toEqual('Image analysis completed');
    expect(result.processing_result?.['objects_detected']).toEqual(['person', 'car', 'building']);
    expect(result.processing_result?.['model_used']).toEqual('vision-model-v1');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should process image enhancement successfully', async () => {
    // Create test user and media file
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(mediaFilesTable).values(testImageFile).execute();

    const input: ProcessMediaInput = {
      media_id: 'media-image-123',
      processing_type: 'enhancement',
      model_name: 'enhance-model-v2'
    };

    const result = await processMedia(input);

    // Verify enhancement-specific results
    expect(result.processing_status).toEqual('completed');
    expect(result.processing_result?.['enhancement']).toEqual('Image enhancement completed');
    expect(result.processing_result?.['improvements']).toEqual(['noise_reduction', 'color_correction', 'sharpening']);
    expect(result.processing_result?.['quality_score']).toEqual(9.2);
    expect(result.processing_result?.['model_used']).toEqual('enhance-model-v2');
  });

  it('should process video analysis successfully', async () => {
    // Create test user and media file
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(mediaFilesTable).values(testVideoFile).execute();

    const input: ProcessMediaInput = {
      media_id: 'media-video-123',
      processing_type: 'analysis',
      model_name: 'video-analysis-v1'
    };

    const result = await processMedia(input);

    // Verify video analysis results
    expect(result.processing_status).toEqual('completed');
    expect(result.processing_result?.['analysis']).toEqual('Video analysis completed');
    expect(result.processing_result?.['duration']).toEqual(120);
    expect(result.processing_result?.['scenes_detected']).toEqual(5);
    expect(result.processing_result?.['key_frames']).toEqual([10, 35, 67, 89, 115]);
    expect(result.processing_result?.['model_used']).toEqual('video-analysis-v1');
  });

  it('should process video transcription successfully', async () => {
    // Create test user and media file
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(mediaFilesTable).values(testVideoFile).execute();

    const input: ProcessMediaInput = {
      media_id: 'media-video-123',
      processing_type: 'transcription',
      model_name: 'transcribe-model-v1'
    };

    const result = await processMedia(input);

    // Verify transcription results
    expect(result.processing_status).toEqual('completed');
    expect(result.processing_result?.['transcription']).toEqual('Video transcription completed');
    expect(result.processing_result?.['text']).toEqual('This is a sample transcription of the video content.');
    expect(result.processing_result?.['timestamps']).toEqual([{ start: 0, end: 30, text: 'First segment' }]);
    expect(result.processing_result?.['model_used']).toEqual('transcribe-model-v1');
  });

  it('should update database with processing results', async () => {
    // Create test user and media file
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(mediaFilesTable).values(testImageFile).execute();

    const input: ProcessMediaInput = {
      media_id: 'media-image-123',
      processing_type: 'analysis',
      model_name: 'test-model'
    };

    await processMedia(input);

    // Verify database was updated
    const updatedMedia = await db.select()
      .from(mediaFilesTable)
      .where(eq(mediaFilesTable.id, 'media-image-123'))
      .execute();

    expect(updatedMedia).toHaveLength(1);
    expect(updatedMedia[0].processing_status).toEqual('completed');
    expect(updatedMedia[0].processing_result).toBeDefined();
    expect(updatedMedia[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent media file', async () => {
    const input: ProcessMediaInput = {
      media_id: 'non-existent-media-id',
      processing_type: 'analysis',
      model_name: 'test-model'
    };

    await expect(processMedia(input)).rejects.toThrow(/Media file with id non-existent-media-id not found/i);
  });
});
