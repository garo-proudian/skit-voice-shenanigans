
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Star, Trash2, FileVideo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Video {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_default: boolean;
  created_at: string;
}

const ManageVideos = () => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch videos without user filtering
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    }
  });

  // Upload video mutation without authentication
  const uploadVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload to storage without user folder structure
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save video metadata to database without user_id
      const { data, error: dbError } = await supabase
        .from('videos')
        .insert({
          filename: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          is_default: videos.length === 0, // First video becomes default
          user_id: null // Explicitly set to null since it's now optional
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Video Uploaded!",
        description: "Your video has been successfully uploaded.",
      });
      setUploading(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      let errorMessage = "Failed to upload video.";
      
      // Check for specific error types
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as any).statusCode;
        if (statusCode === '413' || statusCode === 413) {
          errorMessage = "Video file is too large. Please try a smaller file (under 50MB).";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setUploading(false);
    }
  });

  // Set default video mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('videos')
        .update({ is_default: true })
        .eq('id', videoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Default Video Set",
        description: "This video will be used for your skit overlays.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Set Default",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive"
      });
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (video: Video) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([video.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Video Deleted",
        description: "The video has been removed from your library.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete video.",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/mp4')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an MP4 video file.",
        variant: "destructive"
      });
      return;
    }

    // Reduced file size limit to 50MB to avoid Supabase limits
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video smaller than 50MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    uploadVideoMutation.mutate(file);
  };

  const getVideoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 Manage Videos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload Minecraft gameplay videos to use as backgrounds for your AI voice skits. 
            Set a default video that will be used for all your skit overlays.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileVideo className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload an MP4 video
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 100MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span>Uploading video...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Your Video Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileVideo className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No videos uploaded yet</p>
                <p>Upload your first Minecraft gameplay video to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="aspect-video bg-black rounded-lg mb-3 overflow-hidden">
                      <video
                        src={getVideoUrl(video.file_path)}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate" title={video.filename}>
                          {video.filename}
                        </h3>
                        {video.is_default && (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        {formatFileSize(video.file_size)}
                      </p>
                      
                      <div className="flex gap-2 pt-2">
                        {!video.is_default && (
                          <Button
                            onClick={() => setDefaultMutation.mutate(video.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Set Default
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => deleteVideoMutation.mutate(video)}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How Video Overlays Work</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Upload MP4 videos of Minecraft gameplay or any background video you want</li>
              <li>Set one video as your default - this will be used for all skit overlays</li>
              <li>On the main skit page, use the "Download Video" button to combine your audio with the selected video</li>
              <li>The final video will have your AI voices playing over the background video</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageVideos;
