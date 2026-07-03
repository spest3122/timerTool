import { useState, useEffect, useRef } from "react";
import "./RecorderPage.css";

function getExtensionFromMimeType(mimeType) {
    if (!mimeType) return "webm";
    const lower = mimeType.toLowerCase();
    if (lower.includes("mp4") || lower.includes("m4a") || lower.includes("aac")) {
        return "m4a";
    }
    if (lower.includes("ogg")) {
        return "ogg";
    }
    if (lower.includes("webm")) {
        return "webm";
    }
    if (lower.includes("wav")) {
        return "wav";
    }
    return "webm";
}

function sanitizeFileName(name) {
    return name.replace(/[/\\?%*:|"<>]/g, "-");
}

function bufferToWav(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // raw PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
        result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
    } else {
        result = audioBuffer.getChannelData(0);
    }
    
    const buffer = new ArrayBuffer(44 + result.length * 2);
    const view = new DataView(buffer);
    
    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, 36 + result.length * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numOfChan, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, result.length * 2, true);
    
    floatTo16BitPCM(view, 44, result);
    
    return new Blob([view], { type: "audio/wav" });
}

function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export default function RecorderPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBlob, setCurrentBlob] = useState(null);
    const [isSaved, setIsSaved] = useState(true);
    const [statusText, setStatusText] = useState("Click 'Record' to start capturing your voice.");
    const [historyList, setHistoryList] = useState([]);
    
    // List playback states
    const [listPlayingId, setListPlayingId] = useState(null);
    const [listIsPlaying, setListIsPlaying] = useState(false);

    // Audio Refs for current recording/playback
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const audioSourceRef = useRef(null);
    const recordingSourceRef = useRef(null);
    const animationIdRef = useRef(null);
    const audioBufferRef = useRef(null);
    const startTimeRef = useRef(0);
    const pausedAtRef = useRef(0);
    const isPlayingRef = useRef(false);

    // Audio Refs for list playback
    const listAudioCtxRef = useRef(null);
    const listAudioSourceRef = useRef(null);
    const listAnalyserRef = useRef(null);
    const listPausedAtRef = useRef(0);
    const listStartTimeRef = useRef(0);
    const listAudioBufferRef = useRef(null);
    const listIsPlayingRef = useRef(false);
    const listPlayingIdRef = useRef(null);

    const canvasRef = useRef(null);
    const dbRef = useRef(null);
    const historyListRef = useRef([]);

    // Keep historyListRef up to date for cleanup URL revocation
    useEffect(() => {
        historyListRef.current = historyList;
    }, [historyList]);

    // Initialize IndexedDB and canvas resizing on mount
    useEffect(() => {
        let active = true;
        const request = indexedDB.open("AudioRecorderDB", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("recordings")) {
                db.createObjectStore("recordings", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = (e) => {
            if (!active) return;
            dbRef.current = e.target.result;
            loadHistoryFromDB();
        };

        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                clearCanvas();
            }
        };

        // Delay slightly to let the CSS display layout settle
        const timer = setTimeout(handleResize, 100);
        window.addEventListener("resize", handleResize);

        return () => {
            active = false;
            clearTimeout(timer);
            window.removeEventListener("resize", handleResize);

            // Cleanup active audio/recording streams
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try { mediaRecorderRef.current.stop(); } catch (e) {}
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); } catch (e) {}
            }
            if (listAudioSourceRef.current) {
                try { listAudioSourceRef.current.stop(); } catch (e) {}
            }
            if (audioCtxRef.current) {
                try { audioCtxRef.current.close(); } catch (e) {}
            }
            if (listAudioCtxRef.current) {
                try { listAudioCtxRef.current.close(); } catch (e) {}
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            // Revoke all created URLs to avoid memory leaks
            historyListRef.current.forEach((item) => {
                if (item.url) {
                    URL.revokeObjectURL(item.url);
                }
            });
        };
    }, []);

    const loadHistoryFromDB = () => {
        if (!dbRef.current) return;
        try {
            const transaction = dbRef.current.transaction(["recordings"], "readonly");
            const store = transaction.objectStore("recordings");
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                const list = getAllRequest.result;
                
                setHistoryList((prevList) => {
                    // Revoke old object URLs
                    prevList.forEach((item) => {
                        if (item.url) {
                            URL.revokeObjectURL(item.url);
                        }
                    });
                    
                    return list.map((item) => ({
                        ...item,
                        url: URL.createObjectURL(item.blob),
                    }));
                });
            };
        } catch (error) {
            console.error("Failed to load recordings from DB", error);
        }
    };

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
    };

    const handleRecordClick = async () => {
        initAudio();
        if (audioCtxRef.current.state === "suspended") {
            await audioCtxRef.current.resume();
        }

        if (!isRecording) {
            // Fully reset any active playbacks and disconnect speakers
            resetPlayback();
            stopListPlayback();
            audioChunksRef.current = [];

            // Disconnect speakers during recording to prevent feed bleed
            try {
                analyserRef.current.disconnect(audioCtxRef.current.destination);
            } catch (e) {}

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;
                mediaRecorderRef.current = new MediaRecorder(stream);

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
                    const nativeBlob = new Blob(audioChunksRef.current, { type: mimeType });

                    // Stop tracks inside onstop to let MediaRecorder finish clean encoding
                    if (mediaStreamRef.current) {
                        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                        mediaStreamRef.current = null;
                    }

                    try {
                        const arrayBuffer = await nativeBlob.arrayBuffer();
                        const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
                        audioBufferRef.current = decodedBuffer;
                        
                        // Convert decoded AudioBuffer to standard WAV Blob
                        const wavBlob = bufferToWav(decodedBuffer);
                        setCurrentBlob(wavBlob);
                        setIsSaved(false);

                        setStatusText('Recording ended! You can play it or click "Save Recording".');
                    } catch (err) {
                        console.error("Audio decoding or WAV encoding error", err);
                        setStatusText("Error: Could not decode or process recorded audio.");
                        setCurrentBlob(null);
                        setIsSaved(true);
                    }
                };

                recordingSourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
                recordingSourceRef.current.connect(analyserRef.current);

                mediaRecorderRef.current.start();
                setIsRecording(true);
                setStatusText("Recording...");

                drawVisualizer(analyserRef.current);
            } catch (err) {
                console.error(err);
                setStatusText("Error: Microphone access denied or failed.");
            }
        } else {
            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);

            if (recordingSourceRef.current) {
                recordingSourceRef.current.disconnect();
            }

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            clearCanvas();
        }
    };

    const playCurrent = async () => {
        if (isPlaying) return;
        stopListPlayback();

        initAudio();
        if (audioCtxRef.current.state === "suspended") {
            await audioCtxRef.current.resume();
        }

        if (!audioBufferRef.current) return;

        audioSourceRef.current = audioCtxRef.current.createBufferSource();
        audioSourceRef.current.buffer = audioBufferRef.current;
        audioSourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);

        startTimeRef.current = audioCtxRef.current.currentTime - pausedAtRef.current;
        audioSourceRef.current.start(0, pausedAtRef.current);
        
        isPlayingRef.current = true;
        setIsPlaying(true);
        setStatusText("Playing current recording...");

        drawVisualizer(analyserRef.current);

        audioSourceRef.current.onended = () => {
            if (isPlayingRef.current) {
                resetPlayback();
                setStatusText("Playback finished.");
            }
        };
    };

    const pauseCurrent = () => {
        if (!isPlayingRef.current) return;
        pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
        
        isPlayingRef.current = false;
        setIsPlaying(false);

        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {}
        }
        
        setStatusText("Paused.");
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
    };

    const resetPlayback = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        pausedAtRef.current = 0;
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {}
        }
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
        clearCanvas();
    };

    const saveRecording = () => {
        if (!currentBlob || !dbRef.current) return;

        const timestamp = new Date().toLocaleString();
        const newRecord = {
            blob: currentBlob,
            name: `Track ${timestamp}`,
            date: timestamp,
        };

        try {
            const transaction = dbRef.current.transaction(["recordings"], "readwrite");
            const store = transaction.objectStore("recordings");
            const addRequest = store.add(newRecord);

            addRequest.onsuccess = () => {
                setStatusText("Saved successfully! Added to history list.");
                setIsSaved(true);
                loadHistoryFromDB();
            };
        } catch (error) {
            console.error("Error saving recording", error);
            setStatusText("Error: Failed to save recording.");
        }
    };

    const playListItem = async (id) => {
        if (listPlayingIdRef.current === id && listIsPlayingRef.current) return;

        if (listPlayingIdRef.current !== id) {
            stopListPlayback();
            listPlayingIdRef.current = id;
            setListPlayingId(id);
            listPausedAtRef.current = 0;
        }

        resetPlayback();

        if (!listAudioCtxRef.current) {
            listAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            listAnalyserRef.current = listAudioCtxRef.current.createAnalyser();
            listAnalyserRef.current.fftSize = 256;
        }
        if (listAudioCtxRef.current.state === "suspended") {
            await listAudioCtxRef.current.resume();
        }

        try {
            const transaction = dbRef.current.transaction(["recordings"], "readonly");
            const store = transaction.objectStore("recordings");
            const getRequest = store.get(id);

            getRequest.onsuccess = async () => {
                const item = getRequest.result;
                if (!item) return;

                if (listPausedAtRef.current === 0 || !listAudioBufferRef.current) {
                    const arrayBuffer = await item.blob.arrayBuffer();
                    listAudioBufferRef.current = await listAudioCtxRef.current.decodeAudioData(arrayBuffer);
                }

                listAudioSourceRef.current = listAudioCtxRef.current.createBufferSource();
                listAudioSourceRef.current.buffer = listAudioBufferRef.current;
                listAudioSourceRef.current.connect(listAnalyserRef.current);
                listAnalyserRef.current.connect(listAudioCtxRef.current.destination);

                listStartTimeRef.current = listAudioCtxRef.current.currentTime - listPausedAtRef.current;
                listAudioSourceRef.current.start(0, listPausedAtRef.current);
                
                listIsPlayingRef.current = true;
                listPlayingIdRef.current = id;
                setListIsPlaying(true);
                setListPlayingId(id);

                drawVisualizer(listAnalyserRef.current);

                listAudioSourceRef.current.onended = () => {
                    if (listIsPlayingRef.current) {
                        stopListPlayback();
                    }
                };
            };
        } catch (error) {
            console.error("Error playing list item", error);
        }
    };

    const pauseListItem = (id) => {
        if (!listIsPlayingRef.current || listPlayingIdRef.current !== id) return;

        listPausedAtRef.current = listAudioCtxRef.current.currentTime - listStartTimeRef.current;
        if (listAudioSourceRef.current) {
            try {
                listAudioSourceRef.current.stop();
            } catch (e) {}
        }
        listIsPlayingRef.current = false;
        setListIsPlaying(false);
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
    };

    const stopListPlayback = () => {
        if (listAudioSourceRef.current && listIsPlayingRef.current) {
            try {
                listAudioSourceRef.current.stop();
            } catch (e) {}
        }
        listIsPlayingRef.current = false;
        listPlayingIdRef.current = null;
        setListIsPlaying(false);
        setListPlayingId(null);
        listPausedAtRef.current = 0;
        listAudioBufferRef.current = null;
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
        clearCanvas();
    };

    const deleteItem = (id) => {
        if (listPlayingIdRef.current === id) {
            stopListPlayback();
        }
        if (!dbRef.current) return;
        try {
            const transaction = dbRef.current.transaction(["recordings"], "readwrite");
            const store = transaction.objectStore("recordings");
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => {
                loadHistoryFromDB();
            };
        } catch (error) {
            console.error("Error deleting recording", error);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;
        canvasCtx.fillStyle = "#191926";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawVisualizer = (targetAnalyser) => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;

        const bufferLength = targetAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const maxBinToDisplay = 40; // Cuts off high-frequency line hiss

        const draw = () => {
            if (!isRecording && !isPlayingRef.current && !listIsPlayingRef.current) return;

            animationIdRef.current = requestAnimationFrame(draw);
            targetAnalyser.getByteFrequencyData(dataArray);

            // Check responsive dimensions
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }

            canvasCtx.fillStyle = "#191926";
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / maxBinToDisplay;
            let x = 0;

            for (let i = 0; i < maxBinToDisplay; i++) {
                const voiceBoost = 1 + 1.5 * (1 - i / maxBinToDisplay);
                let barHeight = (dataArray[i] / 1.3) * voiceBoost;

                if (barHeight > canvas.height) barHeight = canvas.height;

                // Color styling: smooth purple to teal gradient
                const r = Math.min(255, barHeight + 114 * (i / maxBinToDisplay));
                const g = Math.min(255, 46 * (i / maxBinToDisplay) + 150 * (1 - i / maxBinToDisplay));
                const b = Math.min(255, 209 * (i / maxBinToDisplay) + 230 * (1 - i / maxBinToDisplay));

                canvasCtx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);

                x += barWidth;
            }
        };
        draw();
    };

    return (
        <main className="recorder-page">
            <header className="recorder-header">
                <span className="recorder-title">🎙️ Audio Recording Lab</span>
            </header>

            <div className="recorder-layout">
                <div className="recorder-panel">
                    <h2>Voice Recorder</h2>

                    <div className="recorder-controls">
                        <button
                            id="recordBtn"
                            className={`recorder-btn btn-record ${isRecording ? "recording" : ""}`}
                            onClick={handleRecordClick}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            {isRecording ? "Stop" : "Record"}
                        </button>
                        <button
                            id="playBtn"
                            className="recorder-btn btn-play"
                            onClick={playCurrent}
                            disabled={isRecording || isPlaying || !currentBlob}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <polygon points="6,4 20,12 6,20" />
                            </svg>
                            Play
                        </button>
                        <button
                            id="pauseBtn"
                            className="recorder-btn btn-pause"
                            onClick={pauseCurrent}
                            disabled={!isPlaying}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="7" y1="4" x2="7" y2="20" />
                                <line x1="17" y1="4" x2="17" y2="20" />
                            </svg>
                            Pause
                        </button>
                        <button
                            id="saveBtn"
                            className="recorder-btn btn-save"
                            onClick={saveRecording}
                            disabled={isSaved || !currentBlob}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save Recording
                        </button>
                    </div>

                    <div className="recorder-visualizer-container">
                        <canvas ref={canvasRef} className="recorder-canvas" id="visualizer"></canvas>
                    </div>

                    <div className="recorder-status" id="statusText">
                        {statusText}
                    </div>
                </div>

                <div className="recorder-history-panel">
                    <h3>Recording History</h3>
                    {historyList.length === 0 ? (
                        <div id="emptyTip" className="recorder-empty-tip">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.5" />
                                <circle cx="12" cy="12" r="4" />
                                <line x1="12" y1="3" x2="12" y2="8" />
                                <line x1="12" y1="16" x2="12" y2="21" />
                            </svg>
                            <span>No recording history found.</span>
                        </div>
                    ) : (
                        <ul id="historyList" className="recorder-history-list">
                            {historyList.map((item) => (
                                <li key={item.id} className="recorder-history-item" id={`item-${item.id}`}>
                                    <div className="recorder-item-info">
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="recorder-item-actions">
                                        <button
                                            className="recorder-btn-sm recorder-btn-play-list"
                                            onClick={() => playListItem(item.id)}
                                            disabled={listPlayingId === item.id && listIsPlaying}
                                        >
                                            Play
                                        </button>
                                        <button
                                            className="recorder-btn-sm recorder-btn-pause-list"
                                            onClick={() => pauseListItem(item.id)}
                                            disabled={!(listPlayingId === item.id && listIsPlaying)}
                                        >
                                            Pause
                                        </button>
                                        <a
                                            className="recorder-btn-sm recorder-btn-download"
                                            href={item.url}
                                            download={`${sanitizeFileName(item.name)}.${getExtensionFromMimeType(item.blob?.type)}`}
                                        >
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download
                                        </a>
                                        <button
                                            className="recorder-btn-sm recorder-btn-delete"
                                            onClick={() => deleteItem(item.id)}
                                        >
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    );
}
