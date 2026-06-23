const center = 200;

const clock = document.getElementById("clock");
const hourHand = document.getElementById("hourHand");
const minuteHand = document.getElementById("minuteHand");
const langSelect = document.getElementById("langSelect");
const voiceSelect = document.getElementById("voiceSelect");
const voiceLabel = document.getElementById("voiceLabel");
const modeIndicator = document.getElementById("modeIndicator");
const numbersContainer = document.getElementById("numbers");

let totalMinutes = 19 * 60 + 40; // Default sample start 19:40
let lastMinuteAngle = null;
let liveMode = false;
let liveTimer = null;
let dragging = null;

// ── Week state ──
// dayIndex: 0=Monday … 6=Sunday (matches ISO weekday - 1)
let practiceWeekDay = 0; // used only in practice mode

const weekDayNames = {
    en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
};

const weekLabelText = {
    en: "WEEKDAY",
    de: "WOCHENTAG",
    es: "DÍA",
};

// ── Click sound via Web Audio API ──
let _audioCtx = null;
function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}
function playClickSound() {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.13);
    } catch (e) { /* audio not available */ }
}

// Returns today's 0-based Monday-anchored day index
function getTodayDayIndex() {
    const d = new Date().getDay(); // 0=Sun … 6=Sat
    return (d + 6) % 7;            // 0=Mon … 6=Sun
}

function renderWeek() {
    const nameEl  = document.getElementById("weekDayName");
    const labelEl = document.getElementById("weekLabel");
    if (!nameEl || !labelEl) return;

    const idx = liveMode ? getTodayDayIndex() : practiceWeekDay;
    const names = weekDayNames[currentLanguage] || weekDayNames.en;
    labelEl.textContent = weekLabelText[currentLanguage] || "WEEKDAY";

    // Brief flash animation
    nameEl.classList.add("flash");
    setTimeout(() => {
        nameEl.textContent = names[idx];
        nameEl.classList.remove("flash");
    }, 90);

    // Show/hide arrows based on mode
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) {
        if (liveMode) {
            infoPanel.classList.add("live-mode");
        } else {
            infoPanel.classList.remove("live-mode");
        }
    }
}

let filteredVoices = [];
let currentLanguage = localStorage.getItem("timerTool_language") || "de";

// Multi-lingual UI Dictionary Lookups
const uiTranslations = {
    de: {
        practice: "Modus: Übungsmodus",
        live: "Modus: Live-Uhr",
        voiceLabel: "Stimme auswählen",
        liveBtn: "Live Clock",
        practiceBtn: "Practice Mode",
    },
    en: {
        practice: "Mode: Practice Mode",
        live: "Mode: Live Clock",
        voiceLabel: "Select Voice",
        liveBtn: "Live Clock",
        practiceBtn: "Practice Mode",
    },
    es: {
        practice: "Modo: Modo de Práctica",
        live: "Modo: Reloj en Vivo",
        voiceLabel: "Seleccionar Voz",
        liveBtn: "Reloj en Vivo",
        practiceBtn: "Modo Práctica",
    },
};

const dialWordsMapping = {
    de: [
        "",
        "eins",
        "zwei",
        "drei",
        "vier",
        "fünf",
        "sechs",
        "sieben",
        "acht",
        "neun",
        "zehn",
        "elf",
        "zwölf",
    ],
    en: [
        "",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
    ],
    es: [
        "",
        "una",
        "dos",
        "tres",
        "cuatro",
        "cinco",
        "seis",
        "siete",
        "ocho",
        "nueve",
        "diez",
        "once",
        "doce",
    ],
};

const sectionsLabelMapping = {
    de: {
        official12: "Offiziell (12-Stunden-Format)",
        official24: "Offiziell (24-Stunden-Format)",
        informal: "Umgangssprachlich / Informell",
    },
    en: {
        official12: "Official (12-Hour Clock)",
        official24: "Official (24-Hour Clock)",
        informal: "Informal / Conversational",
    },
    es: {
        official12: "Oficial (Reloj de 12 Horas)",
        official24: "Oficial (Reloj de 24 Horas)",
        informal: "Coloquial / Informal",
    },
};

// Redraws numbers and translated text descriptors directly onto the analog layout face
function renderDialFace() {
    numbersContainer.innerHTML = "";
    const currentWords = dialWordsMapping[currentLanguage];

    for (let i = 1; i <= 12; i++) {
        const angle = ((i * 30 - 90) * Math.PI) / 180;
        const xNum = center + Math.cos(angle) * 155;
        const yNum = center + Math.sin(angle) * 155;
        const xWord = center + Math.cos(angle) * 128;
        const yWord = center + Math.sin(angle) * 128;

        const gGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const textNum = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textNum.setAttribute("x", xNum);
        textNum.setAttribute("y", yNum + 5);
        textNum.setAttribute("text-anchor", "middle");
        textNum.setAttribute("font-size", "18");
        textNum.setAttribute("font-weight", "bold");
        textNum.textContent = i;
        gGroup.appendChild(textNum);

        const textWord = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textWord.setAttribute("x", xWord);
        textWord.setAttribute("y", yWord + 4);
        textWord.setAttribute("text-anchor", "middle");
        textWord.setAttribute("font-size", "10");
        textWord.setAttribute("fill", "#555");
        textWord.textContent = currentWords[i];
        gGroup.appendChild(textWord);

        numbersContainer.appendChild(gGroup);
    }
}

// Filters system synthesized vocal engines relative to the active target language
function loadLocalizedVoices() {
    if (typeof speechSynthesis === "undefined") return;
    const allVoices = speechSynthesis.getVoices();

    filteredVoices = allVoices.filter(
        (voice) =>
            voice.lang.startsWith(currentLanguage + "-") ||
            voice.lang.toLowerCase() === currentLanguage,
    );

    voiceSelect.innerHTML = "";
    if (filteredVoices.length === 0) {
        const opt = document.createElement("option");
        opt.textContent = `No ${currentLanguage.toUpperCase()} voices found`;
        opt.value = "";
        voiceSelect.appendChild(opt);
        return;
    }

    filteredVoices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });

    // Restore saved voice for this language
    const savedVoice = localStorage.getItem(`timerTool_voice_${currentLanguage}`);
    if (savedVoice !== null && savedVoice < filteredVoices.length) {
        voiceSelect.value = savedVoice;
    }
}

// Shows the quiz button only when German is active
function updateQuizButtonVisibility() {
    const quizBtn = document.querySelector(".control-btns a[href='./quiz/']");
    if (!quizBtn) return;
    quizBtn.style.display = currentLanguage === "de" ? "" : "none";
}

// Native triggers adjusting labels instantly on drop-down changes
function handleLanguageChange() {
    currentLanguage = langSelect.value;
    localStorage.setItem("timerTool_language", currentLanguage);

    // Translate Text Labels
    voiceLabel.textContent = `${uiTranslations[currentLanguage].voiceLabel} (${currentLanguage.toUpperCase()} Voice)`;
    document.getElementById("liveModeBtn").textContent = uiTranslations[currentLanguage].liveBtn;
    document.getElementById("practiceModeBtn").textContent =
        uiTranslations[currentLanguage].practiceBtn;

    if (liveMode) {
        modeIndicator.textContent = uiTranslations[currentLanguage].live;
    } else {
        modeIndicator.textContent = uiTranslations[currentLanguage].practice;
    }

    renderDialFace();
    loadLocalizedVoices();
    updateQuizButtonVisibility();
    updateClock();
    renderWeek();
}

// Saves the selected voice index keyed by language whenever the user changes it
voiceSelect.addEventListener("change", () => {
    if (voiceSelect.value !== "") {
        localStorage.setItem(`timerTool_voice_${currentLanguage}`, voiceSelect.value);
    }
});

langSelect.addEventListener("change", handleLanguageChange);
if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadLocalizedVoices;
}

/* LANGUAGE TEXT MATRICES AND RULES ENGINES */

// 1. German Numbers Speller Engine
function germanHour(h) {
    const arr = [
        "null",
        "eins",
        "zwei",
        "drei",
        "vier",
        "fünf",
        "sechs",
        "sieben",
        "acht",
        "neun",
        "zehn",
        "elf",
        "zwölf",
        "dreizehn",
        "vierzehn",
        "fünfzehn",
        "sechzehn",
        "siebzehn",
        "achtzehn",
        "neunzehn",
        "zwanzig",
        "einundzwanzig",
        "zweiundzwanzig",
        "dreiundzwanzig",
    ];
    return arr[h] || h;
}
function germanMinuteSpelled(m) {
    if (m === 0) return "null";
    const ones = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
    const teens = [
        "zehn",
        "elf",
        "zwölf",
        "dreizehn",
        "vierzehn",
        "fünfzehn",
        "sechzehn",
        "siebzehn",
        "achtzehn",
        "neunzehn",
    ];
    const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig"];
    if (m < 10) return ones[m];
    if (m < 20) return teens[m - 10];
    return m % 10 === 0
        ? tens[Math.floor(m / 10)]
        : (m % 10 === 1 ? "ein" : ones[m % 10]) + "und" + tens[Math.floor(m / 10)];
}

// 2. English Numbers Speller Engine
function englishHour(h) {
    const arr = [
        "twelve",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
        "twenty",
        "twenty-one",
        "twenty-two",
        "twenty-three",
    ];
    return arr[h] || h;
}
function englishMinuteSpelled(m) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = [
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
    ];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty"];
    if (m < 10) return ones[m];
    if (m < 20) return teens[m - 10];
    return m % 10 === 0 ? tens[Math.floor(m / 10)] : tens[Math.floor(m / 10)] + "-" + ones[m % 10];
}

// 3. Spanish Numbers Speller Engine
function spanishHour(h, isInformal = false) {
    // Informal loops around 12, but has exceptional unique singular rules for index 1
    if (isInformal) {
        const target = h % 12 || 12;
        return target === 1
            ? "una"
            : [
                  "",
                  "",
                  "dos",
                  "tres",
                  "cuatro",
                  "cinco",
                  "seis",
                  "siete",
                  "ocho",
                  "nueve",
                  "diez",
                  "once",
                  "doce",
              ][target];
    }
    const arr = [
        "cero",
        "una",
        "dos",
        "tres",
        "cuatro",
        "cinco",
        "seis",
        "siete",
        "ocho",
        "nueve",
        "diez",
        "once",
        "doce",
        "trece",
        "catorce",
        "quince",
        "dieciséis",
        "diecisiete",
        "dieciocho",
        "diecinueve",
        "veinte",
        "veintiuno",
        "veintidós",
        "veintitrés",
    ];
    return arr[h] || h;
}
function spanishMinuteSpelled(m) {
    const ones = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const teens = [
        "diez",
        "once",
        "doce",
        "trece",
        "catorce",
        "quince",
        "dieciséis",
        "diecisiete",
        "dieciocho",
        "diecinueve",
    ];
    const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta"];
    if (m < 10) return ones[m];
    if (m < 20) return teens[m - 10];
    if (m < 30) return m === 20 ? "veinte" : "veinti" + ones[m % 10];
    return m % 10 === 0
        ? tens[Math.floor(m / 10)]
        : tens[Math.floor(m / 10)] + " y " + ones[m % 10];
}

// Master Sentence Translation Compiler Structure
function buildMultilingualTime(h, m) {
    const h12 = h % 12 || 12;
    const nextH12 = (h12 % 12) + 1;
    const categories = { official12: "", official24: "", informal: [] };

    if (currentLanguage === "de") {
        categories.official12 =
            `${germanHour(h12)} Uhr ${m === 0 ? "" : germanMinuteSpelled(m)}`.trim();
        categories.official24 =
            `${germanHour(h)} Uhr ${m === 0 ? "" : germanMinuteSpelled(m)}`.trim();
        if (m === 0) categories.informal.push(`${germanHour(h12)} Uhr`);
        else if (m === 15) categories.informal.push(`Viertel nach ${germanHour(h12)}`);
        else if (m === 45) categories.informal.push(`Viertel vor ${germanHour(nextH12)}`);
        else if (m === 30) categories.informal.push(`halb ${germanHour(nextH12)}`);
        else if (m < 30)
            categories.informal.push(
                `${m === 20 ? "zwanzig" : m === 10 ? "zehn" : germanMinuteSpelled(m)} nach ${germanHour(h12)}`,
            );
        else
            categories.informal.push(
                `${60 - m === 20 ? "zwanzig" : 60 - m === 10 ? "zehn" : germanMinuteSpelled(60 - m)} vor ${germanHour(nextH12)}`,
            );
    } else if (currentLanguage === "en") {
        const minWord = m < 10 ? "zero " + englishMinuteSpelled(m) : englishMinuteSpelled(m);
        categories.official12 = `${englishHour(h12)} ${m === 0 ? "o'clock" : minWord}`.trim();
        categories.official24 = `${englishHour(h)} ${m === 0 ? "hundred" : minWord}`.trim();
        if (m === 0) categories.informal.push(`${englishHour(h12)} o'clock`);
        else if (m === 15) categories.informal.push(`quarter past ${englishHour(h12)}`);
        else if (m === 30) categories.informal.push(`half past ${englishHour(h12)}`);
        else if (m === 45) categories.informal.push(`quarter to ${englishHour(nextH12)}`);
        else if (m < 30)
            categories.informal.push(`${englishMinuteSpelled(m)} past ${englishHour(h12)}`);
        else categories.informal.push(`${englishMinuteSpelled(60 - m)} to ${englishHour(nextH12)}`);
    } else if (currentLanguage === "es") {
        const prefix12 = h12 === 1 ? "Es la" : "Son las";
        const prefix24 = h === 1 ? "Es la" : "Son las";
        categories.official12 =
            `${prefix12} ${spanishHour(h12)} ${m === 0 ? "" : "y " + spanishMinuteSpelled(m)}`.trim();
        categories.official24 =
            `${prefix24} ${spanishHour(h)} ${m === 0 ? "" : "y " + spanishMinuteSpelled(m)}`.trim();

        const prefixInfCurrent = h12 === 1 ? "Es la" : "Son las";
        const prefixInfNext = nextH12 === 1 ? "Es la" : "Son las";
        if (m === 0)
            categories.informal.push(`${prefixInfCurrent} ${spanishHour(h12, true)} en punto`);
        else if (m === 15)
            categories.informal.push(`${prefixInfCurrent} ${spanishHour(h12, true)} y cuarto`);
        else if (m === 30)
            categories.informal.push(`${prefixInfCurrent} ${spanishHour(h12, true)} y media`);
        else if (m === 45)
            categories.informal.push(`${prefixInfNext} ${spanishHour(nextH12, true)} menos cuarto`);
        else if (m < 30)
            categories.informal.push(
                `${prefixInfCurrent} ${spanishHour(h12, true)} y ${spanishMinuteSpelled(m)}`,
            );
        else
            categories.informal.push(
                `${prefixInfNext} ${spanishHour(nextH12, true)} menos ${spanishMinuteSpelled(60 - m)}`,
            );
    }
    return categories;
}

function speak(text) {
    if (typeof speechSynthesis === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedIndex = voiceSelect.value;
    if (selectedIndex !== "" && filteredVoices[selectedIndex]) {
        utterance.voice = filteredVoices[selectedIndex];
        utterance.lang = filteredVoices[selectedIndex].lang;
    } else {
        utterance.lang =
            currentLanguage === "de" ? "de-DE" : currentLanguage === "en" ? "en-US" : "es-ES";
    }
    speechSynthesis.speak(utterance);
}

function createPhraseRow(text) {
    const div = document.createElement("div");
    div.className = "phrase";
    div.innerHTML = `<span>${text}</span><button>🔊</button>`;
    div.querySelector("button").addEventListener("click", () => speak(text));
    return div;
}

function renderPhrases(hour, minute) {
    const data = buildMultilingualTime(hour, minute);
    const container = document.getElementById("phrases");
    container.innerHTML = "";
    const labels = sectionsLabelMapping[currentLanguage];

    const title12 = document.createElement("div");
    title12.className = "phrase-section-title";
    title12.textContent = labels.official12;
    container.appendChild(title12);
    container.appendChild(createPhraseRow(data.official12));

    const title24 = document.createElement("div");
    title24.className = "phrase-section-title";
    title24.textContent = labels.official24;
    container.appendChild(title24);
    container.appendChild(createPhraseRow(data.official24));

    if (data.informal.length > 0) {
        const titleInf = document.createElement("div");
        titleInf.className = "phrase-section-title";
        titleInf.textContent = labels.informal;
        container.appendChild(titleInf);
        data.informal.forEach((text) => container.appendChild(createPhraseRow(text)));
    }
}

function updateClock() {
    const displayHour24 = Math.floor(totalMinutes / 60) % 24;
    const displayHour12 = displayHour24 % 12 || 12;
    const displayMinute = totalMinutes % 60;

    const hourAngle = (displayHour12 % 12) * 30 + displayMinute * 0.5;
    const minuteAngle = displayMinute * 6;

    setHand(hourHand, 90, hourAngle);
    setHand(minuteHand, 130, minuteAngle);

    document.getElementById("digitalTime").textContent =
        `${String(displayHour24).padStart(2, "0")}:${String(displayMinute).padStart(2, "0")}`;

    renderPhrases(displayHour24, displayMinute);
}

function setHand(hand, length, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    const x = center + Math.cos(rad) * length;
    const y = center + Math.sin(rad) * length;
    hand.setAttribute("x2", x);
    hand.setAttribute("y2", y);
}

function getEventXAndY(e, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left - center,
            y: e.touches[0].clientY - rect.top - center,
        };
    }
    return { x: e.clientX - rect.left - center, y: e.clientY - rect.top - center };
}

function startDrag(type) {
    dragging = type;
}
hourHand.addEventListener("mousedown", () => startDrag("hour"));
minuteHand.addEventListener("mousedown", () => startDrag("minute"));
hourHand.addEventListener(
    "touchstart",
    (e) => {
        e.preventDefault();
        startDrag("hour");
    },
    { passive: false },
);
minuteHand.addEventListener(
    "touchstart",
    (e) => {
        e.preventDefault();
        startDrag("minute");
    },
    { passive: false },
);

function endDrag() {
    dragging = null;
    lastMinuteAngle = null;
}
window.addEventListener("mouseup", endDrag);
window.addEventListener("touchend", endDrag);

document.getElementById("liveModeBtn").addEventListener("click", () => {
    liveMode = true;
    modeIndicator.textContent = uiTranslations[currentLanguage].live;
    modeIndicator.className = "mode-status mode-live";
    syncWithCurrentTime();
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(syncWithCurrentTime, 1000);
    renderWeek();
    speak(weekDayNames[currentLanguage][getTodayDayIndex()]);
});

document.getElementById("practiceModeBtn").addEventListener("click", () => {
    liveMode = false;
    modeIndicator.textContent = uiTranslations[currentLanguage].practice;
    modeIndicator.className = "mode-status mode-practice";
    clearInterval(liveTimer);
    // Default practice to today's day so it feels natural
    practiceWeekDay = getTodayDayIndex();
    renderWeek();
});

// Week navigation arrows
document.getElementById("weekPrevBtn").addEventListener("click", () => {
    if (liveMode) return;
    practiceWeekDay = (practiceWeekDay + 6) % 7;
    renderWeek();
    speak(weekDayNames[currentLanguage][practiceWeekDay]);
});
document.getElementById("weekNextBtn").addEventListener("click", () => {
    if (liveMode) return;
    practiceWeekDay = (practiceWeekDay + 1) % 7;
    renderWeek();
    speak(weekDayNames[currentLanguage][practiceWeekDay]);
});

function handleMove(e) {
    if (liveMode || !dragging) return;
    if (e.type === 'touchmove' && e.cancelable) {
        e.preventDefault();
    }
    const coords = getEventXAndY(e, clock);
    let angle = (Math.atan2(coords.y, coords.x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (dragging === "minute") {
        if (lastMinuteAngle === null) {
            lastMinuteAngle = angle;
            return;
        }
        let diff = angle - lastMinuteAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const minuteChange = Math.round(diff / 6);
        if (minuteChange !== 0) {
            totalMinutes += minuteChange;
            if (totalMinutes < 0) totalMinutes += 24 * 60;
            totalMinutes = totalMinutes % (24 * 60);
            lastMinuteAngle = angle;
            updateClock();
        }
    }

    if (dragging === "hour") {
        const currentHour24 = Math.floor(totalMinutes / 60);
        const isPm = currentHour24 >= 12;
        let newHour12 = Math.round(angle / 30) % 12 || 12;
        let newHour24 = isPm ? (newHour12 % 12) + 12 : newHour12 % 12;
        const currentMinute = totalMinutes % 60;
        totalMinutes = newHour24 * 60 + currentMinute;
        updateClock();
    }
}

document.addEventListener("mousemove", handleMove);
document.addEventListener("touchmove", handleMove, { passive: false });

function syncWithCurrentTime() {
    const now = new Date();
    totalMinutes = now.getHours() * 60 + now.getMinutes();
    updateClock();
}

// Initialize default view — restore persisted language selection first
langSelect.value = currentLanguage;
voiceLabel.textContent = `${uiTranslations[currentLanguage].voiceLabel} (${currentLanguage.toUpperCase()} Voice)`;
renderDialFace();
loadLocalizedVoices();
updateQuizButtonVisibility();
updateClock();

// Initialize week display (starts in practice mode)
practiceWeekDay = getTodayDayIndex();
renderWeek();

// Clicking the week box speaks the current day name
document.getElementById("weekBox").addEventListener("click", () => {
    const idx = liveMode ? getTodayDayIndex() : practiceWeekDay;
    speak(weekDayNames[currentLanguage][idx]);
});
// Keyboard support (Enter / Space)
document.getElementById("weekBox").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const idx = liveMode ? getTodayDayIndex() : practiceWeekDay;
        speak(weekDayNames[currentLanguage][idx]);
    }
});

