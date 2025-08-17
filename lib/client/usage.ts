// Client-side usage tracking utility
export async function recordClientInteraction(prompts: number = 1) {
  try {
    await fetch('/api/usage/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompts }),
    });
  } catch (error) {
    console.error('Failed to record usage:', error);
    // Don't throw error to avoid breaking user experience
  }
}

// Helper functions for specific interaction types
export const recordChatStart = () => recordClientInteraction(1);
export const recordFileUpload = () => recordClientInteraction(1);
export const recordImageAnalysis = () => recordClientInteraction(1);
export const recordDocumentAnalysis = () => recordClientInteraction(1);
