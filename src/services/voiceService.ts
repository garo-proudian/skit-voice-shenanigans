
import { supabase } from '@/integrations/supabase/client';

interface GenerateVoiceParams {
  text: string;
  voiceId: string;
}

export const generateVoiceAudio = async ({ text, voiceId }: GenerateVoiceParams): Promise<Blob> => {
  console.log(`Calling Edge Function to generate voice for: "${text}" using voice ID: ${voiceId}`);
  
  const { data, error } = await supabase.functions.invoke('generate-voice', {
    body: { text, voiceId }
  });

  if (error) {
    console.error('Edge Function error:', error);
    throw new Error(`Voice generation failed: ${error.message}`);
  }

  // The data is already a Blob from the Edge Function
  return data;
};
