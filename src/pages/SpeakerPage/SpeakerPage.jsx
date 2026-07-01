import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "../../context/SettingsContext";
import "./SpeakerPage.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

const LANG_DEFAULTS = {
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
};

function buildLinesFromText(rawText) {
    return rawText.split("\n").map((s) => s.trim());
}

function renderHighlightedText(text, remarks) {
    let displayText = text;
    if (text.endsWith("\n")) {
        displayText = text + " ";
    }
    if (!remarks || remarks.length === 0) return displayText;

    const sorted = [...remarks].sort((a, b) => a.start - b.start);
    const parts = [];
    let lastIndex = 0;
    for (const remark of sorted) {
        if (remark.start < lastIndex) continue;
        if (remark.start > displayText.length) break;
        parts.push(displayText.substring(lastIndex, remark.start));
        const highlightedText = displayText.substring(
            remark.start,
            Math.min(remark.end, displayText.length),
        );
        parts.push(
            <mark key={remark.start} className="spk-remark-highlight">
                {highlightedText}
            </mark>,
        );
        lastIndex = remark.end;
    }
    if (lastIndex < displayText.length) {
        parts.push(displayText.substring(lastIndex));
    }
    return parts;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpeakerPage() {
    // ── Shared settings (language & voice synced with SettingsDrawer) ──────────
    const { language, filteredVoices, selectedVoiceIndex, setSelectedVoiceIndex } = useSettings();

    const [speed, setSpeed] = useState(1.0);
    const [textContent, setTextContent] = useState("");
    const [isLooping, setIsLooping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [lastSpokenLine, setLastSpokenLine] = useState("");
    const [remarks, setRemarks] = useState([]);

    // Mutable speech queue refs
    const textLinesRef = useRef([]);
    const currentLineIndexRef = useRef(0);
    const hasRepeatedRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const recognitionRef = useRef(null);
    // Tracks how many transcript lines have been inserted so far in a playback
    // session, so subsequent (3) markers know where to insert relative to the
    // live textarea content (which grows with each insertion).
    const insertionOffsetRef = useRef(0);
    const textareaRef = useRef(null);
    const backdropRef = useRef(null);
    const shouldScrollToBottomRef = useRef(false);
    const prevTextContentRef = useRef("");

    // ── Speech synthesis ───────────────────────────────────────────────────────
    const speakLine = useCallback(
        (text, onEnd) => {
            if (typeof speechSynthesis === "undefined" || !text) return;
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = speed;
            const idx = parseInt(selectedVoiceIndex, 10);
            const selectedVoice = !isNaN(idx) && filteredVoices[idx] ? filteredVoices[idx] : null;
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            } else {
                utterance.lang = LANG_DEFAULTS[language] || "de-DE";
            }
            utterance.onend = onEnd || null;
            setLastSpokenLine(text);
            speechSynthesis.speak(utterance);
        },
        [filteredVoices, selectedVoiceIndex, speed, language],
    );

    // ── 3-second listen-and-resume helper ─────────────────────────────────────
    // lineIdx: the 0-based index of the (3) line inside textLinesRef.current
    // (the original snapshot). insertionOffsetRef compensates for lines already
    // inserted by earlier (3) markers in this session.
    const listenForThreeSeconds = useCallback(
        (lineIdx, onDone) => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
                // No recognition support — just wait 3 s then continue
                setStatusMsg("🎙️ Listening 3 s…");
                setTimeout(onDone, 3000);
                return;
            }

            const rec = new SR();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = LANG_DEFAULTS[language] || "de-DE";

            let transcript = "";
            rec.onresult = (e) => {
                transcript = Array.from(e.results)
                    .map((r) => r[0].transcript)
                    .join(" ");
            };

            // Stop automatically after 3 seconds regardless of result
            const timer = setTimeout(() => {
                try {
                    rec.stop();
                } catch (_) {}
            }, 3000);

            rec.onend = () => {
                clearTimeout(timer);
                if (transcript) {
                    // Adjusted index accounts for lines already inserted earlier in
                    // this playback session so the insertion point stays accurate.
                    const adjustedIdx = lineIdx + insertionOffsetRef.current;
                    shouldScrollToBottomRef.current = true;
                    setTextContent((prev) => {
                        const lines = prev.split("\n");
                        lines.splice(adjustedIdx + 1, 0, transcript);
                        return lines.join("\n");
                    });
                    insertionOffsetRef.current += 1;
                }
                onDone();
            };
            rec.onerror = () => {
                clearTimeout(timer);
                onDone();
            };

            setStatusMsg("🎙️ Listening 3 s…");
            rec.start();
        },
        [language],
    );

    const speakNextLine = useCallback(() => {
        const lines = textLinesRef.current;
        if (!isSpeakingRef.current) return;

        if (currentLineIndexRef.current >= lines.length) {
            if (isLooping && lines.length > 0) {
                currentLineIndexRef.current = 0;
                hasRepeatedRef.current = false;
            } else {
                isSpeakingRef.current = false;
                setStatusMsg("Done!");
                return;
            }
        }

        const idx = currentLineIndexRef.current;
        const currentLine = lines[idx]?.trim();
        const nextLine = lines[idx + 1]?.trim();

        if (!currentLine || currentLine === "↺") {
            currentLineIndexRef.current++;
            speakNextLine();
            return;
        }

        // ── Handle (3): pause TTS, listen 3 s, insert transcript after marker ───
        if (currentLine === "(3)") {
            const capturedIdx = idx; // capture before incrementing
            currentLineIndexRef.current++;
            listenForThreeSeconds(capturedIdx, () => {
                if (!isSpeakingRef.current) return;
                speakNextLine();
            });
            return;
        }

        setStatusMsg(`Line ${idx + 1} / ${lines.length}`);

        speakLine(currentLine, () => {
            if (!isSpeakingRef.current) return;

            if (nextLine === "↺") {
                if (isLooping) {
                    speakNextLine();
                } else {
                    if (!hasRepeatedRef.current) {
                        hasRepeatedRef.current = true;
                        speakNextLine();
                    } else {
                        hasRepeatedRef.current = false;
                        currentLineIndexRef.current += 2;
                        speakNextLine();
                    }
                }
            } else {
                currentLineIndexRef.current++;
                speakNextLine();
            }
        });
    }, [speakLine, isLooping, listenForThreeSeconds]);

    const handleStartSpeaking = () => {
        const lines = buildLinesFromText(textContent);
        if (!lines.length) {
            setStatusMsg("⚠️ No text to speak.");
            return;
        }
        textLinesRef.current = lines;
        currentLineIndexRef.current = 0;
        hasRepeatedRef.current = false;
        isSpeakingRef.current = true;
        insertionOffsetRef.current = 0;
        speakNextLine();
    };

    const handlePause = () => {
        if (
            typeof speechSynthesis !== "undefined" &&
            speechSynthesis.speaking &&
            !speechSynthesis.paused
        ) {
            speechSynthesis.pause();
            setStatusMsg("Paused.");
        }
    };

    const handleResume = () => {
        if (typeof speechSynthesis !== "undefined" && speechSynthesis.paused) {
            speechSynthesis.resume();
            setStatusMsg("Resumed.");
        }
    };

    const handleStop = () => {
        isSpeakingRef.current = false;
        textLinesRef.current = [];
        currentLineIndexRef.current = 0;
        hasRepeatedRef.current = false;
        insertionOffsetRef.current = 0;
        if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
        setStatusMsg("Stopped.");
    };

    const handleInsertSymbol = (symbol) => {
        const input = document.getElementById("textInput");
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const current = textContent;
        const before = current.substring(0, start);
        const after = current.substring(end);
        const injection = before.endsWith("\n") || before === "" ? `${symbol}\n` : `\n${symbol}\n`;
        setTextContent(before + injection + after);
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + injection.length, start + injection.length);
        }, 0);
    };

    // ── Speech recognition ─────────────────────────────────────────────────────
    const toggleListening = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setStatusMsg("⚠️ Speech recognition not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setStatusMsg("Recognition stopped.");
            return;
        }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = LANG_DEFAULTS[language] || "de-DE";
        recognition.onresult = (e) => {
            // Only take the latest result segment, not all accumulated results
            const latestResult = e.results[e.results.length - 1];
            if (!latestResult?.isFinal) return;
            const transcript = latestResult[0].transcript.trim();
            if (transcript) {
                shouldScrollToBottomRef.current = true;
                setTextContent((prev) => (prev ? prev + "\n" + transcript : transcript));
            }
        };
        recognition.onerror = () => {
            setIsListening(false);
            setStatusMsg("Recognition error.");
        };
        recognition.onend = () => {
            setIsListening(false);
        };
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setStatusMsg("🎙️ Listening…");
    };

    const handleHighlightSelection = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start === end) return;

        setRemarks((prev) => {
            const exactMatchIdx = prev.findIndex((r) => r.start === start && r.end === end);
            if (exactMatchIdx !== -1) {
                return prev.filter((_, i) => i !== exactMatchIdx);
            }
            const filtered = prev.filter((r) => r.end <= start || r.start >= end);
            return [...filtered, { start, end }];
        });
    };

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Shift and filter remarks when textContent changes
    useEffect(() => {
        const oldValue = prevTextContentRef.current;
        const newValue = textContent;
        prevTextContentRef.current = newValue;

        if (oldValue === newValue) return;

        setRemarks((prev) => {
            if (prev.length === 0) return prev;

            let startDiff = 0;
            while (
                startDiff < oldValue.length &&
                startDiff < newValue.length &&
                oldValue[startDiff] === newValue[startDiff]
            ) {
                startDiff++;
            }

            let endDiffOld = oldValue.length - 1;
            let endDiffNew = newValue.length - 1;
            while (
                endDiffOld >= startDiff &&
                endDiffNew >= startDiff &&
                oldValue[endDiffOld] === newValue[endDiffNew]
            ) {
                endDiffOld--;
                endDiffNew--;
            }

            const diffLen = endDiffNew - startDiff + 1 - (endDiffOld - startDiff + 1);

            if (diffLen === 0) return prev;

            return prev
                .map((remark) => {
                    let { start, end } = remark;
                    if (startDiff <= start) {
                        start = Math.max(startDiff, start + diffLen);
                        end = Math.max(startDiff, end + diffLen);
                    } else if (startDiff < end) {
                        end = Math.max(startDiff, end + diffLen);
                    }
                    return { start, end };
                })
                .filter((remark) => remark.start < remark.end);
        });
    }, [textContent]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
            recognitionRef.current?.stop();
        };
    }, []);

    // Scroll to bottom of textarea when speech recognition inserts new text
    useEffect(() => {
        if (shouldScrollToBottomRef.current && textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
            if (backdropRef.current) {
                backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            }
            shouldScrollToBottomRef.current = false;
        }
    }, [textContent]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <main className="speaker-main">
            <div className="speaker-wrapper">
                <div className="speaker-body">
                    {/* Left: Text area */}
                    <div className="speaker-text-area-card">
                        <div className="spk-textarea-container">
                            <div ref={backdropRef} className="spk-textarea-backdrop">
                                {renderHighlightedText(textContent, remarks)}
                            </div>
                            <textarea
                                id="textInput"
                                ref={textareaRef}
                                className="spk-textarea"
                                placeholder="Type something here, or tap 'Start Listening' on the right to dictate text..."
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                onScroll={handleScroll}
                            />
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="speaker-controls">
                        {/* Language & Voice info banner (read from shared settings) */}
                        <div className="spk-field spk-settings-info">
                            <span className="spk-settings-info-label">🌐 Language</span>
                            <span className="spk-settings-info-value">
                                {{ de: "Deutsch (German)", en: "English", es: "Español (Spanish)" }[
                                    language
                                ] || language}
                            </span>
                        </div>

                        <button
                            id="recognitionBtn"
                            className={`spk-btn spk-btn-listen ${isListening ? "spk-btn-danger" : "spk-btn-primary"}`}
                            onClick={toggleListening}
                        >
                            {isListening ? "⬛ Stop Listening" : "🎙️ Start Listening (Microphone)"}
                        </button>

                        {/* Voice — synced with Settings drawer */}
                        <div className="spk-field">
                            <label htmlFor="spkVoiceSelect">Output Voice</label>
                            <select
                                id="spkVoiceSelect"
                                value={selectedVoiceIndex}
                                onChange={(e) => setSelectedVoiceIndex(e.target.value)}
                            >
                                <option value="">System default</option>
                                {filteredVoices.map((v, i) => (
                                    <option key={i} value={i}>
                                        {v.name} ({v.lang})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Settings Box */}
                        <div className="spk-settings-box">
                            <div className="spk-setting-row">
                                <span className="spk-setting-label">Loop Playback:</span>
                                <label className="spk-toggle">
                                    <input
                                        type="checkbox"
                                        checked={isLooping}
                                        onChange={(e) => setIsLooping(e.target.checked)}
                                    />
                                    <span className="spk-toggle-text">
                                        {isLooping ? "On" : "Off"}
                                    </span>
                                </label>
                            </div>

                            <div className="spk-setting-row">
                                <label htmlFor="spkSpeed" className="spk-setting-label">
                                    Reading Speed:
                                </label>
                                <input
                                    id="spkSpeed"
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="spk-slider"
                                />
                                <span className="spk-speed-value">{speed.toFixed(1)}x</span>
                            </div>

                            <div className="spk-action-icons">
                                <button
                                    className="spk-icon-btn"
                                    onClick={() => handleInsertSymbol("↺")}
                                    title="Insert repeat symbol"
                                >
                                    ↺
                                </button>
                                <button
                                    className="spk-icon-btn spk-icon-btn-listen"
                                    onClick={() => handleInsertSymbol("(3)")}
                                    title="Insert 3-second listen pause: pauses playback, records for 3 s, then resumes"
                                >
                                    (3)
                                </button>
                                <button
                                    id="highlightBtn"
                                    className="spk-icon-btn spk-icon-btn-highlight"
                                    onClick={handleHighlightSelection}
                                    title="Highlight selected text as a remark"
                                >
                                    🖍️
                                </button>
                                <button
                                    className="spk-icon-btn"
                                    onClick={() => {
                                        setTextContent("");
                                        setRemarks([]);
                                    }}
                                    title="Clear text"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        {/* Play/Control Action buttons */}
                        <button
                            id="startSpeakingBtn"
                            className="spk-btn spk-btn-success spk-play-btn"
                            onClick={handleStartSpeaking}
                        >
                            ▶ Play Text
                        </button>
                        <div className="spk-playback-controls">
                            <button
                                id="pauseBtn"
                                className="spk-btn spk-btn-warning"
                                onClick={handlePause}
                            >
                                Pause
                            </button>
                            <button
                                id="resumeBtn"
                                className="spk-btn spk-btn-info"
                                onClick={handleResume}
                            >
                                Resume
                            </button>
                            <button
                                id="stopSpeakingBtn"
                                className="spk-btn spk-btn-danger"
                                onClick={handleStop}
                            >
                                Stop
                            </button>
                        </div>

                        {/* Status */}
                        {statusMsg && (
                            <div className="spk-status" id="speakerStatus">
                                {statusMsg}
                            </div>
                        )}

                        {/* Last spoken line */}
                        {lastSpokenLine && (
                            <div className="spk-last-line">
                                <span className="spk-last-label">Last spoken:</span>
                                <span>{lastSpokenLine}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
