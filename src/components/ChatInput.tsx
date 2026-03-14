import React, { useRef, useEffect, useState } from 'react';
import GenerateButton from './GenerateButton';
import FileUpload from '@/components/ui/file-upload';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Folder, Check, Bot, ChevronDown, Image as ImageIcon, File, Mic, Sparkles, Plus } from 'lucide-react';
import AI_Voice from './AI_Voice';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TypingEffect } from "@/components/TypingEffect";

const OPENAI_SVG = (
  <svg
    height="14"
    viewBox="0 0 256 260"
    width="14"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" fill="currentColor"/>
  </svg>
);

const ANMIX_LOGO = (
  <img
    src="/anmix-logo.png"
    alt="ANMIX"
    className="w-4 h-4 object-contain"
    draggable={false}
  />
);

const MODEL_ICONS: Record<string, React.ReactNode> = {
  "GPT-5-mini": OPENAI_SVG,
  "Gemini 3": (
    <svg height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-fill" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
          <stop offset="0%" stopColor="#1C7DFF" />
          <stop offset="52.021%" stopColor="#1C69FF" />
          <stop offset="100%" stopColor="#F0DCD6" />
        </linearGradient>
      </defs>
      <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gemini-fill)" />
    </svg>
  ),
  "ANMIX-V0.1 BEST": ANMIX_LOGO,
  "ANMIX-V0.5 CODING THINKING": ANMIX_LOGO,
  "ANMIX-PRO": ANMIX_LOGO,
  "ANMIX-GEN": ANMIX_LOGO,
  "ANMIX-HGEN": ANMIX_LOGO,
  "ANMIX-PRO-V2": ANMIX_LOGO,
  "ANMIX-VEA-0.1": ANMIX_LOGO,
};

const TEXT_MODELS = ["ANMIX-V0.1 BEST", "ANMIX-V0.5 CODING THINKING"];
const IMAGE_MODELS = [
  "ANMIX-PRO",
  "ANMIX-GEN",
  "ANMIX-HGEN",
  "ANMIX-PRO-V2",
];
const VIDEO_MODELS = ["ANMIX-VEA-0.1"];
const IMAGE_EDITOR_MODELS = ["ANMIX-HGEN", "ANMIX-PRO-V2"];
import { cn } from '@/lib/utils';
import { EyeCatchingButton_v2 } from '@/components/ui/eye-catching-button';
import GradientButton from "@/components/ui/gradient-button";

type VoiceButtonProps = {
  size?: number;
  onClick: () => void;
};

export const VoiceButton: React.FC<VoiceButtonProps> = ({ size = 32, onClick }) => {
  const barStyle = (height: number): React.CSSProperties => ({
    width: Math.max(3, size * 0.16),
    height: `${(height / 140) * size}px`,
    backgroundColor: "white",
    borderRadius: 10,
  });

  const barHeights = [32, 52, 70, 52, 32];

  return (
    <div
      className="relative overflow-hidden rounded-full group p-[1.5px] bg-[radial-gradient(circle_at_30%_0,#1d4ed8,transparent_55%),radial-gradient(circle_at_70%_120%,#38bdf8,transparent_55%)]"
      style={{ width: size + 6, height: size + 6 }}
    >
      <span className="pointer-events-none absolute inset-[-120%] bg-[conic-gradient(from_90deg_at_50%_50%,#1d4ed8_0%,#38bdf8_20%,#0ea5e9_40%,#020617_60%,#1d4ed8_100%)] opacity-70" />
      <button
        type="button"
        onClick={onClick}
        aria-label="Start voice input"
        className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-black shadow-[0_0_18px_rgba(56,189,248,0.6)]"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: size * 0.08,
          }}
        >
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              style={barStyle(h)}
              animate={{ scaleY: [0.7, 1.4, 0.8, 1.2, 1] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
};

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message?: string, previews?: any[]) => void;
  isGenerating: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  hasMessages: boolean;
  hideMarquee?: boolean;
  hidePlaceholder?: boolean;
  placeholderText?: string;
  onVoiceCall?: () => void;
  onImageMode?: () => void;
  apiKey?: string;
  mode?: "chat" | "image-gen" | "image-edit" | "image-enhance" | "video-gen";
  onPendingFilesChange?: (files: { url: string; name: string }[]) => void;
  /** When true, lock model selector to ANMIX-V0.1 BEST for voice-to-voice chat. */
  isVoiceMode?: boolean;
  onImageMarquee?: () => void;
  onEnhanceMarquee?: () => void;
  onTextVoiceMarquee?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  isGenerating, 
  selectedModel,
  onModelChange,
  hasMessages,
  hideMarquee,
  hidePlaceholder,
  placeholderText,
  onVoiceCall,
  onImageMode,
  apiKey,
  mode = "chat",
  onPendingFilesChange,
  isVoiceMode = false,
  onImageMarquee,
  onEnhanceMarquee,
  onTextVoiceMarquee,
}) => {
  const models = isVoiceMode
    ? ["ANMIX-V0.1 BEST"]
    : mode === "image-edit" || mode === "image-enhance"
      ? IMAGE_EDITOR_MODELS
      : mode === "image-gen"
        ? IMAGE_MODELS
        : mode === "video-gen"
          ? VIDEO_MODELS
          : TEXT_MODELS;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);

  useEffect(() => {
    if (mode === "image-edit" || mode === "image-enhance") {
      setShowFileUpload(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "image-edit" && mode !== "image-enhance" && mode !== "video-gen") return;
    onPendingFilesChange?.(pendingFiles.map((f) => ({ url: f.url || "", name: f.name || "" })));
    // onPendingFilesChange intentionally excluded from deps to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pendingFiles]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode === "image-enhance") return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (value.trim() || pendingFiles.length > 0)) {
        handleSendClick();
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const marqueeItems = [
    "Create an image",
    "Give me idea for holi",
    "Write a text for essay",
    "Enhance or upscale the photo",
    "Plan a trip",
    "Make text to voice",
    "Write a code for game"
  ];

  const handleMarqueeClick = (item: string) => {
    if (item.startsWith("Create an image")) {
      onImageMarquee?.();
      return;
    }
    if (item.startsWith("Enhance or upscale the photo")) {
      onEnhanceMarquee?.();
      return;
    }
    if (item.startsWith("Make text to voice")) {
      onTextVoiceMarquee?.();
      return;
    }
    onChange(item);
  };

  const handleSendClick = () => {
    const message = mode === "image-enhance" ? "" : value;
    onSend(message, pendingFiles);
    setPendingFiles([]);
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col items-center w-full relative z-10 select-none">
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap gap-2 mb-4 w-full"
          >
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="relative group bg-[#161C2C] border border-white/10 rounded-xl p-1.5 pr-7 flex items-center gap-2 max-w-[260px]">
                {file.type === 'image' ? (
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    {file.url ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={14} />
                    )}
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <File size={14} />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-100 truncate font-medium">
                    {file.name}
                  </span>
                  {"size" in file && file.size && (
                    <span className="text-[9px] text-slate-400 truncate">
                      {file.size}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
        
        {showVoice && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-[#161C2C]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-4"
          >
            <AI_Voice 
              apiKey={apiKey} 
              onTranscription={(text) => {
                onChange(value + (value ? " " : "") + text);
                setShowVoice(false);
              }} 
            />
            <div 
              onClick={() => setShowVoice(false)}
              className="absolute top-3 right-3 cursor-pointer"
            >
              <GradientButton
                label="Close"
                variant="orange"
                className="h-8 text-[11px] px-3"
              />
            </div>
          </motion.div>
        )}

        {showFileUpload && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-[110%] z-[1000] w-full max-w-sm"
          >
            <div className="relative">
              <button 
                onClick={() => setShowFileUpload(false)}
                className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={14} />
              </button>
                <FileUpload 
                  onUploadSuccess={(file) => {
                    if (!file.type.startsWith("image/")) {
                      return;
                    }

                    const fileUrl = URL.createObjectURL(file);
                    
                    setPendingFiles(prev => [...prev, {
                      type: "image",
                      name: file.name,
                      size: formatBytes(file.size),
                      desc: `Uploaded via FileUpload`,
                      url: fileUrl,
                      file,
                    }]);
                    setShowFileUpload(false);
                  }}
                  className="shadow-2xl"
                />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasMessages && !hideMarquee && (
        <div className="flex gap-4 mb-4 w-full overflow-hidden mask-marquee">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex gap-4 shrink-0"
          >
              {marqueeItems.concat(marqueeItems).map((item, i) => (
                <EyeCatchingButton_v2
                  key={i}
                  onClick={() => handleMarqueeClick(item)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap dark:border-white/10 active:scale-95"
                >
                  {item}
                </EyeCatchingButton_v2>
              ))}

          </motion.div>
        </div>
      )}

      {/* Border beam animate - white beam like New Chat button */}
      <div className="relative w-full max-w-full group rounded-[18px] sm:rounded-[26px] overflow-hidden p-[2px] shadow border border-white/[0.08] dark:border-zinc-800">
        <span className="pointer-events-none absolute inset-[-1000%] z-0 animate-[spin_5s_linear_infinite_reverse] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#fff_0%,#09090B_7%)] bg-[conic-gradient(from_90deg_at_50%_50%,#000_0%,#fff_5%)] group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="relative w-full bg-[#101624] dark:bg-zinc-900/95 backdrop-blur-xl rounded-[16px] sm:rounded-[24px] overflow-hidden shadow-2xl transition-all focus-within:ring-1 focus-within:ring-white/20 z-10 border-0">
          <div className="absolute -top-[9rem] -left-[6rem] w-[15rem] h-[15rem] bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-focus-within:left-1/2 group-focus-within:-translate-x-1/2 transition-all duration-700" />
          
          <div className="relative flex flex-col p-1.5 sm:p-3 z-10">
            <div className="relative min-h-[32px] sm:min-h-[44px]">
              {mode !== "image-enhance" ? (
                <>
                  {!value && !hidePlaceholder && (
                    <div className="absolute inset-0 pt-2 sm:pt-3 flex items-start pointer-events-none">
                      <TypingEffect
                        text={placeholderText || "Ask anything to anmix ai"}
                        className="text-[12px] sm:text-sm text-slate-500"
                      />
                    </div>
                  )}
                  <textarea 
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder=" "
                    rows={1}
                    className="w-full min-h-[36px] sm:min-h-[44px] max-h-[240px] sm:max-h-[300px] pt-2 sm:pt-3 pb-2 sm:pb-3 pl-0 pr-0 bg-transparent border-none outline-none text-white text-[13px] sm:text-sm resize-none relative z-10 scrollbar-thin scrollbar-thumb-white/10 placeholder:text-slate-500"
                    style={{ lineHeight: 1.5 }}
                  />
                </>
              ) : (
                <div className="pt-2 sm:pt-3 pb-2 sm:pb-3 text-[12px] sm:text-sm text-slate-400">
                  Upload an image to enhance with Anmix AI.
                </div>
              )}
            </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex gap-1.5 sm:gap-2 relative flex-1 min-w-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-full border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all text-[10px] sm:text-xs font-medium min-w-0 max-w-full flex-1 sm:flex-initial"
                      )}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedModel}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1"
                        >
                          <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center [&>img]:w-3 [&>img]:h-3 [&>svg]:w-3 [&>svg]:h-3">
                            {MODEL_ICONS[selectedModel]}
                          </span>
                          <span className="min-w-0 max-w-[140px] sm:max-w-[220px] truncate whitespace-nowrap text-left">
                            {selectedModel}
                          </span>
                          <ChevronDown size={10} className="opacity-50 shrink-0 sm:w-3 sm:h-3" />
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn(
                      "min-w-[14rem] z-[2000]",
                      "border-white/10 bg-[#0a0f1a] text-slate-200"
                    )}
                  >
                    {(mode === "chat" || mode === "image-gen" || mode === "video-gen") ? (
                      <div className="flex flex-col gap-1">
                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                          TEXT AI MODELS
                        </div>
                        {TEXT_MODELS.map((model) => (
                          <DropdownMenuItem
                            className="flex items-center justify-between gap-2 focus:bg-white/5 focus:text-white cursor-pointer"
                            key={model}
                            onSelect={() => onModelChange(model)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {MODEL_ICONS[model] || ANMIX_LOGO}
                              <span className="text-xs truncate max-w-[10rem]">{model}</span>
                            </div>
                            {selectedModel === model && (
                              <Check size={14} className="text-blue-500" />
                            )}
                          </DropdownMenuItem>
                        ))}

                        <div className="mt-1 mb-0.5 h-px bg-white/10" />

                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                          IMAGE MODELS
                        </div>
                        {IMAGE_MODELS.map((model) => (
                          <DropdownMenuItem
                            className="flex items-center justify-between gap-2 focus:bg-white/5 focus:text-white cursor-pointer"
                            key={model}
                            onSelect={() => onModelChange(model)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {MODEL_ICONS[model] || ANMIX_LOGO}
                              <span className="text-xs truncate max-w-[10rem]">{model}</span>
                            </div>
                            {selectedModel === model && (
                              <Check size={14} className="text-blue-500" />
                            )}
                          </DropdownMenuItem>
                        ))}

                        <div className="mt-1 mb-0.5 h-px bg-white/10" />

                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                          VIDEO GENERATION
                        </div>
                        {VIDEO_MODELS.map((model) => (
                          <DropdownMenuItem
                            className="flex items-center justify-between gap-2 focus:bg-white/5 focus:text-white cursor-pointer"
                            key={model}
                            onSelect={() => onModelChange(model)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {MODEL_ICONS[model] || ANMIX_LOGO}
                              <span className="text-xs truncate max-w-[10rem]">{model}</span>
                            </div>
                            {selectedModel === model && (
                              <Check size={14} className="text-blue-500" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      models.map((model) => (
                        <DropdownMenuItem
                          className="flex items-center justify-between gap-2 focus:bg-white/5 focus:text-white cursor-pointer"
                          key={model}
                          onSelect={() => onModelChange(model)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {MODEL_ICONS[model] || ANMIX_LOGO}
                            <span className="text-xs truncate max-w-[10rem]">{model}</span>
                          </div>
                          {selectedModel === model && (
                            <Check size={14} className="text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="mx-0.5 sm:mx-1 h-4 w-px bg-white/10 self-center shrink-0" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-8 h-8 min-w-[32px] min-h-[32px] rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition-all shrink-0 flex items-center justify-center shadow-[0_0_0_1px_rgba(15,23,42,0.6)]"
                      )}
                      aria-label="More input options"
                    >
                      <Plus size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn(
                      "min-w-[10rem] z-[2000] border-white/10 bg-[#0a0f1a] text-slate-200"
                    )}
                    align="start"
                    side="top"
                  >
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-xs"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowFileUpload(true);
                      }}
                    >
                      <Paperclip size={14} />
                      <span>Attach image</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-xs"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowVoice(!showVoice);
                      }}
                    >
                      <Mic size={14} />
                      <span>Voice input</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-xs"
                      onSelect={(e) => {
                        e.preventDefault();
                        onImageMode?.();
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>Image generation</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="scale-75 sm:scale-90 origin-right">
                    <GenerateButton 
                      onClick={handleSendClick}
                      disabled={(!value.trim() && pendingFiles.length === 0) || isGenerating}
                      isGenerating={isGenerating}
                    />
                  </div>
                </div>
          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mask-marquee {
          mask-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 1) 15%,
            rgba(0, 0, 0, 1) 85%,
            rgba(0, 0, 0, 0)
          );
        }
      `}</style>
    </div>
  );
};

export default ChatInput;
