'use server';

/**
 * @fileOverview Provides smart suggestions for channels and users as the user types in the composer.
 *
 * - getSmartSuggestions - A function that returns suggestions for channels or users based on the input.
 * - SmartSuggestionInput - The input type for the getSmartSuggestions function.
 * - SmartSuggestionOutput - The return type for the getSmartSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSuggestionInputSchema = z.object({
  prefix: z.string().describe('The prefix typed by the user, e.g., "@" or "#".'),
  query: z.string().describe('The query string typed by the user after the prefix.'),
});
export type SmartSuggestionInput = z.infer<typeof SmartSuggestionInputSchema>;

const SmartSuggestionOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string().describe('The ID of the suggested item (channel or user).'),
      name: z.string().describe('The name of the suggested item.'),
      type: z.enum(['channel', 'user']).describe('The type of the suggested item.'),
    })
  ).describe('A list of suggested channels or users.'),
});
export type SmartSuggestionOutput = z.infer<typeof SmartSuggestionOutputSchema>;

export async function getSmartSuggestions(input: SmartSuggestionInput): Promise<SmartSuggestionOutput> {
  return smartSuggestionFlow(input);
}

const smartSuggestionPrompt = ai.definePrompt({
  name: 'smartSuggestionPrompt',
  input: {schema: SmartSuggestionInputSchema},
  output: {schema: SmartSuggestionOutputSchema},
  prompt: `You are a helpful assistant that provides suggestions for channels or users based on a prefix and a query.

The user is typing in a message composer and has typed a prefix (either "@" for users or "#" for channels) followed by a query string.

Based on the prefix and query, suggest relevant channels or users.  The suggestions should be limited to the most relevant items. Omit any suggestions that are not relevant.

Prefix: {{{prefix}}}
Query: {{{query}}}

Return a JSON array of suggestions. Each suggestion should include the id, name, and type (channel or user).
`,
});

const smartSuggestionFlow = ai.defineFlow(
  {
    name: 'smartSuggestionFlow',
    inputSchema: SmartSuggestionInputSchema,
    outputSchema: SmartSuggestionOutputSchema,
  },
  async input => {
    const {output} = await smartSuggestionPrompt(input);
    return output!;
  }
);
