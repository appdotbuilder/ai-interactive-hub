
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type ThinkInput } from '../schema';
import { aiThink } from '../handlers/ai_think';

const testInput: ThinkInput = {
  query: 'What is machine learning?',
  model_name: 'gpt-4',
  show_reasoning: true
};

describe('aiThink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return reasoning and conclusion', async () => {
    const result = await aiThink(testInput);

    expect(result.reasoning).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(typeof result.reasoning).toBe('string');
    expect(typeof result.conclusion).toBe('string');
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.conclusion.length).toBeGreaterThan(0);
  });

  it('should include model name in reasoning when show_reasoning is true', async () => {
    const result = await aiThink(testInput);

    expect(result.reasoning).toContain('gpt-4');
    expect(result.reasoning).toContain('machine learning');
  });

  it('should hide reasoning when show_reasoning is false', async () => {
    const input: ThinkInput = {
      ...testInput,
      show_reasoning: false
    };

    const result = await aiThink(input);

    expect(result.reasoning).toContain('Reasoning hidden as requested');
    expect(result.conclusion).toBeDefined();
    expect(result.conclusion.length).toBeGreaterThan(0);
  });

  it('should handle mathematical queries', async () => {
    const mathInput: ThinkInput = {
      query: 'Calculate the derivative of x^2 + 3x + 5',
      model_name: 'gpt-4',
      show_reasoning: true
    };

    const result = await aiThink(mathInput);

    expect(result.conclusion).toContain('Mathematical analysis complete');
    expect(result.conclusion).toContain('numerical computation');
  });

  it('should handle code-related queries', async () => {
    const codeInput: ThinkInput = {
      query: 'How to write a function in JavaScript',
      model_name: 'claude-3',
      show_reasoning: true
    };

    const result = await aiThink(codeInput);

    expect(result.conclusion).toContain('Code analysis complete');
    expect(result.conclusion).toContain('programming');
  });

  it('should handle explanation requests', async () => {
    const explainInput: ThinkInput = {
      query: 'Explain how neural networks work',
      model_name: 'gpt-3.5',
      show_reasoning: true
    };

    const result = await aiThink(explainInput);

    expect(result.conclusion).toContain('Explanation request identified');
    expect(result.conclusion).toContain('conceptual question');
  });

  it('should use default show_reasoning when not provided', async () => {
    const inputWithoutReasoning: ThinkInput = {
      query: 'Test query',
      model_name: 'gpt-4'
      // show_reasoning not provided, should default to true
    };

    const result = await aiThink(inputWithoutReasoning);

    expect(result.reasoning).toContain('gpt-4');
    expect(result.reasoning).not.toContain('Reasoning hidden');
  });

  it('should handle general queries', async () => {
    const generalInput: ThinkInput = {
      query: 'Tell me about artificial intelligence',
      model_name: 'claude-2',
      show_reasoning: true
    };

    const result = await aiThink(generalInput);

    expect(result.conclusion).toContain('General analysis complete');
    expect(result.conclusion).toContain('claude-2');
    expect(result.conclusion).toContain('step-by-step reasoning');
  });
});
