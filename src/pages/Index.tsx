
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Play, Pause, Plus, Trash2, Volume2 } from 'lucide-react';

interface SkitLine {
  id: string;
  text: string;
  voice: string;
  audioUrl?: string;
  isGenerating?: boolean;
}

const VOICES = [
  { id: 'peter', name: 'Peter Griffin', description: 'The bumbling father' },
  { id: 'stewie', name: 'Stewie Griffin', description: 'The evil genius baby' }
];

const Index = () => {
  const [lines, setLines] = useState<SkitLine[]>([
    { id: '1', text: 'Why are you messing with my code?', voice: 'peter' },
    { id: '2', text: 'Because your logic is from 2003.', voice: 'stewie' }
  ]);
  const [apiKey, setApiKey] = useState('');
  const [playingLine, setPlayingLine] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { toast } = useToast();

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
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key first.",
        variant: "destructive"
      });
      return;
    }

    const line = lines.find(l => l.id === lineId);
    if (!line || !line.text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text for this line.",
        variant: "destructive"
      });
      return;
    }

    // Set generating state
    setLines(prev => prev.map(l => 
      l.id === lineId ? { ...l, isGenerating: true } : l
    ));

    try {
      // For demo purposes, we'll simulate the API call
      // In a real implementation, you would call the ElevenLabs API here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful generation
      setLines(prev => prev.map(l => 
        l.id === lineId ? { 
          ...l, 
          isGenerating: false, 
          audioUrl: `demo-audio-${lineId}` 
        } : l
      ));
      
      toast({
        title: "Voice Generated!",
        description: "Your audio line is ready to play.",
      });
    } catch (error) {
      setLines(prev => prev.map(l => 
        l.id === lineId ? { ...l, isGenerating: false } : l
      ));
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate voice. Please check your API key and try again.",
        variant: "destructive"
      });
    }
  };

  const generateAllVoices = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key first.",
        variant: "destructive"
      });
      return;
    }

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

    if (playingLine === lineId) {
      setPlayingLine(null);
    } else {
      setPlayingLine(lineId);
      // In a real implementation, you would play the actual audio here
      setTimeout(() => setPlayingLine(null), 3000); // Simulate 3-second audio
    }
  };

  const downloadSkit = () => {
    const generatedLines = lines.filter(line => line.audioUrl);
    if (generatedLines.length === 0) {
      toast({
        title: "No Audio to Download",
        description: "Generate some voice lines first!",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download Started",
      description: "Your skit is being prepared for download...",
    });
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
            Create hilarious conversations with Peter and Stewie! Write your script, 
            select voices, and bring your comedy to life.
          </p>
        </div>

        {/* API Key Input */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              ElevenLabs API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="password"
                placeholder="Enter your ElevenLabs API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={generateAllVoices}
                disabled={isGeneratingAll || !apiKey}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingAll ? 'Generating...' : 'Generate All'}
              </Button>
            </div>
            {!apiKey && (
              <p className="text-sm text-gray-600 mt-2">
                Get your API key from{' '}
                <a 
                  href="https://elevenlabs.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  ElevenLabs
                </a>
              </p>
            )}
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
              <li>Enter your ElevenLabs API key above</li>
              <li>Write dialogue lines for your characters</li>
              <li>Select which voice (Peter or Stewie) should say each line</li>
              <li>Click "Generate" to create the audio</li>
              <li>Play individual lines or download the full skit</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
