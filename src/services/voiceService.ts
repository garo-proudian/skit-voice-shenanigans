
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

  // The Edge Function returns raw ArrayBuffer data
  // We need to convert it to a proper Blob for audio playback
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'audio/mpeg' });
  }
  
  // If it's already a Blob, return it directly
  if (data instanceof Blob) {
    return data;
  }
  
  // If it's neither, try to create a Blob from the data
  console.warn('Unexpected data type from Edge Function:', typeof data);
  return new Blob([data], { type: 'audio/mpeg' });
};
