
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, mediaFilesTable } from '../db/schema';
import { getMediaFiles } from '../handlers/get_media_files';

describe('getMediaFiles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return media files for a user ordered by most recent first', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test media files with different timestamps
    const file1 = await db.insert(mediaFilesTable)
      .values({
        id: 'file-1',
        user_id: 'user-1',
        filename: 'test1.jpg',
        original_filename: 'original1.jpg',
        file_type: 'image',
        file_size: 1024,
        file_path: '/uploads/test1.jpg',
        processing_status: 'completed',
        processing_result: { analysis: 'test result 1' }
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const file2 = await db.insert(mediaFilesTable)
      .values({
        id: 'file-2',
        user_id: 'user-1',
        filename: 'test2.mp4',
        original_filename: 'original2.mp4',
        file_type: 'video',
        file_size: 2048,
        file_path: '/uploads/test2.mp4',
        processing_status: 'pending',
        processing_result: null
      })
      .returning()
      .execute();

    const result = await getMediaFiles('user-1');

    // Should return both files
    expect(result).toHaveLength(2);

    // Should be ordered by most recent first (file2 should come first)
    expect(result[0].id).toEqual('file-2');
    expect(result[0].filename).toEqual('test2.mp4');
    expect(result[0].file_type).toEqual('video');
    expect(result[0].file_size).toEqual(2048);
    expect(result[0].processing_status).toEqual('pending');
    expect(result[0].processing_result).toBeNull();

    expect(result[1].id).toEqual('file-1');
    expect(result[1].filename).toEqual('test1.jpg');
    expect(result[1].file_type).toEqual('image');
    expect(result[1].file_size).toEqual(1024);
    expect(result[1].processing_status).toEqual('completed');
    expect(result[1].processing_result).toEqual({ analysis: 'test result 1' });

    // Verify all fields are properly typed
    result.forEach(file => {
      expect(file.id).toBeDefined();
      expect(file.user_id).toEqual('user-1');
      expect(file.filename).toBeDefined();
      expect(file.original_filename).toBeDefined();
      expect(['image', 'video']).toContain(file.file_type);
      expect(typeof file.file_size).toBe('number');
      expect(file.file_path).toBeDefined();
      expect(['pending', 'processing', 'completed', 'failed']).toContain(file.processing_status);
      expect(file.created_at).toBeInstanceOf(Date);
      expect(file.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for user with no media files', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user-2',
        email: 'test2@example.com',
        name: 'Test User 2'
      })
      .execute();

    const result = await getMediaFiles('user-2');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return files for the specified user', async () => {
    // Create two test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: 'Test User 1'
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: 'Test User 2'
        }
      ])
      .execute();

    // Create media files for both users
    await db.insert(mediaFilesTable)
      .values([
        {
          id: 'file-1',
          user_id: 'user-1',
          filename: 'user1_file.jpg',
          original_filename: 'user1_original.jpg',
          file_type: 'image',
          file_size: 1024,
          file_path: '/uploads/user1_file.jpg',
          processing_status: 'completed'
        },
        {
          id: 'file-2',
          user_id: 'user-2',
          filename: 'user2_file.jpg',
          original_filename: 'user2_original.jpg',
          file_type: 'image',
          file_size: 2048,
          file_path: '/uploads/user2_file.jpg',
          processing_status: 'pending'
        }
      ])
      .execute();

    const user1Files = await getMediaFiles('user-1');
    const user2Files = await getMediaFiles('user-2');

    // Each user should only get their own files
    expect(user1Files).toHaveLength(1);
    expect(user1Files[0].filename).toEqual('user1_file.jpg');
    expect(user1Files[0].user_id).toEqual('user-1');

    expect(user2Files).toHaveLength(1);
    expect(user2Files[0].filename).toEqual('user2_file.jpg');
    expect(user2Files[0].user_id).toEqual('user-2');
  });

  it('should return empty array for non-existent user', async () => {
    const result = await getMediaFiles('non-existent-user');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
