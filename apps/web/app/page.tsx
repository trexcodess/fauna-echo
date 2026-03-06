"use client"

import React, { useState, useEffect, useRef, WheelEvent, MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import { User, Pet, AppStep } from './types/agency';

interface ExtendedPet extends Pet {
    bounty?: string;
    timestamp?: string;
    intelTags?: string[];
    coordinates?: string;
}

interface AIPetResponse {
    id?: string | number;
    name?: string;
    bounty?: string;
    coordinates?: string;
    'mock coordinates'?: string;
    timestamp?: string;
    'mock timestamp'?: string;
    intelTags?: string[];
    [key: string]: unknown;
}

export default function App() {
    // Core Constants & State
    // Archive State
    const [archivedPets, setArchivedPets] = useState<any[]>([]);
    const role = 'detective';
    const intelligenceBrief = "SECTOR 7: MULTIPLE CANINE SIGHTINGS REPORTED.\nRECOMMEND GAIT ANALYSIS FOR VERIFICATION.\nWEATHER: CLEAR.";
    const walletBalance = 142.25;

    const [step, setStep] = useState<AppStep>('auth');
    const [user, setUser] = useState<User | null>(null);
    
    // Auth State
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
    
    // Onboarding State
    const [onboardingStep, setOnboardingStep] = useState(0);
    const onboardingSlides = [
        { title: "WELCOME TO THE AGENCY", desc: "Fauna Echo is the world's first high-precision forensic pet recovery network. You are now a licensed Recovery Agent." },
        { title: "BIOMETRIC PRECISION", desc: "Our AI identifies unique Papillae patterns in pet nose prints—as accurate as human fingerprints. Use the HUD for macro-capture." },
        { title: "GAIT DNA", desc: "We track skeletal movement signatures (Gait) to verify sightings from distance. Calibration is key for 99.9% match rates." },
        { title: "THE MISSION", desc: "Scan, Verify, and Recover. Your payouts are delivered in SOL via our secure encrypted wallet immediately upon verification." }
    ];

    // Data State
    const [bounties, setBounties] = useState<ExtendedPet[]>([]);
    const [activeBounty, setActiveBounty] = useState<ExtendedPet | null>(null);
    const [forensicReport, setForensicReport] = useState<string>('');
    
    // HUD & Input State
    const [hudMode, setHudMode] = useState<'scan' | 'capture' | 'verify'>('scan');
    const [selectedSightingId, setSelectedSightingId] = useState<string | null>(null);
    const [hudNotification, setHudNotification] = useState<string | null>(null);
    const [chipError, setChipError] = useState<string | null>(null);
    const [petData, setPetData] = useState({
        name: '',
        microchip: '',
        nosePrint: null as string | null,
        geometry: '',
    });
  
    // Inspector/Telemetry State
    const [zoom, setZoom] = useState(1.5);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);

    // Refs
    const cursorRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initializations
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
            });
        }
    }, []);

  
    const triggerNotification = (msg: string) => {
        setHudNotification(msg);
        setTimeout(() => setHudNotification(null), 3000);
    };


    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Camera access denied:", err);
                // We use setHudNotification directly here so ESLint doesn't complain about missing dependencies
                setHudNotification("CAMERA LINK FAILED");
                setTimeout(() => setHudNotification(null), 3000);
            }
        };

        const stopCamera = () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };

        if (step === 'tactical_hud') {
            startCamera();
        } else {
            stopCamera();
        }
 
        return () => stopCamera();
    }, [step]); 

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPetData(prev => ({ ...prev, nosePrint: dataUrl }));
                triggerNotification("BIOMETRIC_CAPTURED");
            }
        }
    };

 

    const fetchBounties = async () => {
        setStep('processing');
        try {
            const prompt = `
                Generate 6 high-priority 'Missing Pet' sightings for a tactical detective app. 
                Return ONLY a JSON array of objects.
                Each object must include: 
                unique ID, name, bounty (string with $), location, description, risk (LOW/MED/HIGH), 
                mock timestamp (HH:MM:SS), mock coordinates (string "X:0-100, Y:0-100"), 
                and an array of 3 intelTags.
            `;

            // POST to NestJS backend, sending the prompt in the body
            const response = await fetch('http://localhost:3001/pets/bounties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error("Backend API Link Failed");
            }

            const data = await response.json();
            const responseText = data.result; // The raw string returned from Nvidia via NestJS

            // Your existing parsing logic remains exactly the same!
            const cleanedJson = responseText.replace(/```json|```/g, "").trim();
            const rawData = JSON.parse(cleanedJson) as AIPetResponse[];

            const validatedData: ExtendedPet[] = rawData.map((item) => {
                const bountyStr = typeof item.bounty === 'string' ? item.bounty : "$100";
                return {
                    ...item,
                    id: String(item.id || Math.random()),
                    coordinates: typeof item.coordinates === 'string' 
                        ? item.coordinates 
                        : (typeof item["mock coordinates"] === 'string' ? item["mock coordinates"] : "X:50, Y:50"), 
                    bounty: bountyStr, 
                    bountyAmount: parseFloat(bountyStr.replace('$', '')),
                    timestamp: typeof item.timestamp === 'string' 
                        ? item.timestamp 
                        : (typeof item["mock timestamp"] === 'string' ? item["mock timestamp"] : new Date().toLocaleTimeString()),
                    intelTags: Array.isArray(item.intelTags) ? item.intelTags : ["SIGHTING"],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as ExtendedPet;
            });

            setBounties(validatedData);
            setStep('search_grid');
        } catch (error: unknown) {
            console.error("Link Error:", error instanceof Error ? error.message : error);
            setStep('mission_control');
        }
    };

    const analyzeForensics = async () => {
        if (petData.microchip.length > 0 && petData.microchip.length !== 15) {
            setChipError("ISO CHIP REQUIRES 15 DIGITS");
            return;
        }
        setStep('processing');
        try {
            const prompt = `Perform a high-precision forensic identification report for ${activeBounty?.name || petData.name}. 
            Structure the output as: WHO, WHAT, WHERE, WHEN, HOW. 
            Analyze the provided image for unique markings or gait anomalies. Be concise, clinical, and forensic.`;

            // POST to NestJS backend, sending prompt, image, and data to save
            const response = await fetch('http://localhost:3001/pets/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt, 
                    imageData: petData.nosePrint || undefined,
                    petData: {
                        id: activeBounty?.id,
                        name: activeBounty?.name || petData.name,
                        microchip: petData.microchip,
                        geometry: petData.geometry
                    }
                }),
            });

            if (!response.ok) {
                throw new Error("Backend API Link Failed");
            }

            const data = await response.json();
            
            // Set the report returned from the backend
            setForensicReport(data.report);
            setStep('dashboard');
        } catch (error: unknown) {
            console.error("Forensic Error:", error instanceof Error ? error.message : error);
            setForensicReport("COSMOS_REASON_ERROR: Manual verification required. Baseline match 85% based on local telemetry.");
            setStep('dashboard');
        }
    };

        const fetchArchive = async () => {
        setStep('processing');
        try {
            // GET request to your NestJS backend to fetch all saved pets/images
            const response = await fetch('http://localhost:3001/pets/archive', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass the token if your route is protected
                    'Authorization': `Bearer ${localStorage.getItem('agent_token')}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to connect to Archive Database");
            }

            const data = await response.json();
            setArchivedPets(data);
            setStep('archive');
        } catch (error: unknown) {
            console.error("Archive Error:", error);
            triggerNotification("SECURE ARCHIVE LINK FAILED");
            setStep('mission_control');
        }
    };
    const handleAuth = async () => {
        setStep('processing'); // Show the cool loading circle
        try {
            // Decide if we are hitting the signin or signup URL
            const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/signin';
            
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the email, password, and name from your React state
                body: JSON.stringify({
                    email: authData.email,
                    password: authData.password,
                    name: authData.name || 'Agent X',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "AUTHENTICATION REJECTED");
            }

            const data = await response.json();
            
            // 1. Save the secure token to the browser so they stay logged in
            if (data.token) {
                localStorage.setItem('agent_token', data.token);
            }

            // 2. Set the real user data from your PostgreSQL database!
            setUser(data.user);
            
            // 3. Move to the next screen
            setStep('onboarding');
            
                } catch (error: any) {
            console.error("Auth Error:", error);
            
            // NestJS class-validator sometimes returns an array of error messages.
            // Let's grab the first one to show the user!
            let errorMsg = error.message;
            if (Array.isArray(errorMsg)) {
                errorMsg = errorMsg[0]; 
            }
            
            // Triggers the red HUD alert! e.g., "PASSWORD MUST BE LONGER THAN OR EQUAL TO 9 CHARACTERS"
            triggerNotification(String(errorMsg).toUpperCase());
            
            setStep('auth'); 
        }
    };

    const handleZoom = (e: WheelEvent) => {
        const delta = e.deltaY * -0.005;
        setZoom(prev => Math.min(Math.max(1, prev + delta), 8));
    };

    const handlePanStart = (e: ReactMouseEvent) => {
        setIsPanning(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handlePanMove = (e: ReactMouseEvent) => {
        if (!isPanning) return;
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handlePanEnd = () => setIsPanning(false);

    const renderAuth = () => (
        <div className="step-container auth-panel">
            <div className="corner-deco"></div>
            <p className="mono highlight"> FAUNA ECHO AGENCY</p>
            <h1>{authMode === 'signin' ? 'AGENT LOGIN' : 'JOIN AGENCY'}</h1>
            <div className="auth-inputs">
                {authMode === 'signup' && (
                    <input type="text" placeholder="FULL NAME" className="hud-input mono" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
                )}
                <input type="email" placeholder="AGENT EMAIL" className="hud-input mono" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
                <input type="password" placeholder="PASSWORD" className="hud-input mono" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
                 <button className="cta-main mono" onClick={handleAuth}>
                    {authMode === 'signin' ? 'AUTHORIZE ACCESS' : 'INITIALIZE AGENT ID'}
                </button>
            </div>
            <p className="auth-toggle mono" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                {authMode === 'signin' ? "NEED ENROLLMENT? CLICK HERE" : "ALREADY ENROLLED? ACCESS PORTAL"}
            </p>
        </div>
    );

    const renderOnboarding = () => (
        <div className="step-container onboarding-panel">
            <div className="onboarding-content">
                <div className="onboarding-graphic">
                    <div className={`onboarding-icon step-${onboardingStep}`}></div>
                    <div className="scan-line"></div>
                </div>
                <div className="onboarding-text">
                    <p className="mono highlight"> {onboardingStep + 1} CALIBRATION</p>
                    <h2>{onboardingSlides[onboardingStep]?.title || "LOADING_MODULE..."}</h2>
                    <p className="desc">{onboardingSlides[onboardingStep]?.desc || "Synchronizing intelligence..."}</p>
                </div>
            </div>
            <div className="onboarding-footer">
                <div className="progress-dots">
                    {onboardingSlides.map((_, i) => <div key={i} className={`dot ${onboardingStep === i ? 'active' : ''}`}></div>)}
                </div>
                <button className="cta-main mono" onClick={() => {
                    if (onboardingStep < onboardingSlides.length - 1) setOnboardingStep(onboardingStep + 1);
                    else setStep('mission_control');
                }}>
                    {onboardingStep < onboardingSlides.length - 1 ? 'NEXT CALIBRATION' : 'INITIALIZE MISSION CONTROL'}
                </button>
            </div>
        </div>
    );

    const renderMissionControl = () => (
        <div className="step-container extra-wide mission-control">
            <div className="dashboard-header">
                <div className="welcome-box">
                    <p className="mono highlight">WELCOME AGENT, {user?.name?.toUpperCase()?.replace(' ', ' ')}</p>
                    <h1>MISSION CONTROL</h1>
                </div>
                <div className="stat-grid">
                    <div className="stat-item"><span className="mono dim">PET BOUNTIES COLLECTED</span><span className="val">04</span></div>
                    <div className="stat-item"><span className="mono dim">AGENCY RANK</span><span className="val highlight">SILVER ECHO</span></div>
                    <div className="stat-item"><span className="mono dim">BALANCE</span><span className="val highlight">${walletBalance.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="dashboard-grid-main">
                <div className="main-actions">
                        <div className="action-card" onClick={fetchArchive}>
        <div className="icon">📂</div>
        <h3>BIOMETRIC ARCHIVE</h3>
        <p className="mono dim">Access secure agency forensic database of recovered targets.</p>
    </div>
                    <div className="action-card" onClick={fetchBounties}>
                        <div className="icon">🛰️</div>
                        <h3>INITIALIZE SEARCH </h3>
                        <p className="mono dim">Connect to real-time neighbor sighting streams.</p>
                    </div>
                    <div className="action-card" onClick={() => { setActiveBounty(null); setStep('tactical_hud'); }}>
                        <div className="icon">📸</div>
                        <h3>BIO SCAN ANIMAL</h3>
                        <p className="mono dim">Identify a pet in front of you using the forensic HUD.</p>
                    </div>
                </div>
                <div className="recent-activity glass-pane">
                    <div className="pane-header mono highlight">RECENT AGENCY OPERATIONS</div>
                    <div className="activity-list mono">
                        <div className="activity-item"><span>+ 45.00 SOL</span><span>BOUNTY RECOVERY #821</span></div>
                        <div className="activity-item"><span>NEW SIGHTING</span><span>SECTOR 7 NORTH</span></div>
                        <div className="activity-item"><span>VERIFICATION</span><span>GAIT DNA CALIBRATED</span></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGrid = () => (
        <div className="step-container extra-wide grid-panel">
            <div className="mission-control-layout">
                <aside className="mission-sidebar">
                    <div className="glass-pane wallet-box">
                        <span className="mono dim">SOL WALLET ID: 0xEcho...</span>
                        <span className="balance highlight">${walletBalance.toFixed(2)}</span>
                    </div>
                    <div className="glass-pane intel-box">
                        <div className="pane-header mono highlight">GRID INTELLIGENCE BRIEF</div>
                        <div className="brief-content mono">
                            {intelligenceBrief.split('\n').map((l, i) => <p key={i}>{l}</p>)}
                        </div>
                    </div>
                    <div className="telemetry-box mono dim">
                        <div className="tel-row"><span>SECTOR LOAD</span><span className="highlight">MODERATE</span></div>
                        <div className="tel-row"><span>GRID SYNC</span><span className="highlight">ACTIVE</span></div>
                        <button className="abort-btn mono" onClick={() => setStep('mission_control')}>TERMINATE GRID</button>
                    </div>
                </aside>

                <section className="tactical-map-view">
                    <div className="map-frame">
                        <div className="grid-overlay"></div>
                        <div className="radar-ping"></div>
                        
                        {bounties.map((pet) => {
                            const coordsMatch = pet.coordinates?.match(/\d+/g);
                            const cx = coordsMatch ? coordsMatch[0] : "50";
                            const cy = coordsMatch ? coordsMatch[1] : "50";

                            return (
                                <div 
                                    key={pet.id} 
                                    className={`map-marker ${selectedSightingId === pet.id ? 'active' : ''}`}
                                    style={{ left: `${cx}%`, top: `${cy}%` }}
                                    onMouseEnter={() => setSelectedSightingId(pet.id)}
                                    // FIXED: Just set step, useEffect will handle camera
                                    onClick={() => { setActiveBounty(pet); setStep('tactical_hud'); }}
                                >
                                    <div className="marker-core"></div>
                                    <div className="marker-ripple"></div>
                                    {selectedSightingId === pet.id && (
                                        <div className="marker-label mono animate-slide-in">
                                            <div className="highlight">{pet.name}</div>
                                            <div>{pet.bounty?.includes('$') ? pet.bounty : `
$$
{pet.bounty}`}</div>
                                            <div className="dim text-xs">{new Date(pet.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="map-footer mono dim">VECTOR LOCK: ENABLED // GPS: {coords ? 'FIXED' : 'SEARCHING'}</div>
                    </div>
                </section>

                <aside className="sighting-feed">
                    <div className="pane-header mono highlight">SIGHTING INDEX</div>
                    <div className="feed-scroll">
                        {bounties.map((b) => (
                            <div 
                                key={b.id} 
                                className={`feed-item ${selectedSightingId === b.id ? 'active' : ''}`}
                                onMouseEnter={() => setSelectedSightingId(b.id)}
                                // FIXED: Just set step, useEffect will handle camera
                                onClick={() => { setActiveBounty(b); setStep('tactical_hud'); }}
                            >
                                <div className="item-meta mono">
                                    <span className="highlight">{b.bounty?.includes('$') ? b.bounty : `
$$
{b.bounty}`}</span>
                                    <span className="dim">{b.timestamp}</span>
                                </div>
                                <div className="item-name">{b.name}</div>
                                <div className="item-tags">
                                    {b.intelTags?.map((t: string, i: number) => (
                                        <span key={i} className="tag mono">[{t}]</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );

    const renderHud = () => (
        <div className="hud-container">
            <header className="hud-header">
                <div className="target-info">
                    <span className="mono highlight">TARGET: {activeBounty?.name || "UNIDENTIFIED"}</span>
                    <span className="mono dim">BOUNTY: {activeBounty?.bounty?.includes('$') ? activeBounty.bounty : `$${activeBounty?.bounty || "0"}`}</span>
                </div>
                <div className="hud-modes mono">
                    {(['scan', 'capture', 'verify'] as const).map(m => (
                        <button key={m} className={hudMode === m ? 'active' : ''} onClick={() => setHudMode(m)}>{m.toUpperCase()}</button>
                    ))}
                </div>
            </header>

            <div className="hud-body">
                <div className="viewfinder">
                    <video ref={videoRef} autoPlay playsInline muted />
                    <div className="hud-overlays">
                        <div className="corner c-tl"></div><div className="corner c-tr"></div>
                        <div className="corner c-bl"></div><div className="corner c-br"></div>
                        
                        {hudMode === 'scan' && (
                            <div className="overlay-scanline">
                                <div className="moving-line"></div>
                                <div className="scan-data mono">
                                    <span>GAIT FREQ: 1.15Hz</span>
                                    <span>CADENCE: STABLE</span>
                                </div>
                            </div>
                        )}
                        {hudMode === 'capture' && (
                            <div className="overlay-macro">
                                <div className="macro-target-guide">
                                    <div className="nose-outline"></div>
                                    <p className="mono guide-text highlight pulse">ALIGN NOSE PRINT HERE</p>
                                </div>
                                {petData.nosePrint && <div className="capture-preview"><Image alt="noseprint" src={petData.nosePrint} width={200} height={200} /></div>}
                            </div>
                        )}
                        {hudMode === 'verify' && (
                            <div className="overlay-rfid">
                                <div className="rfid-pulse"></div>
                                <div className="mono rfid-status">SEARCHING RFID...</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hud-controls">
                    <div className="glass-pane inputs-box">
                        <input type="text" placeholder="PET_NAME" className="hud-input mono" value={petData.name} onChange={e => setPetData({...petData, name: e.target.value})} />
                        <input type="text" placeholder="RFID_CHIP_15_DIGITS" className={`hud-input mono ${chipError ? 'error' : ''}`} value={petData.microchip} maxLength={15} onChange={handleChipInput} />
                        <textarea placeholder="PHYSICAL_ANOMALIES..." className="hud-input hud-area mono" value={petData.geometry} onChange={e => setPetData({...petData, geometry: e.target.value})} />
                    </div>
                    <div className="action-box">
                        {hudMode === 'capture' && <button className="hud-btn primary mono pulse" onClick={captureImage}>CAPTURE BIOMETRIC</button>}
                        <button className="hud-btn primary mono" onClick={() => { analyzeForensics(); }}>FINALIZE IDENTIFICATION</button>
                        <button className="hud-btn secondary mono" onClick={() => { setStep('mission_control'); }}>ABORT</button>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );

    const VideoAnalysisHUD = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a hidden video element to check the duration
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            if (videoElement.duration > 30) {
                setVideoError(`RESTRICTED: Video is ${Math.round(videoElement.duration)}s. Must be under 30 seconds.`);
                setVideoFile(null);
            } else {
                setVideoError(null);
                setVideoFile(file);
            }
        };
        
        // Load the file into the element to trigger the metadata check
        videoElement.src = URL.createObjectURL(file);
    };

    const submitVideo = async () => {
        if (!videoFile) return;
        setIsUploading(true);

        try {
            // Because it's a video, we MUST use FormData, not JSON!
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('prompt', 'Analyze this pet video for forensic gait anomalies.');

            const response = await fetch('http://localhost:3001/pets/analyze-video', {
                method: 'POST',
                // Note: Do NOT set 'Content-Type': 'application/json'. 
                // Browser will automatically set 'multipart/form-data' when using FormData!
                body: formData,
            });

            if (!response.ok) throw new Error('Video upload failed');
            const data = await response.json();
            
            console.log("FORENSIC VIDEO REPORT:", data.report);
            // Here you would setStep('dashboard') and show the report!

        } catch (error) {
            console.error(error);
            setVideoError("UPLOAD_FAILED: Check Neural Link.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="glass-pane video-upload-box">
            <div className="pane-header mono highlight">TACTICAL VIDEO UPLOAD</div>
            
            <div className="upload-controls" style={{ padding: '20px' }}>
                <p className="mono dim">ACCEPTED FORMATS: MP4, WEBM, MOV, AVI (MAX 30s)</p>
                
                <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" 
                    onChange={handleFileChange} 
                    className="hud-input mono"
                    style={{ marginBottom: '15px' }}
                />

                {videoError && <p className="mono" style={{ color: 'var(--neon-pink)' }}>[ ALERT: {videoError} ]</p>}

                {videoFile && !videoError && (
                    <div className="video-preview">
                        <p className="mono highlight">TARGET ACQUIRED: {videoFile.name}</p>
                        <button 
                            className="hud-btn primary mono pulse" 
                            onClick={submitVideo}
                            disabled={isUploading}
                        >
                            {isUploading ? 'UPLOADING...' : 'INITIALIZE VIDEO FORENSICS'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

    const renderDashboard = () => (
        <div className="dashboard-container">
            <div className="forensic-card printable">
                <div className="rainbow-border"></div>
                <header className="report-header">
                    <div className="badge mono highlight">VERIFIED IDENTITY</div>
                    <div className="report-title">
                        <h2>{activeBounty?.name || petData.name || "SUBJECT 001"}</h2>
                        <span className="mono dim">CLASS: CANINE // RFID: {petData.microchip || "UNSPECIFIED"}</span>
                    </div>
                    <div className="confidence-meter mono">
                        <small>MATCH ACCURACY</small>
                        <span className="val highlight">99.85%</span>
                    </div>
                </header>

                <div className="status-strip mono">
                    <div className="item"><span className="dot active"></span> NOSE SCAN</div>
                    <div className="item"><span className="dot active"></span> GAIT LOCK</div>
                    <div className="item"><span className="dot active"></span> GEOMETRY</div>
                    <div className="item"><span className="dot active"></span> GPS FIX</div>
                </div>

                <div className="biometric-visual-grid">
                    <div className="bio-pane">
                        <div className="pane-header mono">BIOMETRIC: NOSE PAPILLAE MAPPING</div>
                        <div className="pane-main inspector" onWheel={handleZoom} onMouseDown={handlePanStart} onMouseMove={handlePanMove} onMouseUp={handlePanEnd}>
                            <div className="macro-wrap" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                                {petData.nosePrint ? <Image alt="nose" src={petData.nosePrint} width={400} height={400} /> : <div className="placeholder mono">NO VISUAL DATA</div>}
                                <div className="feature-dots">
                                    {[...Array(8)].map((_, i) => <div key={i} className="f-dot" style={{ top: `${20+Math.random()*60}%`, left: `${20+Math.random()*60}%` }}></div>)}
                                </div>
                            </div>
                            <div className="crosshair"></div>
                            <div className="zoom-label mono">ZOOM: {zoom.toFixed(1)}X</div>
                        </div>
                    </div>

                    <div className="bio-pane">
                        <div className="pane-header mono">GAIT_ANALYSIS: CADENCE DNA</div>
                        <div className="pane-main dark-bg gait-graph">
                            <svg viewBox="0 0 200 100" className="gait-svg">
                                <path className="gait-fill" d="M0 60 Q 15 10, 30 60 T 60 60 T 90 60 T 120 60 T 150 60 T 180 60 T 210 60 V 100 H 0 Z" />
                                <path className="gait-line" d="M0 60 Q 15 10, 30 60 T 60 60 T 90 60 T 120 60 T 150 60 T 180 60 T 210 60" />
                                <circle cx="15" cy="10" r="2" fill="var(--neon-pink)" />
                                <circle cx="45" cy="10" r="2" fill="var(--neon-pink)" />
                            </svg>
                            <div className="gait-stats mono">
                                <div className="stat"><span>SYM</span><span className="highlight">0.99</span></div>
                                <div className="stat"><span>FRQ</span><span className="highlight">1.2Hz</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="forensic-report-text">
                    <div className="report-label mono highlight">OFFICIAL IDENTIFICATION BRIEF:</div>
                    <div className="document-text mono">
                        {forensicReport.split('\n').map((l, i) => (
                            <p key={i} className={l.includes(':') ? 'header-line' : ''}>{l}</p>
                        ))}
                    </div>
                </div>

                <div className="dash-actions hide-on-print">
                    <button className="dash-btn main-btn mono" onClick={() => window.print()}>EXPORT IDENTIFICATION CERTIFICATE</button>
                    <button className="dash-btn mono" onClick={() => setStep('mission_control')}>RETURN TO MISSION CONTROL</button>
                </div>
            </div>
        </div>
    );

    const handleChipInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setPetData(p => ({ ...p, microchip: val }));
        if (val.length > 0 && val.length < 15) setChipError("ISO_MIN_15");
        else setChipError(null);
    };

        const renderArchive = () => (
        <div className="step-container extra-wide dashboard-container">
            <div className="glass-pane" style={{ padding: '30px', minHeight: '80vh' }}>
                <div className="pane-header mono highlight" style={{ fontSize: '24px', marginBottom: '20px' }}>
                    SECURE BIOMETRIC ARCHIVE
                </div>
                <div className="mono dim" style={{ marginBottom: '30px' }}>
                    DIRECTORY OF ALL IDENTIFIED SUBJECTS AND CAPTURED FORENSIC DATA.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {archivedPets.length === 0 ? (
                        <div className="mono dim">NO RECORDS FOUND IN SECURE DATABASE.</div>
                    ) : (
                        archivedPets.map((pet, index) => (
                            <div key={index} className="action-card" style={{ cursor: 'default', textAlign: 'left' }}>
                                <div style={{ width: '100%', height: '200px', backgroundColor: '#000', border: '1px solid var(--neon-pink)', marginBottom: '15px', position: 'relative', overflow: 'hidden' }}>
                                    {pet.imageData || pet.nosePrint ? (
                                        <Image 
                                            src={pet.imageData || pet.nosePrint} 
                                            alt={pet.name || 'Subject'} 
                                            layout="fill" 
                                            objectFit="cover" 
                                            style={{ opacity: 0.8 }}
                                        />
                                    ) : (
                                        <div className="mono dim" style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                            [ NO VISUAL DATA ]
                                        </div>
                                    )}
                                </div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{pet.name || "SUBJECT UNKNOWN"}</h3>
                                <p className="mono dim" style={{ margin: '0', fontSize: '12px' }}>RFID: {pet.microchip || "UNREGISTERED"}</p>
                                <p className="mono highlight" style={{ margin: '5px 0 0 0', fontSize: '10px' }}>
                                    LOGGED: {new Date(pet.createdAt || Date.now()).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    className="hud-btn secondary mono" 
                    style={{ marginTop: '40px' }} 
                    onClick={() => setStep('mission_control')}
                >
                    RETURN TO MISSION CONTROL
                </button>
            </div>
        </div>
    );

    return (
        <div className="app-root">
            <div id="cursor" ref={cursorRef}></div>

            <nav className="hide-on-print">
                <div className="logo">FAUNA ECHO AGENCY</div>
                <div className="mono highlight">[ STATUS: {user ? 'AUTHORIZED' : 'LOCKED'} ] [ {step.toUpperCase()} ]</div>
            </nav>

            <main>
                {step === 'auth' && renderAuth()}
                {step === 'onboarding' && renderOnboarding()}
                {step === 'mission_control' && renderMissionControl()}
                {step === 'search_grid' && renderGrid()}
                {step === 'tactical_hud' && renderHud()}
                {step === 'dashboard' && renderDashboard()}
                {step === 'archive' && renderArchive()} 
                {step === 'processing' && (
                    <div className="step-container centered" style={{ textAlign: 'center' }}>
                        <div className="processing-circle"></div>
                        <p className="mono animate-pulse">EXTRACTING FORENSIC DATA...</p>
                    </div>
                )}
            </main>

            {/* Render hud notification at the bottom level to prevent unused var errors */}
            {hudNotification && (
                <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'rgba(0,0,0,0.85)', padding: '10px 20px', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)' }} className="mono highlight pulse">
                    [ ALERT: {hudNotification} ]
                </div>
            )}
        </div>
    );
}