import React, { useState } from 'react';
import { GeneratedImage, ImageSize, AspectRatio } from '../types';
import { Button } from './Button';
import { Download, Wand2, Plus, AlertCircle, Layers, FileText, ImagePlus, Archive } from 'lucide-react';

interface ImagePanelProps {
  images: GeneratedImage[];
  prompts: string[];
  onGeneratePrompts: () => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  onGenerateAll: () => void;
  isGenerating: boolean;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  hasBlogContent: boolean;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({ 
  images, 
  prompts, 
  onGeneratePrompts,
  onGenerateImage, 
  onGenerateAll,
  isGenerating,
  imageSize,
  aspectRatio,
  hasBlogContent
}) => {
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string) => {
    setError(null);
    try {
      await onGenerateImage(prompt);
    } catch (e) {
      setError("Failed to generate image. Please check your API key selection.");
    }
  };

  const downloadPrompts = () => {
    if (prompts.length === 0) return;
    const text = prompts.map((p, i) => `Image ${i + 1}: ${p}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'image-prompts.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getImageIndex = (imgPrompt: string) => {
    return prompts.indexOf(imgPrompt);
  };

  const getDownloadFilename = (imgPrompt: string) => {
     const idx = getImageIndex(imgPrompt);
     if (idx !== -1) return `Image-${idx + 1}.png`;
     return `Custom-Image-${Date.now()}.png`;
  };

  const handleDownloadAll = async () => {
    let count = 0;
    // We reverse the array to download in order (since images are usually prepended) 
    // or we can sort them by index first if needed. 
    // The current state in App.tsx prepends new images: setGeneratedImages(prev => [newImage, ...prev]);
    // So the list is newest first. We probably want to download Image 1, then Image 2.
    
    const sortedImages = [...images].sort((a, b) => {
      const idxA = getImageIndex(a.prompt);
      const idxB = getImageIndex(b.prompt);
      // Put custom images at the end
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    for (const img of sortedImages) {
      if (!img.dataUrl || img.isLoading) continue;
      
      const link = document.createElement('a');
      link.href = img.dataUrl;
      link.download = getDownloadFilename(img.prompt);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay to prevent browser throttling/blocking multiple downloads
      await new Promise(r => setTimeout(r, 300));
      count++;
    }
    
    if (count === 0) {
      // Fallback if no images are ready
      alert("No images available to download yet.");
    }
  };

  const getImageLabel = (imgPrompt: string) => {
    const idx = prompts.indexOf(imgPrompt);
    if (idx === 0) return "Hero Image";
    if (idx > 0) return `Image #${idx + 1}`;
    return "Custom Image";
  };
  
  const generatedCount = prompts.filter(p => images.some(img => img.prompt === p)).length;
  const allGenerated = generatedCount === prompts.length && prompts.length > 0;

  // Render Logic
  const showGeneratePromptsButton = hasBlogContent && prompts.length === 0;

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-brand-600" />
          AI Visuals Studio
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Size: {imageSize} • Ratio: {aspectRatio}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Generate Prompts */}
        {showGeneratePromptsButton && (
           <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-4">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
               <FileText className="w-6 h-6 text-brand-500" />
             </div>
             <div>
               <h4 className="font-medium text-slate-900">Step 1: Create Prompts</h4>
               <p className="text-sm text-slate-500 mt-1">Analyze your blog to generate matching image descriptions.</p>
             </div>
             <Button 
               onClick={onGeneratePrompts} 
               isLoading={isGenerating}
               className="w-full"
             >
               Generate Prompts
             </Button>
           </div>
        )}

        {/* Step 2: Gallery & Controls */}
        {!showGeneratePromptsButton && prompts.length > 0 && (
           <>
            {/* Existing Images */}
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Gallery</h4>
                   <Button 
                     size="sm" 
                     variant="ghost" 
                     onClick={handleDownloadAll} 
                     className="h-6 text-xs px-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50" 
                     title="Download All Generated Images"
                   >
                     <Archive className="w-3 h-3 mr-1" /> Save All
                   </Button>
                </div>
                <div className="space-y-6">
                  {images.map((img) => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                      <div className="absolute top-2 left-2 z-10">
                         <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/90 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                           {getImageLabel(img.prompt)}
                         </span>
                      </div>
                      {img.isLoading ? (
                        <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-400">
                          <ImagePlus className="w-8 h-8 animate-pulse mb-2 opacity-50" />
                          <span className="text-xs font-medium">Creating visual...</span>
                        </div>
                      ) : (
                        <>
                          <img src={img.dataUrl} alt={img.prompt} className="w-full h-auto object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a 
                              href={img.dataUrl} 
                              download={getDownloadFilename(img.prompt)}
                              className="p-2 bg-white rounded-full text-slate-900 hover:bg-brand-50 transition-colors"
                              title={`Download ${getDownloadFilename(img.prompt)}`}
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </>
                      )}
                      <div className="p-3 bg-white border-t border-slate-100">
                        <p className="text-xs text-slate-600 line-clamp-2" title={img.prompt}>{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Prompts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Prompts</h4>
                <div className="flex gap-1">
                   <Button 
                    size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={downloadPrompts} title="Download Prompts as .txt"
                   >
                     <FileText className="w-3 h-3" />
                   </Button>
                   {!allGenerated && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-xs h-6 px-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                      onClick={onGenerateAll}
                      disabled={isGenerating}
                    >
                      <Layers className="w-3 h-3 mr-1" />
                      Generate All
                    </Button>
                  )}
                </div>
              </div>
              
              {prompts.map((prompt, idx) => {
                const isGenerated = images.some(img => img.prompt === prompt);
                return (
                  <div key={idx} className={`p-3 rounded-lg border transition-colors ${isGenerated ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100 hover:border-brand-200'}`}>
                    <div className="mb-2 flex items-center gap-2">
                       <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isGenerated ? 'bg-green-100 text-green-700' : 'bg-brand-50 text-brand-600'}`}>
                         {idx === 0 ? "Hero Image" : `Image #${idx + 1}`}
                       </span>
                       {isGenerated && <span className="text-[10px] text-green-600 font-medium ml-auto">Generated ✓</span>}
                    </div>
                    <p className="text-xs text-slate-700 mb-2 italic line-clamp-3">"{prompt}"</p>
                    {!isGenerated && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs h-8"
                        onClick={() => handleGenerate(prompt)}
                        disabled={isGenerating}
                      >
                        Generate This
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
           </>
        )}

        {/* Custom Prompt */}
        {(prompts.length > 0 || !hasBlogContent) && (
          <div className="space-y-3 pt-2">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Creation</h4>
             <div className="space-y-2">
               <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe an image you want to create..."
                className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:ring-brand-500 focus:border-brand-500 min-h-[80px] resize-y"
               />
               <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => {
                    if(customPrompt) {
                      handleGenerate(customPrompt);
                      setCustomPrompt("");
                    }
                  }}
                  disabled={!customPrompt || isGenerating}
                  icon={<Plus className="w-4 h-4" />}
               >
                 Generate Custom
               </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};