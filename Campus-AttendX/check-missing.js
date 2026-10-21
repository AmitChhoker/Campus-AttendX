// check-missing.js
// Run from project root:  node check-missing.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "src");

const walk = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.name.endsWith(".js")) out.push(full);
    }
    return out;
};

const resolves = (base) => {
    const candidates = [
        base,
        base + ".js",
        base + ".json",
        path.join(base, "index.js")
    ];
    return candidates.some((c) => fs.existsSync(c));
};

const files = walk(ROOT);
const missing = [];
const seen = new Set();

for (const file of files) {
    const src = fs.readFileSync(file, "utf-8");
    const re = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
    let m;
    while ((m = re.exec(src))) {
        const rel = m[1];
        const target = path.resolve(path.dirname(file), rel);
        if (!resolves(target)) {
            const key = target;
            if (!seen.has(key)) {
                seen.add(key);
                missing.push({ from: file, req: rel, expected: target });
            }
        }
    }
}

if (missing.length === 0) {
    console.log("✅ All relative requires resolve.");
    process.exit(0);
}

console.log(`❌ ${missing.length} unresolved require(s):\n`);
for (const m of missing) {
    const relFrom = path.relative(__dirname, m.from);
    const relExpected = path.relative(__dirname, m.expected);
    console.log(`  ${relFrom}`);
    console.log(`    → require("${m.req}")`);
    console.log(`    → expected file at: ${relExpected}(.js)\n`);
}