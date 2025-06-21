
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import VoiceManager from "./pages/VoiceManager";
import ManageVideos from "./pages/ManageVideos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  🎭 AI Voice Skit
                </Link>
                <div className="flex gap-4">
                  <Link 
                    to="/" 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/voices" 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Manage Voices
                  </Link>
                  <Link 
                    to="/manage-videos" 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Manage Videos
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/voices" element={<VoiceManager />} />
            <Route path="/manage-videos" element={<ManageVideos />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
