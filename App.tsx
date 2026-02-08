import React, { useState, useRef, useEffect } from 'react';
import { GeneratorConfig, AspectRatio, ImageSize, BlogPost, GeneratedImage, ApiConfig } from './types';
import { InputSection } from './components/InputSection';
import Editor, { EditorHandle } from './components/Editor';
import { ImagePanel } from './components/ImagePanel';
import { generateBlogContent, generateBlogImage, generateImagePromptsFromContent } from './services/geminiService';
import { ArrowLeft, ExternalLink, Download, FileText, Code, Copy, FileIcon, ChevronDown, Key, PenTool, Image as ImageIcon } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [view, setView] = useState<'input' | 'editor'>('input');
  const [mobileTab, setMobileTab] = useState<'editor' | 'images'>('editor');
  
  // Generation State
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Data State
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'gemini',
    apiKey: ''
  });

  const [config, setConfig] = useState<GeneratorConfig>({
    title: '',
    referenceContent: '',
    tone: 'Professional',
    targetAudience: 'General Public',
    imageSize: ImageSize.SIZE_1K,
    aspectRatio: AspectRatio.LANDSCAPE_16_9,
  });

  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Editor Ref for Exports
  const editorRef = useRef<EditorHandle>(null);

  // Load key from localStorage on mount (convenience)
  useEffect(() => {
    const savedKey = localStorage.getItem('blogGenius_apiKey');
    const savedProvider = localStorage.getItem('blogGenius_provider');
    if (savedKey) {
      setApiConfig(prev => ({
        ...prev,
        apiKey: savedKey,
        provider: (savedProvider as any) || 'gemini'
      }));
    }
  }, []);

  const handleApiConfigChange = (updates: Partial<ApiConfig>) => {
    setApiConfig(prev => {
      const newState = { ...prev, ...updates };
      // Save to localStorage for user convenience
      if (updates.apiKey !== undefined) localStorage.setItem('blogGenius_apiKey', updates.apiKey);
      if (updates.provider !== undefined) localStorage.setItem('blogGenius_provider', updates.provider);
      return newState;
    });
  };

  const handleGenerateBlog = async () => {
    if (!config.title || !config.referenceContent) return;
    if (!apiConfig.apiKey) {
      alert("Please enter your API Key in the settings section.");
      return;
    }

    setIsGeneratingBlog(true);
    try {
      // 1. Generate Text (No prompts yet)
      const post = await generateBlogContent(
        apiConfig,
        config.title,
        config.referenceContent,
        config.tone,
        config.targetAudience
      );
      setBlogPost(post);
      
      // 2. Switch View
      setView('editor');
    } catch (error: any) {
      console.error("Failed to generate blog:", error);
      alert(error.message || "Something went wrong while generating the blog. Please try again.");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!blogPost) return;
    
    setIsGeneratingImage(true); 
    try {
      // Extract content from editor
      const currentContent = editorRef.current?.getText() || blogPost.contentHtml;
      
      // Count unique image placeholders
      const matches = currentContent.match(/\[\[INSERT_IMAGE_\d+\]\]/g);
      const uniqueMarkers = matches ? [...new Set(matches)] : [];
      const count = uniqueMarkers.length;

      if (count === 0) {
        alert("No image placeholders (e.g., [[INSERT_IMAGE_1]]) found in the text. The AI won't generate prompts without them.");
        setIsGeneratingImage(false);
        return;
      }
      
      const prompts = await generateImagePromptsFromContent(apiConfig, currentContent, count);
      
      setBlogPost(prev => prev ? { ...prev, suggestedImagePrompts: prompts } : null);
      // Auto-switch to images tab on mobile when prompts are generated
      setMobileTab('images');
    } catch (error: any) {
      console.error("Failed to generate prompts:", error);
      alert(error.message || "Could not create image prompts. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    // Optimistic UI
    const tempId = Date.now().toString();
    const newImage: GeneratedImage = {
      id: tempId,
      prompt,
      dataUrl: '',
      isLoading: true
    };

    setGeneratedImages(prev => [newImage, ...prev]);
    setIsGeneratingImage(true);

    try {
      const dataUrl = await generateBlogImage(apiConfig, prompt, config.imageSize, config.aspectRatio);
      
      setGeneratedImages(prev => prev.map(img => 
        img.id === tempId ? { ...img, dataUrl, isLoading: false } : img
      ));
    } catch (error) {
      console.error("Failed to generate image:", error);
      setGeneratedImages(prev => prev.filter(img => img.id !== tempId));
      throw error; 
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!blogPost) return;
    if (apiConfig.provider === 'groq') {
      alert("Groq does not support image generation. Please switch to Gemini or OpenAI.");
      return;
    }

    const promptsToGenerate = blogPost.suggestedImagePrompts.filter(
      prompt => !generatedImages.some(img => img.prompt === prompt)
    );

    if (promptsToGenerate.length === 0) return;

    for (const prompt of promptsToGenerate) {
      try {
        await handleGenerateImage(prompt);
      } catch (e) {
        console.error(`Skipping image generation for prompt due to error.`);
      }
    }
  };

  const resetApp = () => {
    // Removed strict confirm to fix "Back button not working" complaints if prompt was blocking
    // or if users simply want to go back easily.
    if (generatedImages.length > 0 || blogPost) {
       if (!window.confirm("Go back to home? Unsaved changes will be lost.")) return;
    }
    setView('input');
    setBlogPost(null);
    setGeneratedImages([]);
    setMobileTab('editor');
  };

  // --- Export Functions ---
  
  const getProcessedHtml = () => {
    let content = editorRef.current?.getHTML();
    if (!content || !blogPost) return "";

    const contentText = editorRef.current?.getText() || "";
    const matches = contentText.match(/\[\[INSERT_IMAGE_\d+\]\]/g);
    const uniqueMarkers = matches ? [...new Set(matches)] : [];

    // Map prompts to markers sequentially
    if (generatedImages.length > 0 && blogPost.suggestedImagePrompts.length > 0) {
       uniqueMarkers.forEach((marker, index) => {
         const prompt = blogPost.suggestedImagePrompts[index];
         if (!prompt) return;

         const imgData = generatedImages.find(img => img.prompt === prompt);
         
         if (imgData && !imgData.isLoading && imgData.dataUrl) {
           const imgTag = `<figure style="margin: 20px 0; text-align: center;">
             <img src="${imgData.dataUrl}" alt="${prompt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
             <figcaption style="font-style: italic; color: #666; margin-top: 8px;">${prompt}</figcaption>
           </figure>`;
           content = content?.replaceAll(marker, imgTag);
         } else {
           const placeholderTag = `<div style="background: #f1f5f9; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; color: #64748b; margin: 20px 0; border-radius: 8px;">Image Placeholder: ${prompt}</div>`;
           content = content?.replaceAll(marker, placeholderTag);
         }
       });
    }

    return content || "";
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToHtml = () => {
    const content = getProcessedHtml();
    if (!content || !blogPost) return;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${blogPost.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; padding: 20px; color: #333; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #111; }
    h2 { font-size: 1.8em; margin-top: 1.5em; color: #222; }
    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    figure { margin: 2em 0; }
  </style>
</head>
<body>
  <h1>${blogPost.title}</h1>
  ${content}
</body>
</html>`;
    
    downloadFile(html, `${config.title.substring(0, 30)}.html`, 'text/html');
  };

  const exportToWord = () => {
    const content = getProcessedHtml();
    if (!content || !blogPost) return;
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${blogPost.title}</title>
      </head>
      <body>
        <h1>${blogPost.title}</h1>
        ${content}
      </body>
      </html>
    `;

    downloadFile(html, `${config.title.substring(0, 30)}.doc`, 'application/msword');
  };

  const exportToText = () => {
    const content = editorRef.current?.getText();
    if (!content || !blogPost) return;
    const fullText = `${blogPost.title}\n\n${content}`;
    downloadFile(fullText, `${config.title.substring(0, 30)}.txt`, 'text/plain');
  };

  const copyToClipboard = () => {
    const content = getProcessedHtml();
    if (!content) return;
    
    try {
      const blobHtml = new Blob([content], {type: "text/html"});
      const blobText = new Blob([editorRef.current?.getText() || ""], {type: "text/plain"});
      
      const data = [new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText
      })];
      navigator.clipboard.write(data).then(() => {
        alert("Formatted content with images copied!");
      });
    } catch (e) {
      alert("Browser security restricted copying rich text. Try exporting to HTML instead.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {view === 'input' && (
        <InputSection
          config={config}
          apiConfig={apiConfig}
          onApiConfigChange={handleApiConfigChange}
          onChange={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
          onGenerate={handleGenerateBlog}
          isGenerating={isGeneratingBlog}
        />
      )}

      {view === 'editor' && blogPost && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between shrink-0 z-20 shadow-sm gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={resetApp} className="text-slate-600 hover:text-slate-900 shrink-0 px-2 md:px-4">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Back</span>
              </Button>
              <h1 className="font-serif font-bold text-lg md:text-xl text-slate-800 truncate hidden md:block">
                {blogPost.title}
              </h1>
              
              {/* Mobile Tab Switcher */}
              <div className="flex md:hidden bg-slate-100 rounded-lg p-1 shrink-0">
                 <button 
                  onClick={() => setMobileTab('editor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mobileTab === 'editor' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   <PenTool className="w-3 h-3" /> Editor
                 </button>
                 <button 
                  onClick={() => setMobileTab('images')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mobileTab === 'images' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   <ImageIcon className="w-3 h-3" /> Visuals
                 </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-slate-600 hover:text-brand-600 hover:bg-white rounded transition-all" 
                  title="Copy for Docs (Rich Text)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  onClick={exportToWord}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-all" 
                  title="Export to Word (.doc)"
                >
                  <FileIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportToHtml}
                  className="p-2 text-slate-600 hover:text-orange-600 hover:bg-white rounded transition-all" 
                  title="Export to HTML"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>
              
              {/* Mobile Export Menu (Simple) */}
              <div className="sm:hidden">
                <Button size="sm" variant="ghost" onClick={copyToClipboard} className="px-2">
                   <Copy className="w-4 h-4" />
                </Button>
              </div>

              <span className="text-[10px] md:text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100 hidden md:block">
                {config.imageSize} • {config.aspectRatio}
              </span>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 flex overflow-hidden relative">
            {/* Editor Area */}
            <div className={`flex-1 bg-slate-50 overflow-hidden flex-col ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
              <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                 <Editor ref={editorRef} initialContent={blogPost.contentHtml} />
              </div>
            </div>

            {/* Side Panel (Visuals) */}
            <div className={`w-full md:w-80 shrink-0 border-l border-slate-200 bg-white shadow-xl z-10 ${mobileTab === 'images' ? 'flex h-full absolute inset-0 md:relative' : 'hidden md:flex'}`}>
              <ImagePanel
                images={generatedImages}
                prompts={blogPost.suggestedImagePrompts}
                onGeneratePrompts={handleGeneratePrompts}
                onGenerateImage={handleGenerateImage}
                onGenerateAll={handleGenerateAllImages}
                isGenerating={isGeneratingImage}
                imageSize={config.imageSize}
                aspectRatio={config.aspectRatio}
                hasBlogContent={true}
              />
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;