
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Settings } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  description: string;
  voiceId: string;
}

const VoiceManager = () => {
  const [voices, setVoices] = useState<Voice[]>([
    { id: 'peter', name: 'Peter Griffin', description: 'The bumbling father', voiceId: '1P7KOzutBXxu64xIbUwT' },
    { id: 'stewie', name: 'Stewie Griffin', description: 'The evil genius baby', voiceId: 'EsC6WC6aufrhentvDBpL' }
  ]);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceDescription, setNewVoiceDescription] = useState('');
  const [newVoiceId, setNewVoiceId] = useState('');
  const { toast } = useToast();

  const addVoice = () => {
    if (!newVoiceName.trim() || !newVoiceId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both voice name and voice ID.",
        variant: "destructive"
      });
      return;
    }

    const newVoice: Voice = {
      id: newVoiceName.toLowerCase().replace(/\s+/g, '_'),
      name: newVoiceName,
      description: newVoiceDescription || 'Custom voice',
      voiceId: newVoiceId
    };

    setVoices([...voices, newVoice]);
    setNewVoiceName('');
    setNewVoiceDescription('');
    setNewVoiceId('');

    toast({
      title: "Voice Added",
      description: `${newVoiceName} has been added to your voice collection.`,
    });
  };

  const removeVoice = (id: string) => {
    setVoices(voices.filter(voice => voice.id !== id));
    toast({
      title: "Voice Removed",
      description: "Voice has been removed from your collection.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎙️ Voice Manager
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your ElevenLabs voice collection. Add new voices with their IDs to use in your skits.
          </p>
        </div>

        {/* Add New Voice */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voiceName">Voice Name</Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., Morgan Freeman"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="voiceDescription">Description (Optional)</Label>
                <Input
                  id="voiceDescription"
                  placeholder="e.g., Narrator voice"
                  value={newVoiceDescription}
                  onChange={(e) => setNewVoiceDescription(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="voiceId">ElevenLabs Voice ID</Label>
              <Input
                id="voiceId"
                placeholder="e.g., 9BWtsMINqrJLrRacOk9x"
                value={newVoiceId}
                onChange={(e) => setNewVoiceId(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find voice IDs in your ElevenLabs dashboard or use the default ones provided.
              </p>
            </div>
            <Button onClick={addVoice} className="w-full">
              Add Voice
            </Button>
          </CardContent>
        </Card>

        {/* Voice List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Your Voices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {voices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No voices available. Add your first voice above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {voices.map((voice) => (
                  <div 
                    key={voice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{voice.name}</h3>
                      <p className="text-sm text-gray-600">{voice.description}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {voice.voiceId}</p>
                    </div>
                    <Button
                      onClick={() => removeVoice(voice.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Get Voice IDs</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your ElevenLabs dashboard</li>
              <li>Navigate to the Voices section</li>
              <li>Click on any voice to see its details</li>
              <li>Copy the Voice ID (usually a long alphanumeric string)</li>
              <li>Use popular voices like Aria (9BWtsMINqrJLrRacOk9x) or Rachel (21m00Tcm4TlvDq8ikWAM)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceManager;
