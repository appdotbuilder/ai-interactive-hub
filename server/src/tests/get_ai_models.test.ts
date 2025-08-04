
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { aiModelsTable } from '../db/schema';
import { getAIModels } from '../handlers/get_ai_models';

describe('getAIModels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no models exist', async () => {
    const result = await getAIModels();
    expect(result).toEqual([]);
  });

  it('should return active AI models with correct pricing conversion', async () => {
    // Create test AI models
    await db.insert(aiModelsTable).values([
      {
        id: 'model-1',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: 'Advanced language model',
        context_length: 8192,
        pricing_input: 3000, // $30.00 stored as 3000 cents
        pricing_output: 6000, // $60.00 stored as 6000 cents
        is_active: true
      },
      {
        id: 'model-2',
        name: 'Claude-3',
        provider: 'Anthropic',
        description: 'Constitutional AI model',
        context_length: 100000,
        pricing_input: 1500, // $15.00 stored as 1500 cents
        pricing_output: 7500, // $75.00 stored as 7500 cents
        is_active: true
      }
    ]).execute();

    const result = await getAIModels();

    expect(result).toHaveLength(2);
    
    // Check first model
    const gpt4 = result.find(m => m.name === 'GPT-4');
    expect(gpt4).toBeDefined();
    expect(gpt4!.id).toEqual('model-1');
    expect(gpt4!.provider).toEqual('OpenAI');
    expect(gpt4!.description).toEqual('Advanced language model');
    expect(gpt4!.context_length).toEqual(8192);
    expect(gpt4!.pricing_input).toEqual(30.00); // Converted from cents
    expect(gpt4!.pricing_output).toEqual(60.00); // Converted from cents
    expect(gpt4!.is_active).toBe(true);
    expect(gpt4!.created_at).toBeInstanceOf(Date);
    expect(gpt4!.updated_at).toBeInstanceOf(Date);

    // Check second model
    const claude = result.find(m => m.name === 'Claude-3');
    expect(claude).toBeDefined();
    expect(claude!.pricing_input).toEqual(15.00);
    expect(claude!.pricing_output).toEqual(75.00);
  });

  it('should only return active models', async () => {
    // Create both active and inactive models
    await db.insert(aiModelsTable).values([
      {
        id: 'active-model',
        name: 'Active Model',
        provider: 'Test Provider',
        description: 'This model is active',
        context_length: 4096,
        pricing_input: 1000,
        pricing_output: 2000,
        is_active: true
      },
      {
        id: 'inactive-model',
        name: 'Inactive Model',
        provider: 'Test Provider',
        description: 'This model is inactive',
        context_length: 4096,
        pricing_input: 1000,
        pricing_output: 2000,
        is_active: false
      }
    ]).execute();

    const result = await getAIModels();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Model');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle models with null description', async () => {
    await db.insert(aiModelsTable).values({
      id: 'model-no-desc',
      name: 'Model Without Description',
      provider: 'Test Provider',
      description: null,
      context_length: 2048,
      pricing_input: 500,
      pricing_output: 1000,
      is_active: true
    }).execute();

    const result = await getAIModels();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].name).toEqual('Model Without Description');
  });

  it('should order models by name in descending order', async () => {
    // Create models with different names
    await db.insert(aiModelsTable).values([
      {
        id: 'model-a',
        name: 'Alpha Model',
        provider: 'Provider A',
        context_length: 4096,
        pricing_input: 1000,
        pricing_output: 2000,
        is_active: true
      },
      {
        id: 'model-z',
        name: 'Zulu Model',
        provider: 'Provider Z',
        context_length: 4096,
        pricing_input: 1000,
        pricing_output: 2000,
        is_active: true
      },
      {
        id: 'model-m',
        name: 'Mike Model',
        provider: 'Provider M',
        context_length: 4096,
        pricing_input: 1000,
        pricing_output: 2000,
        is_active: true
      }
    ]).execute();

    const result = await getAIModels();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Zulu Model');
    expect(result[1].name).toEqual('Mike Model');
    expect(result[2].name).toEqual('Alpha Model');
  });
});
