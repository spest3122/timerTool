import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecorderPage from "./RecorderPage";

describe("RecorderPage Component", () => {
    beforeEach(() => {
        // Mock IndexedDB
        global.indexedDB = {
            open: vi.fn().mockImplementation(() => {
                const request = {
                    onsuccess: null,
                    onupgradeneeded: null,
                };
                setTimeout(() => {
                    if (request.onsuccess) {
                        const event = {
                            target: {
                                result: {
                                    objectStoreNames: {
                                        contains: vi.fn().mockReturnValue(true),
                                    },
                                    transaction: vi.fn().mockReturnValue({
                                        objectStore: vi.fn().mockReturnValue({
                                            getAll: vi.fn().mockReturnValue({
                                                onsuccess: null,
                                            }),
                                            add: vi.fn().mockReturnValue({
                                                onsuccess: null,
                                            }),
                                        }),
                                    }),
                                },
                            },
                        };
                        request.onsuccess(event);
                    }
                }, 0);
                return request;
            }),
        };

        // Mock AudioContext
        const mockAnalyser = {
            fftSize: 256,
            frequencyBinCount: 128,
            getByteFrequencyData: vi.fn(),
            disconnect: vi.fn(),
            connect: vi.fn(),
        };

        const mockAudioContext = vi.fn().mockImplementation(() => ({
            state: "suspended",
            resume: vi.fn().mockResolvedValue(),
            close: vi.fn().mockResolvedValue(),
            createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
            createBufferSource: vi.fn().mockReturnValue({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
            }),
            createMediaStreamSource: vi.fn().mockReturnValue({
                connect: vi.fn(),
                disconnect: vi.fn(),
            }),
            decodeAudioData: vi.fn().mockResolvedValue({
                duration: 5,
            }),
            destination: {},
        }));

        global.AudioContext = mockAudioContext;
        global.webkitAudioContext = mockAudioContext;

        // Mock MediaRecorder
        global.MediaRecorder = vi.fn().mockImplementation(() => ({
            start: vi.fn(),
            stop: vi.fn(),
            state: "inactive",
        }));

        // Mock navigator.mediaDevices
        global.navigator.mediaDevices = {
            getUserMedia: vi.fn().mockResolvedValue({
                getTracks: vi.fn().mockReturnValue([
                    { stop: vi.fn() }
                ]),
            }),
        };

        // Mock URL
        global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test");
        global.URL.revokeObjectURL = vi.fn();
    });

    it("renders page header and main containers", () => {
        render(<RecorderPage />);
        expect(screen.getByText(/Audio Recording Lab/i)).toBeInTheDocument();
        expect(screen.getByText("Voice Recorder")).toBeInTheDocument();
        expect(screen.getByText("Recording History")).toBeInTheDocument();
    });

    it("has core control buttons initially disabled or enabled", () => {
        render(<RecorderPage />);
        const recordBtn = screen.getByRole("button", { name: "Record" });
        const playBtn = screen.getByRole("button", { name: "Play" });
        const pauseBtn = screen.getByRole("button", { name: "Pause" });
        const saveBtn = screen.getByRole("button", { name: "Save Recording" });

        expect(recordBtn).toBeEnabled();
        expect(playBtn).toBeDisabled();
        expect(pauseBtn).toBeDisabled();
        expect(saveBtn).toBeDisabled();
    });
});
