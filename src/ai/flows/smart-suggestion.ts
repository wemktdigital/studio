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
import { channels as mockChannels, users as mockUsers } from '@/lib/data';

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

const suggestionTool = ai.defineTool(
  {
    name: 'getSuggestionData',
    description: 'Get a list of available channels or users to suggest from.',
    input: z.object({
        type: z.enum(['channel', 'user']),
    }),
    output: z.array(z.object({ id: z.string(), name: z.string() })),
  },
  async ({ type }) => {
    if (type === 'channel') {
      return mockChannels.map(c => ({ id: c.id, name: c.name }));
    } else {
      return mockUsers.map(u => ({ id: u.id, name: u.handle }));
    }
  }
);


const smartSuggestionPrompt = ai.definePrompt({
  name: 'smartSuggestionPrompt',
  input: {schema: SmartSuggestionInputSchema},
  output: {schema: SmartSuggestionOutputSchema},
  tools: [suggestionTool],
  prompt: `You are a helpful assistant that provides suggestions for channels or users based on a prefix and a query.

The user is typing in a message composer and has typed a prefix (either "@" for users or "#" for channels) followed by a query string.

- Use the 'getSuggestionData' tool to fetch the list of available users or channels based on the prefix.
- Filter this list to find items that match the user's query. The match should be case-insensitive and can be partial (e.g., 'gen' should match 'general').
- Return a JSON array of up to 5 suggestions. Each suggestion should include the id, name, and type (channel or user).
- If no relevant items are found, return an empty array for suggestions.

Prefix: {{{prefix}}}
Query: {{{query}}}
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
