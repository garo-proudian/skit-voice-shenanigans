
import { supabase } from '@/integrations/supabase/client';

interface GenerateVoiceParams {
  text: string;
  voiceId: string;
}

export const generateVoiceAudio = async ({ text, voiceId }: GenerateVoiceParams): Promise<Blob> => {
  console.log(`Calling Edge Function to generate voice for: "${text}" using voice ID: ${voiceId}`);
  
  // Make a direct fetch call to the Edge Function to handle binary data properly
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`https://keixtwrzwfpsafbhezyh.supabase.co/functions/v1/generate-voice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.supabaseKey}`,
      'apikey': supabase.supabaseKey,
    },
    body: JSON.stringify({ text, voiceId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Edge Function error:', errorText);
    throw new Error(`Voice generation failed: ${response.status} - ${errorText}`);
  }

  // Get the response as a blob directly
  const audioBlob = await response.blob();
  
  // Ensure it's the right type
  if (audioBlob.type !== 'audio/mpeg') {
    return new Blob([audioBlob], { type: 'audio/mpeg' });
  }
  
  return audioBlob;
};
