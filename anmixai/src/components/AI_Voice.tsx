"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceProps {
  onTranscription?: (text: string) => void;
}

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "";

export default function AI_Voice({ onTranscription }: AIVoiceProps) {
    const [submitted, setSubmitted] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (submitted) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [submitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleTranscribe(audioBlob);
            };

            mediaRecorder.start();
            setSubmitted(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setSubmitted(false);
        }
    };

    const handleTranscribe = async (blob: Blob) => {
        if (!DEEPGRAM_API_KEY) {
            console.error("Deepgram API key is missing. Set NEXT_PUBLIC_DEEPGRAM_API_KEY.");
            return;
        }
        setIsTranscribing(true);

        try {
            const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&language=hi", {
                method: "POST",
                headers: {
                    Authorization: `Token ${DEEPGRAM_API_KEY}`,
                    "Content-Type": "audio/webm",
                },
                body: blob,
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => "");
                console.error("Transcription failed:", response.status, errorText);
                throw new Error("Transcription failed");
            }

            const data = await response.json();
            const transcript: string | undefined =
                data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

            if (transcript && onTranscription) {
                onTranscription(transcript.trim());
            } else {
                console.error("Deepgram response did not contain transcript:", data);
            }
        } catch (error) {
            console.error("Transcription error:", error);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleClick = () => {
        if (submitted) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="w-full py-4">
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                <button
                    className={cn(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
                        submitted
                            ? "bg-none"
                            : "bg-none hover:bg-white/5"
                    )}
                    type="button"
                    onClick={handleClick}
                >
                    {submitted ? (
                        <div
                            className="w-6 h-6 rounded-sm animate-spin bg-white cursor-pointer pointer-events-auto shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            style={{ animationDuration: "3s" }}
                        />
                    ) : (
                        <Mic className="w-6 h-6 text-white/90" />
                    )}
                </button>

                <span
                    className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        submitted
                            ? "text-white/70"
                            : "text-white/30"
                    )}
                >
                    {formatTime(time)}
                </span>

                <div className="h-4 w-64 flex items-center justify-center gap-0.5">
                    {[...Array(48)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full transition-all duration-300",
                                submitted
                                    ? "bg-white/50 animate-pulse"
                                    : "bg-white/10 h-1"
                            )}
                            style={
                                submitted && isClient
                                    ? {
                                          height: `${20 + Math.random() * 80}%`,
                                          animationDelay: `${i * 0.05}s`,
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                <p className="h-4 text-xs text-white/70">
                    {isTranscribing ? "Transcribing..." : submitted ? "Listening..." : "Click to speak"}
                </p>
            </div>
        </div>
    );
}
