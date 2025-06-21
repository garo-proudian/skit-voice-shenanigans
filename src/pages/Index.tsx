import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Play, Pause, Plus, Trash2, Volume2, Video } from 'lucide-react';
import { generateVoiceAudio } from '@/services/voiceService';
import { supabase } from '@/integrations/supabase/client';

interface SkitLine {
  id: string;
  text: string;
  voice: string;
  audioUrl?: string;
  audioBlob?: Blob;
  isGenerating?: boolean;
}

const VOICES = [
  { id: 'peter', name: 'Peter Griffin', description: 'The bumbling father' },
  { id: 'stewie', name: 'Stewie Griffin', description: 'The evil genius baby' }
];

// Hardcoded voice IDs for your cloned voices
const VOICE_IDS = {
  peter: '1P7KOzutBXxu64xIbUwT',
  stewie: 'EsC6WC6aufrhentvDBpL'
};

const Index = () => {
  const [lines, setLines] = useState<SkitLine[]>([
    { id: '1', text: 'Why are you messing with my code?', voice: 'peter' },
    { id: '2', text: 'Because your logic is from 2003.', voice: 'stewie' }
  ]);
  const [playingLine, setPlayingLine] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { toast } = useToast();

  const getVoiceId = (voice: string): string => {
    return VOICE_IDS[voice as keyof typeof VOICE_IDS];
  };

  const addLine = () => {
    const newLine: SkitLine = {
      id: Date.now().toString(),
      text: '',
      voice: 'peter'
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const updateLine = (id: string, field: keyof SkitLine, value: string) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const generateVoice = async (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line || !line.text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text for this line.",
        variant: "destructive"
      });
      return;
    }

    const voiceId = getVoiceId(line.voice);
    
    // Get the previous line's text for context
    const currentIndex = lines.findIndex(l => l.id === lineId);
    const previousLine = currentIndex > 0 ? lines[currentIndex - 1] : null;
    const previousText = previousLine?.text?.trim() || undefined;

    // Set generating state
    setLines(prev => prev.map(l => 
      l.id === lineId ? { ...l, isGenerating: true } : l
    ));

    try {
      console.log(`Generating voice for: "${line.text}" using voice ID: ${voiceId}`);
      
      const audioBlob = await generateVoiceAudio({
        text: line.text,
        voiceId: voiceId,
        previousText: previousText
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      
      setLines(prev => prev.map(l => 
        l.id === lineId ? { 
          ...l, 
          isGenerating: false, 
          audioUrl: audioUrl,
          audioBlob: audioBlob
        } : l
      ));
      
      toast({
        title: "Voice Generated!",
        description: "Your audio line is ready to play.",
      });
    } catch (error) {
      console.error('Voice generation error:', error);
      setLines(prev => prev.map(l => 
        l.id === lineId ? { ...l, isGenerating: false } : l
      ));
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate voice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateAllVoices = async () => {
    const linesToGenerate = lines.filter(line => line.text.trim() && !line.audioUrl);
    if (linesToGenerate.length === 0) {
      toast({
        title: "Nothing to Generate",
        description: "All lines are either empty or already generated.",
      });
      return;
    }

    setIsGeneratingAll(true);

    for (const line of linesToGenerate) {
      await generateVoice(line.id);
    }

    setIsGeneratingAll(false);
  };

  const playLine = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line?.audioUrl) return;

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (playingLine === lineId) {
      setPlayingLine(null);
      setCurrentAudio(null);
    } else {
      const audio = new Audio(line.audioUrl);
      audio.onended = () => {
        setPlayingLine(null);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        console.error('Audio playback error');
        setPlayingLine(null);
        setCurrentAudio(null);
      };
      
      audio.play();
      setPlayingLine(lineId);
      setCurrentAudio(audio);
    }
  };

  const downloadSkit = async () => {
    const generatedLines = lines.filter(line => line.audioBlob);
    if (generatedLines.length === 0) {
      toast({
        title: "No Audio to Download",
        description: "Generate some voice lines first!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a new audio context for combining audio files
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      // Load all audio blobs into audio buffers
      for (const line of generatedLines) {
        const arrayBuffer = await line.audioBlob!.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
      }

      if (audioBuffers.length === 0) {
        throw new Error('No valid audio data found');
      }

      // Calculate total length and create combined buffer
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const combinedBuffer = audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );

      // Copy all audio data into the combined buffer
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          combinedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;
      }

      // Convert the combined buffer back to a blob
      const length = combinedBuffer.length;
      const sampleRate = combinedBuffer.sampleRate;
      const buffer = new ArrayBuffer(44 + length * 2);
      const view = new DataView(buffer);

      // Write WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * 2, true);

      // Write audio data
      const channelData = combinedBuffer.getChannelData(0);
      let offset2 = 44;
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset2 += 2;
      }

      // Create blob and download
      const audioBlob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'complete-voice-skit.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Combined ${generatedLines.length} audio lines into one file!`,
      });

    } catch (error) {
      console.error('Error combining audio files:', error);
      
      // Fallback: Download all files individually
      generatedLines.forEach((line, index) => {
        const url = URL.createObjectURL(line.audioBlob!);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-line-${index + 1}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      toast({
        title: "Individual Downloads",
        description: `Downloaded ${generatedLines.length} separate audio files.`,
      });
    }
  };

  const downloadVideo = async () => {
    const generatedLines = lines.filter(line => line.audioBlob);
    if (generatedLines.length === 0) {
      toast({
        title: "No Audio to Merge",
        description: "Generate some voice lines first!",
        variant: "destructive"
      });
      return;
    }

    // Check if user has a default video
    try {
      const { data: defaultVideo } = await supabase
        .from('videos')
        .select('*')
        .eq('is_default', true)
        .single();

      if (!defaultVideo) {
        toast({
          title: "No Default Video",
          description: "Please upload and set a default video in Manage Videos first.",
          variant: "destructive"
        });
        return;
      }

      // Simulate video processing for now
      toast({
        title: "Processing Video...",
        description: "Your video is being prepared. This is a placeholder for now.",
      });

      // Simulate processing time
      setTimeout(() => {
        toast({
          title: "Video Ready!",
          description: "Video processing will be implemented in the next update.",
        });
      }, 3000);

    } catch (error) {
      console.error('Error checking for default video:', error);
      toast({
        title: "Error",
        description: "Failed to check for default video. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎭 AI Voice Skit Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create hilarious conversations with your cloned Peter and Stewie voices! 
            Your API key is securely stored and managed by our backend.
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateAllVoices}
              disabled={isGeneratingAll}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              {isGeneratingAll ? 'Generating All Voices...' : 'Generate All Voices'}
            </Button>
          </CardContent>
        </Card>

        {/* Script Editor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Skit Script</span>
              <div className="flex gap-2">
                <Button onClick={addLine} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
                <Button 
                  onClick={downloadSkit}
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Skit
                </Button>
                <Button 
                  onClick={downloadVideo}
                  variant="outline" 
                  size="sm"
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Download Video
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map((line, index) => (
              <div 
                key={line.id} 
                className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Enter dialogue line..."
                    value={line.text}
                    onChange={(e) => updateLine(line.id, 'text', e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  
                  <div className="flex gap-3 items-center">
                    <Select
                      value={line.voice}
                      onValueChange={(value) => updateLine(line.id, 'voice', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICES.map(voice => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div>
                              <div className="font-medium">{voice.name}</div>
                              <div className="text-xs text-gray-500">{voice.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={() => generateVoice(line.id)}
                      disabled={line.isGenerating || !line.text.trim()}
                      size="sm"
                      variant={line.audioUrl ? "outline" : "default"}
                      className={line.audioUrl ? "text-green-600 border-green-600" : ""}
                    >
                      {line.isGenerating ? 'Generating...' : line.audioUrl ? 'Regenerate' : 'Generate'}
                    </Button>
                    
                    {line.audioUrl && (
                      <Button
                        onClick={() => playLine(line.id)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        {playingLine === line.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => removeLine(line.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {lines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No lines yet. Click "Add Line" to start your skit!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Write dialogue lines for your characters</li>
              <li>Select which voice (Peter or Stewie) should say each line</li>
              <li>Click "Generate" to create the audio using your cloned voices</li>
              <li>Play individual lines or download the audio files</li>
              <li>Use "Download Video" to combine audio with your Minecraft background video</li>
              <li>Your API key is securely managed by our backend - no need to enter it!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
