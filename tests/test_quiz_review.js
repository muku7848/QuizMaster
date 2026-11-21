const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

class Element {
    constructor() {
        this.listeners = {};
        this.children = [];
        this.attributes = {};
        this.classList = {
            toggle: () => {},
        };
        this.hidden = false;
        this.textContent = "";
        this.value = "";
    }

    addEventListener(name, callback) {
        this.listeners[name] = callback;
    }

    appendChild(child) {
        this.children.push(child);
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    click() {
        this.listeners.click();
    }
}

test("marking a question lists its number in the review summary", async () => {
    const elements = new Map();
    const document = {
        body: { dataset: { quizId: "1" } },
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, new Element());
            }
            return elements.get(id);
        },
        createElement() {
            return new Element();
        },
    };

    const questions = [
        { id: 11, text: "First?", option_a: "A", option_b: "B", option_c: "C", option_d: "D" },
        { id: 12, text: "Second?", option_a: "A", option_b: "B", option_c: "C", option_d: "D" },
    ];
    const context = {
        document,
        window: { addEventListener() {} },
        fetch: async () => ({
            ok: true,
            json: async () => ({
                title: "Test Quiz",
                description: "",
                category: "General",
                difficulty: "easy",
                question_count: questions.length,
                questions,
            }),
        }),
    };

    const scriptPath = path.join(__dirname, "..", "app", "static", "js", "quiz.js");
    vm.runInNewContext(fs.readFileSync(scriptPath, "utf8"), context);
    await new Promise(resolve => setImmediate(resolve));

    document.getElementById("player-name").value = "Asha";
    elements.get("start-form").listeners.submit({ preventDefault() {} });
    elements.get("next-button").click();
    elements.get("mark-review-button").click();

    assert.equal(
        elements.get("review-summary").textContent,
        "Marked for review: 2"
    );
});
