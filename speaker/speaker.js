const synth = window.speechSynthesis;
const textInput = document.getElementById("text-input");
const voiceSelect = document.getElementById("voice-select");
const langSelect = document.getElementById("lang-select");
const speedSlider = document.getElementById("speed-slider");
const speedLabel = document.getElementById("speed-label");
const loopToggle = document.getElementById("loop-toggle");
const loopLabel = document.getElementById("loop-label");

const btnSpeak = document.getElementById("btn-speak");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnStop = document.getElementById("btn-stop");
const btnListen = document.getElementById("btn-listen");

let allVoices = [];
let isLooping = false;

// Filter available playback engines matching user input language choice
function populateVoiceList() {
    if (!synth) return;
    allVoices = synth.getVoices();
    voiceSelect.innerHTML = "";

    const selectedLangPrefix = langSelect.value;
    const filteredVoices = allVoices.filter((voice) => voice.lang.startsWith(selectedLangPrefix));

    if (filteredVoices.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No native voices found for language";
        voiceSelect.appendChild(option);
        return;
    }

    filteredVoices.forEach((voice) => {
        const option = document.createElement("option");
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.default) option.textContent += " -- DEFAULT";
        option.setAttribute("data-name", voice.name);
        voiceSelect.appendChild(option);
    });
}

if (synth) {
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }
}

// Changing primary language triggers an automatic UI voice-filtering refresh
langSelect.addEventListener("change", () => {
    populateVoiceList();
});

speedSlider.addEventListener("input", (e) => {
    speedLabel.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
});

loopToggle.addEventListener("change", (e) => {
    isLooping = e.target.checked;
    loopLabel.textContent = isLooping ? "On 🔁" : "Off";
});

function speakText(textToSpeak) {
    if (!synth || textToSpeak.trim() === "") return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedOption = voiceSelect.selectedOptions[0]?.getAttribute("data-name");
    const selectedVoice = allVoices.find((voice) => voice.name === selectedOption);

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = parseFloat(speedSlider.value);

    utterance.onend = function () {
        if (isLooping) speakText(textToSpeak);
    };

    synth.speak(utterance);
}

btnSpeak.addEventListener("click", () => {
    synth.cancel();
    speakText(textInput.value);
});
btnPause.addEventListener("click", () => {
    if (synth.speaking && !synth.paused) synth.pause();
});
btnResume.addEventListener("click", () => {
    if (synth.speaking && synth.paused) synth.resume();
});
btnStop.addEventListener("click", () => {
    synth.cancel();
});

// --- SPEECH RECOGNITION (DICTATION) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    let isListening = false;

    btnListen.addEventListener("click", () => {
        if (!isListening) {
            let fullLocale = "en-US";
            if (langSelect.value === "de") fullLocale = "de-DE";
            if (langSelect.value === "es") fullLocale = "es-ES";

            recognition.lang = fullLocale;
            recognition.start();
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        isListening = true;
        btnListen.textContent = "🛑 Listening... Speak Now";
        btnListen.classList.add("listening");
    };

    recognition.onend = () => {
        isListening = false;
        btnListen.textContent = "🎙️ Start Listening (Microphone)";
        btnListen.classList.remove("listening");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (textInput.value.trim() === "") {
            textInput.value = transcript;
        } else {
            textInput.value += " " + transcript;
        }
    };

    recognition.onerror = (event) => {
        console.error(event.error);
        if (event.error === "not-allowed") {
            alert("Microphone access blocked. Please adjust browser settings.");
        }
    };
} else {
    btnListen.disabled = true;
    btnListen.textContent = "🎙️ Speech Recognition Not Supported";
}
