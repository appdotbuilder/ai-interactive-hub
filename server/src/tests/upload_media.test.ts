
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, mediaFilesTable } from '../db/schema';
import { type UploadMediaInput } from '../schema';
import { uploadMedia } from '../handlers/upload_media';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('uploadMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload image media file', async () => {
    // Create test user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      })
      .execute();

    const testInput: UploadMediaInput = {
      user_id: userId,
      filename: 'image_123.jpg',
      original_filename: 'vacation_photo.jpg',
      file_type: 'image',
      file_size: 2048576,
      file_path: '/uploads/images/image_123.jpg'
    };

    const result = await uploadMedia(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.filename).toEqual('image_123.jpg');
    expect(result.original_filename).toEqual('vacation_photo.jpg');
    expect(result.file_type).toEqual('image');
    expect(result.file_size).toEqual(2048576);
    expect(result.file_path).toEqual('/uploads/images/image_123.jpg');
    expect(result.processing_status).toEqual('pending');
    expect(result.processing_result).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should upload video media file', async () => {
    // Create test user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'video@example.com',
        name: 'Video User'
      })
      .execute();

    const testInput: UploadMediaInput = {
      user_id: userId,
      filename: 'video_456.mp4',
      original_filename: 'conference_recording.mp4',
      file_type: 'video',
      file_size: 52428800,
      file_path: '/uploads/videos/video_456.mp4'
    };

    const result = await uploadMedia(testInput);

    expect(result.user_id).toEqual(userId);
    expect(result.filename).toEqual('video_456.mp4');
    expect(result.original_filename).toEqual('conference_recording.mp4');
    expect(result.file_type).toEqual('video');
    expect(result.file_size).toEqual(52428800);
    expect(result.file_path).toEqual('/uploads/videos/video_456.mp4');
    expect(result.processing_status).toEqual('pending');
  });

  it('should save media file to database', async () => {
    // Create test user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'save@example.com',
        name: 'Save User'
      })
      .execute();

    const testInput: UploadMediaInput = {
      user_id: userId,
      filename: 'test_file.jpg',
      original_filename: 'original_test.jpg',
      file_type: 'image',
      file_size: 1024000,
      file_path: '/uploads/test_file.jpg'
    };

    const result = await uploadMedia(testInput);

    // Query database to verify saved data
    const mediaFiles = await db.select()
      .from(mediaFilesTable)
      .where(eq(mediaFilesTable.id, result.id))
      .execute();

    expect(mediaFiles).toHaveLength(1);
    expect(mediaFiles[0].user_id).toEqual(userId);
    expect(mediaFiles[0].filename).toEqual('test_file.jpg');
    expect(mediaFiles[0].original_filename).toEqual('original_test.jpg');
    expect(mediaFiles[0].file_type).toEqual('image');
    expect(mediaFiles[0].file_size).toEqual(1024000);
    expect(mediaFiles[0].file_path).toEqual('/uploads/test_file.jpg');
    expect(mediaFiles[0].processing_status).toEqual('pending');
    expect(mediaFiles[0].processing_result).toBeNull();
    expect(mediaFiles[0].created_at).toBeInstanceOf(Date);
    expect(mediaFiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fail with invalid user_id', async () => {
    const testInput: UploadMediaInput = {
      user_id: 'non-existent-user',
      filename: 'test.jpg',
      original_filename: 'test.jpg',
      file_type: 'image',
      file_size: 1024,
      file_path: '/uploads/test.jpg'
    };

    await expect(uploadMedia(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle large file sizes', async () => {
    // Create test user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'large@example.com',
        name: 'Large File User'
      })
      .execute();

    const testInput: UploadMediaInput = {
      user_id: userId,
      filename: 'large_video.mp4',
      original_filename: 'very_large_video.mp4',
      file_type: 'video',
      file_size: 2147483647, // Max 32-bit integer
      file_path: '/uploads/large_video.mp4'
    };

    const result = await uploadMedia(testInput);

    expect(result.file_size).toEqual(2147483647);
    expect(result.file_type).toEqual('video');
  });
});
