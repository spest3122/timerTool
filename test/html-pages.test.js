const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function readPage(fileName) {
    return fs.readFileSync(path.join(root, fileName), "utf8");
}

function extractScripts(html) {
    return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

function makeElement(initial = {}) {
    return {
        attributes: {},
        children: [],
        className: "",
        textContent: "",
        value: "",
        innerHTML: "",
        style: {},
        classList: {
            values: [],
            add(...classes) {
                this.values.push(...classes);
            }
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        },
        getAttribute(name) {
            return this.attributes[name];
        },
        addEventListener() {},
        querySelector() {
            return makeElement();
        },
        getBoundingClientRect() {
            return { left: 0, top: 0 };
        },
        ...initial
    };
}

function createDomStub(defaultValues = {}) {
    const elements = {};

    return {
        elements,
        document: {
            getElementById(id) {
                if (!elements[id]) {
                    elements[id] = makeElement({ value: defaultValues[id] || "" });
                }
                return elements[id];
            },
            createElement() {
                return makeElement();
            },
            createElementNS() {
                return makeElement();
            },
            addEventListener() {}
        }
    };
}

test("index.html exposes the expected trainer controls", () => {
    const html = readPage("index.html");

    assert.match(html, /<title>Multilingual Time Trainer<\/title>/);
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /id="clock"/);
    assert.match(html, /id="digitalTime"/);
    assert.match(html, /id="langSelect"/);
    assert.match(html, /id="phrases"/);
    assert.match(html, /id="liveModeBtn"/);
    assert.match(html, /id="practiceModeBtn"/);
});

test("quiz.html exposes the expected quiz controls", () => {
    const html = readPage("quiz.html");

    assert.match(html, /<title>Time Trainer Quiz<\/title>/);
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /id="quizLanguage"/);
    assert.match(html, /id="questionTime"/);
    assert.match(html, /id="answerChoices"/);
    assert.match(html, /id="feedback"/);
    assert.match(html, /id="nextQuestionBtn"/);
    assert.match(html, /href="index\.html"/);
});

test("inline scripts in index.html and quiz.html parse successfully", () => {
    for (const fileName of ["index.html", "quiz.html"]) {
        const scripts = extractScripts(readPage(fileName));
        assert.ok(scripts.length > 0, `${fileName} should include at least one script`);

        scripts.forEach((script, index) => {
            assert.doesNotThrow(() => new vm.Script(script), `${fileName} script ${index + 1} should parse`);
        });
    }
});

test("index.html builds multilingual phrases for representative times", () => {
    const [script] = extractScripts(readPage("index.html"));
    const { document, elements } = createDomStub({ langSelect: "de" });
    const context = {
        document,
        window: { addEventListener() {} },
        speechSynthesis: { getVoices: () => [], speak() {} },
        SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) { this.text = text; },
        setInterval,
        clearInterval,
        console
    };

    vm.runInNewContext(`${script}
        currentLanguage = "en";
        globalThis.englishTime = buildMultilingualTime(19, 40);
        currentLanguage = "de";
        globalThis.germanTime = buildMultilingualTime(8, 15);
        currentLanguage = "es";
        globalThis.spanishTime = buildMultilingualTime(12, 30);
    `, context);

    assert.equal(elements.digitalTime.textContent, "19:40");
    assert.deepEqual(JSON.parse(JSON.stringify(context.englishTime)), {
        official12: "seven forty",
        official24: "nineteen forty",
        informal: ["twenty to eight"]
    });
    assert.deepEqual(JSON.parse(JSON.stringify(context.germanTime)), {
        official12: "acht Uhr fünfzehn",
        official24: "acht Uhr fünfzehn",
        informal: ["Viertel nach acht"]
    });
    assert.deepEqual(JSON.parse(JSON.stringify(context.spanishTime)), {
        official12: "Son las doce y treinta",
        official24: "Son las doce y treinta",
        informal: ["Son las doce y media"]
    });
});

test("quiz.html formats times and finds localized answers", () => {
    const [script] = extractScripts(readPage("quiz.html"));
    const { document } = createDomStub({ quizLanguage: "de" });
    const context = {
        document,
        Math: { ...Math, random: () => 0 },
        console
    };

    vm.runInNewContext(`${script}
        globalThis.formattedTime = formatTime(7, 0);
        globalThis.germanAnswer = getCorrectPhrase("de", 8, 15);
        globalThis.englishAnswer = getCorrectPhrase("en", 19, 40);
        globalThis.spanishAnswer = getCorrectPhrase("es", 23, 45);
    `, context);

    assert.equal(context.formattedTime, "07:00");
    assert.equal(context.germanAnswer, "Viertel nach acht");
    assert.equal(context.englishAnswer, "twenty to eight");
    assert.equal(context.spanishAnswer, "Son las doce menos cuarto");
});
