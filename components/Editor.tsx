import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Type, Heading1, Heading2, Quote } from 'lucide-react';

interface EditorProps {
  initialContent: string;
}

export interface EditorHandle {
  getHTML: () => string;
  getText: () => string;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ initialContent }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');

  useImperativeHandle(ref, () => ({
    getHTML: () => contentRef.current?.innerHTML || "",
    getText: () => contentRef.current?.innerText || ""
  }));

  useEffect(() => {
    if (contentRef.current && initialContent) {
      // Only set initial content if it's empty to prevent overwrite on re-renders
      if (contentRef.current.innerHTML === "") {
        contentRef.current.innerHTML = initialContent;
      }
    }
  }, [initialContent]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const ToolbarButton = ({ 
    cmd, 
    arg, 
    icon: Icon, 
    active = false 
  }: { 
    cmd: string; 
    arg?: string; 
    icon: React.ElementType; 
    active?: boolean 
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        execCmd(cmd, arg);
      }}
      className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${active ? 'bg-slate-200 text-slate-900' : ''}`}
      title={cmd}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-slate-100 bg-slate-50 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <select 
            className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 cursor-pointer font-medium"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as 'sans' | 'serif')}
          >
            <option value="sans">Sans Serif</option>
            <option value="serif">Serif</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <ToolbarButton cmd="formatBlock" arg="H1" icon={Heading1} />
          <ToolbarButton cmd="formatBlock" arg="H2" icon={Heading2} />
          <ToolbarButton cmd="formatBlock" arg="P" icon={Type} />
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <ToolbarButton cmd="bold" icon={Bold} />
          <ToolbarButton cmd="italic" icon={Italic} />
          <ToolbarButton cmd="underline" icon={Underline} />
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <ToolbarButton cmd="justifyLeft" icon={AlignLeft} />
          <ToolbarButton cmd="justifyCenter" icon={AlignCenter} />
          <ToolbarButton cmd="justifyRight" icon={AlignRight} />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton cmd="insertUnorderedList" icon={List} />
          <ToolbarButton cmd="insertOrderedList" icon={ListOrdered} />
          <ToolbarButton cmd="formatBlock" arg="BLOCKQUOTE" icon={Quote} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto bg-white cursor-text" onClick={() => contentRef.current?.focus()}>
        <div
          ref={contentRef}
          contentEditable
          className={`editor-content outline-none max-w-3xl mx-auto px-8 py-12 min-h-[800px] ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
          style={{ fontSize: '1.125rem' }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;