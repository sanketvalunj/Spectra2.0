'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { Upload, Eye, EyeOff, AlertTriangle, Fingerprint, ScanSearch } from 'lucide-react';
// @ts-ignore
import EXIF from 'exif-js';

export function VisualLieDetector() {
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [metadata, setMetadata] = useState<any>(null);
    const [riskAnalysis, setRiskAnalysis] = useState<{ score: number; reasons: string[] } | null>(null);


    const canvasRef = useRef<HTMLCanvasElement>(null);
    const heatmapRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            // 1. Reset State
            setMetadata(null);
            setShowHeatmap(false);
            setRiskAnalysis(null);

            // 2. Read Exif Metadata
            EXIF.getData(file as any, function (this: any) {
                const make = EXIF.getTag(this, "Make");
                const model = EXIF.getTag(this, "Model");
                const software = EXIF.getTag(this, "Software");
                const dateTime = EXIF.getTag(this, "DateTimeOriginal");

                let found = false;
                if (make || model || software || dateTime) {
                    found = true;
                    setMetadata({ found: true, make, model, software, dateTime });
                } else {
                    setMetadata({ found: false });
                }

                // 3. Calculate Global Risk Score (Heuristic)
                let score = 0;
                let reasons: string[] = [];

                if (found) {
                    // Metadata exists
                    if (software && (software.toLowerCase().includes("photoshop") || software.toLowerCase().includes("gimp"))) {
                        score += 30;
                        reasons.push(`Edit software trace detected: ${software}`);
                    } else {
                        reasons.push("Camera signature verified.");
                    }
                } else {
                    // No metadata
                    score += 40;
                    reasons.push("No camera metadata found (common in web files/AI).");
                }

                // File Type Check
                if (file.type === 'image/png') {
                    score += 10;
                    reasons.push("PNG format (less likely for raw photos).");
                }

                // Aspect Ratio Check (Deferred to onload)
                const tempImg = new Image();
                tempImg.src = URL.createObjectURL(file);
                tempImg.onload = () => {
                    const ratio = tempImg.width / tempImg.height;
                    const isSquare = ratio > 0.95 && ratio < 1.05;

                    // Resolution Check (AI often uses standard sizes)
                    const isStandardAI = (tempImg.width === 1024 && tempImg.height === 1024) || (tempImg.width === 512 && tempImg.height === 512);

                    if (isSquare && !found) {
                        score += 30;
                        reasons.push("Perfect square aspect ratio (AI typical).");
                    }
                    if (isStandardAI && !found) {
                        score += 20;
                        reasons.push("Standard generative AI resolution (1024px).");
                    }

                    setRiskAnalysis({
                        score: Math.min(score, 100),
                        reasons: reasons
                    });
                };
            });

            // 4. Read Image for Display
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const runELA = async () => {
        if (!image || !canvasRef.current || !heatmapRef.current) return;
        setAnalyzing(true);

        const img = new Image();
        img.src = image;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            const heatmapCanvas = heatmapRef.current!;
            const heatmapCtx = heatmapCanvas.getContext('2d')!;

            // 1. Set dimensions properly
            canvas.width = img.width;
            canvas.height = img.height;
            heatmapCanvas.width = img.width;
            heatmapCanvas.height = img.height;

            // 2. Clear canvases
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

            // 3. Draw original
            ctx.drawImage(img, 0, 0);

            // 4. ELA Algorithm
            const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Re-compress at lower quality (85% emphasizes artifacts better than 90%)
            const jpegQuality = 0.85;
            const compressedUrl = canvas.toDataURL('image/jpeg', jpegQuality);

            const compressedImg = new Image();
            compressedImg.src = compressedUrl;
            compressedImg.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                tempCtx.drawImage(compressedImg, 0, 0);

                const compressedData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                const heatmapData = heatmapCtx.createImageData(canvas.width, canvas.height);

                // Pass 1: Calculate raw differences and find max delta
                let maxDiff = 0;
                const rawDiffs = new Float32Array(originalData.data.length / 4);

                for (let i = 0; i < originalData.data.length; i += 4) {
                    const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
                    const gDiff = Math.abs(originalData.data[i + 1] - compressedData.data[i + 1]);
                    const bDiff = Math.abs(originalData.data[i + 2] - compressedData.data[i + 2]);
                    const avg = (rDiff + gDiff + bDiff) / 3;

                    rawDiffs[i / 4] = avg;
                    if (avg > maxDiff) maxDiff = avg;
                }

                if (maxDiff === 0) maxDiff = 1; // Avoid divide by zero

                // Pass 2: Normalize and Color
                for (let i = 0; i < originalData.data.length; i += 4) {
                    // Auto-Scale: Stretch the difference to fill 0-255 range
                    // This creates "Night Vision" effect where even subtle noise becomes visible
                    const normalized = (rawDiffs[i / 4] / maxDiff) * 255;

                    if (normalized < 40) {
                        // Low noise relative to max -> Dark Blue
                        heatmapData.data[i] = 0;
                        heatmapData.data[i + 1] = 0;
                        heatmapData.data[i + 2] = Math.max(20, normalized * 2);
                        heatmapData.data[i + 3] = 255;
                    } else if (normalized < 128) {
                        // Medium -> Purple/Red
                        heatmapData.data[i] = normalized * 2;
                        heatmapData.data[i + 1] = 0;
                        heatmapData.data[i + 2] = 255 - normalized;
                        heatmapData.data[i + 3] = 255;
                    } else {
                        // High (Edges/Edits) -> White/Yellow
                        heatmapData.data[i] = 255;
                        heatmapData.data[i + 1] = normalized;
                        heatmapData.data[i + 2] = normalized;
                        heatmapData.data[i + 3] = 255;
                    }
                }

                heatmapCtx.putImageData(heatmapData, 0, 0);
                setAnalyzing(false);
                setShowHeatmap(true);
            };
        };
    };

    return (
        <Card className="p-6 space-y-6 glass-card border border-primary/20">
            <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                    Visual Lie Detector <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono">BETA</span>
                </h3>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" /> Upload Image
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Viewport */}
                <div className="md:col-span-2 relative aspect-video bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                    {!image && (
                        <div className="text-center text-muted-foreground p-8">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="uppercase tracking-widest text-xs">Awaiting Evidence</p>
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-[500px] object-contain transition-opacity duration-500 ${image && !showHeatmap ? 'opacity-100' : 'opacity-0'} absolute inset-0 m-auto`}
                    />

                    <canvas
                        ref={heatmapRef}
                        className={`max-w-full max-h-[500px] object-contain mix-blend-screen transition-opacity duration-500 ${showHeatmap ? 'opacity-100' : 'opacity-0'} absolute inset-0 m-auto`}
                    />
                </div>

                {/* Forensics Panel */}
                <div className="space-y-4">
                    {riskAnalysis && (
                        <div className={`p-4 rounded-lg border ${riskAnalysis.score > 50 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <ScanSearch className={`w-5 h-5 ${riskAnalysis.score > 50 ? 'text-red-500' : 'text-green-500'}`} />
                                <h4 className="font-bold text-sm uppercase tracking-wider">File Integrity</h4>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1 font-mono">
                                        <span>Manipulation Probability</span>
                                        <span>{riskAnalysis.score}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${riskAnalysis.score > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${riskAnalysis.score}%` }}
                                        />
                                    </div>
                                </div>

                                <ul className="space-y-1">
                                    {riskAnalysis.reasons.map((reason, i) => (
                                        <li key={i} className="text-[10px] flex gap-2 text-muted-foreground">
                                            <span>•</span> {reason}
                                        </li>
                                    ))}
                                </ul>

                                {metadata?.found && (
                                    <div className="pt-2 mt-2 border-t border-white/10 text-xs font-mono text-green-400">
                                        Captured on {metadata.make} {metadata.model}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {image && (
                        <div className="p-4 bg-neutral-900/50 rounded-lg border border-white/5 space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider flex gap-2 items-center">
                                <Fingerprint className="w-4 h-4" /> Deep Scan
                            </h4>
                            <p className="text-[10px] text-muted-foreground">
                                Use ELA Heatmap to find <strong>specific spliced</strong> areas or inserted objects.
                            </p>
                            <Button
                                className="w-full"
                                variant={showHeatmap ? "secondary" : "default"}
                                onClick={() => setShowHeatmap(!showHeatmap)}
                            >
                                {showHeatmap ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {showHeatmap ? 'Hide Heatmap' : 'Reveal Artifacts'}
                            </Button>



                            {!analyzing && !showHeatmap && (
                                <Button onClick={runELA} variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                                    Run Deep Scan
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-neutral-950 p-6 rounded-xl border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                        <ScanSearch className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm tracking-wide">Analysis Guide</h4>
                        <p className="text-[10px] text-neutral-400">Reference for interpreting scan results</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Risk Score Legend */}
                    <div>
                        <div className="relative h-4 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-600 shadow-inner mb-2">
                            {/* Tick marks */}
                            <div className="absolute inset-y-0 left-[25%] w-px bg-black/10" />
                            <div className="absolute inset-y-0 left-[50%] w-px bg-black/10" />
                            <div className="absolute inset-y-0 left-[75%] w-px bg-black/10" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <span className="text-emerald-500 font-bold">Authentic</span>
                            <span className="text-rose-500 font-bold">Fake / AI</span>
                        </div>
                    </div>

                    {/* ELA Heatmap Legend */}
                    <div>
                        <div className="h-4 w-full rounded-full bg-gradient-to-r from-blue-950 via-purple-600 to-white shadow-inner mb-2 border border-black/10" />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-950 border border-white/20"></span>
                                Original
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white border border-black/20"></span>
                                Spliced / Modified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Practical Tip */}
                <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-4">
                    <div className="shrink-0 pt-0.5">
                        <ScanSearch className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <strong className="text-blue-500 text-xs font-bold uppercase tracking-wide block">How to spot fakes</strong>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Look for <span className="text-foreground font-bold bg-white/10 px-1 rounded">Bright White Glow</span> around specific people or objects. If the background is dark blue but a person is glowing white, they were added to the image.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
