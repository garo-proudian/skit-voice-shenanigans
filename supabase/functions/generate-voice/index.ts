
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to analyze the text and determine appropriate voice settings
function getVoiceSettings(text: string, previousText?: string) {
  const isQuestion = text.trim().endsWith('?') || 
                    text.toLowerCase().includes('what') || 
                    text.toLowerCase().includes('why') || 
                    text.toLowerCase().includes('how') || 
                    text.toLowerCase().includes('when') || 
                    text.toLowerCase().includes('where') || 
                    text.toLowerCase().includes('who');
  
  const isExclamation = text.trim().includes('!');
  const isResponse = previousText && previousText.trim().endsWith('?');
  
  // Adjust voice settings based on context
  if (isQuestion) {
    // Questions: more expressive, curious tone
    return {
      stability: 0.3,
      similarity_boost: 0.7,
      style: 0.2,
      use_speaker_boost: true
    };
  } else if (isResponse) {
    // Responses to questions: confident, clear tone
    return {
      stability: 0.6,
      similarity_boost: 0.8,
      style: 0.1,
      use_speaker_boost: true
    };
  } else if (isExclamation) {
    // Exclamations: more dramatic, emotional
    return {
      stability: 0.2,
      similarity_boost: 0.75,
      style: 0.4,
      use_speaker_boost: true
    };
  } else {
    // Regular statements: balanced tone
    return {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, previousText } = await req.json();
    
    if (!text || !voiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: text and voiceId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating voice for: "${text}" using voice ID: ${voiceId}`);
    if (previousText) {
      console.log(`Previous line context: "${previousText}"`);
    }
    
    // Get contextually appropriate voice settings
    const voiceSettings = getVoiceSettings(text, previousText);
    console.log('Voice settings:', voiceSettings);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in generate-voice function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
