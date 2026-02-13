import React, { useState } from 'react';
import { Layout, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageUploader } from './components/ImageUploader';
import { ChatWidget } from './components/ChatWidget';
import { LoadingSpinner } from './components/LoadingSpinner';
import { analyzeRoomImage } from './services/geminiService';
import { ImageState, AnalysisResult } from './types';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!imageState.base64) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const text = await analyzeRoomImage(imageState.base64);
      setAnalysisResult({
        text,
        timestamp: Date.now()
      });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Something went wrong analyzing the image.";
      alert(`Image analysis failed: ${errorText}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageState({ file: null, previewUrl: null, base64: null });
    setAnalysisResult(null);
  };

  const openChatWidget = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">RoomOrganizer</h1>
          </div>
          <a href="#about" className="text-sm font-medium text-stone-500 hover:text-emerald-600 transition-colors">
            About
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-stone-800">
            Reclaim Your <span className="text-emerald-600">Space</span>
          </h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Upload a photo of your messy room. Our AI will analyze it and give you a personalized decluttering plan and organizational tips.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold">1</span>
                  Upload Photo
                </h3>
              </div>
              
              <ImageUploader 
                imageState={imageState} 
                onImageChange={setImageState}
                disabled={isAnalyzing} 
              />
            </div>

            <div className="flex justify-end">
              {imageState.file && !analysisResult && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white px-8 py-3.5 rounded-xl font-medium shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner size={20} className="text-white" />
                      Analyzing Space...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Plan
                    </>
                  )}
                </button>
              )}
              {analysisResult && (
                 <button
                 onClick={handleReset}
                 className="text-stone-500 hover:text-stone-800 font-medium px-4 py-2 transition-colors"
               >
                 Start Over
               </button>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="space-y-6">
            {isAnalyzing && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 h-96 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                    <Sparkles className="text-emerald-500 animate-spin-slow" size={32} />
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-stone-800">Analyzing Layout & Clutter</h3>
                    <p className="text-stone-500">Identifying storage opportunities...</p>
                </div>
              </div>
            )}

            {!isAnalyzing && !analysisResult && (
               <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 p-8 rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <CheckCircle2 className="text-stone-300" size={32} />
                  </div>
                  <h3 className="font-semibold text-stone-400">No Analysis Yet</h3>
                  <p className="text-stone-400 text-sm mt-1 max-w-xs">Upload a photo and click "Generate Plan" to see your personalized suggestions here.</p>
               </div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden ring-1 ring-black/5">
                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-between">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                        <Sparkles size={18} />
                        Your Decluttering Plan
                    </h3>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                        AI Generated
                    </span>
                </div>
                <div className="p-6 sm:p-8 prose prose-stone prose-headings:text-stone-800 prose-p:text-stone-600 prose-li:text-stone-600 prose-strong:text-emerald-700 max-w-none">
                  <ReactMarkdown>{analysisResult.text}</ReactMarkdown>
                </div>
                <div className="bg-stone-50 p-4 border-t border-stone-100 flex items-center justify-between">
                    <p className="text-xs text-stone-500">
                        Tips provided by Groq AI
                    </p>
                    <button 
                        onClick={openChatWidget}
                        className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline"
                    >
                        Ask questions about this <ArrowRight size={14} />
                    </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl font-bold text-stone-800 mb-2">About RoomOrganizer</h3>
          <p className="text-stone-600">
            RoomOrganizer helps you turn room photos into practical decluttering steps. Upload an image to get a plan,
            then use the assistant to ask follow-up questions about layout, storage, and cleaning routines.
          </p>
        </div>
      </section>

      <ChatWidget isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </div>
  );
};

export default App;
