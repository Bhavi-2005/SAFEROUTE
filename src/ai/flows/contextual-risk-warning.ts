'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating contextual risk warnings.
 *
 * - contextualRiskWarning - A function that generates a specific AI-powered warning message about an approaching risk zone.
 * - ContextualRiskWarningInput - The input type for the contextualRiskWarning function.
 * - ContextualRiskWarningOutput - The return type for the contextualRiskWarning function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContextualRiskWarningInputSchema = z.object({
  riskLevel: z.enum(['high', 'medium']).describe('The severity level of the risk (e.g., high, medium).'),
  hazardType: z.string().describe('The general type of hazard (e.g., sharp curve, pedestrian traffic, intersection).'),
  hazardDescription: z.string().describe('A detailed description of the specific hazard, providing more context.'),
  distanceMeters: z.number().int().positive().describe('The user\u0027s current distance to the risk zone in meters.'),
});
export type ContextualRiskWarningInput = z.infer<typeof ContextualRiskWarningInputSchema>;

const ContextualRiskWarningOutputSchema = z.object({
  warningMessage: z.string().describe('A specific, AI-generated warning message explaining the nature of the hazard.'),
});
export type ContextualRiskWarningOutput = z.infer<typeof ContextualRiskWarningOutputSchema>;

export async function contextualRiskWarning(input: ContextualRiskWarningInput): Promise<ContextualRiskWarningOutput> {
  return contextualRiskWarningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualRiskWarningPrompt',
  input: { schema: ContextualRiskWarningInputSchema },
  output: { schema: ContextualRiskWarningOutputSchema },
  prompt: `You are a safety assistant providing real-time warnings to users. Given the following information about an approaching risk zone, generate a concise, specific, and actionable warning message that explains the nature of the hazard and advises the user on how to mitigate the risk. Avoid generic warnings and provide concrete details.

Risk Level: {{{riskLevel}}}
Hazard Type: {{{hazardType}}}
Hazard Description: {{{hazardDescription}}}
Distance to Hazard: {{{distanceMeters}}} meters

Generate a warning message:`,
});

const contextualRiskWarningFlow = ai.defineFlow(
  {
    name: 'contextualRiskWarningFlow',
    inputSchema: ContextualRiskWarningInputSchema,
    outputSchema: ContextualRiskWarningOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
