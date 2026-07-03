const fs = require("fs");
const path = require("path");

const REPORT_FILE = path.join("reports", "results.json");
const OUTPUT_FILE = path.join("reports", "summary.json");

const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0,
    duration: 0,
    successRate: "0%",
    failedTests: []
};

if (!fs.existsSync(REPORT_FILE)) {
    console.log("results.json not found.");
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));
    process.exit(0);
}

const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf8"));

function parseSuite(suite) {
    if (!suite) return;

    if (suite.specs) {
        for (const spec of suite.specs) {
            if (!spec.tests) continue;

            for (const test of spec.tests) {
                summary.total++;

                const result =
                    test.results && test.results.length
                        ? test.results[test.results.length - 1]
                        : {};

                summary.duration += result.duration || 0;

                switch (result.status) {
                    case "passed":
                        summary.passed++;
                        break;

                    case "failed":
                        summary.failed++;

                        summary.failedTests.push({
                            title: spec.title,
                            file: spec.file || "",
                            project: test.projectName || "",
                            duration: ((result.duration || 0) / 1000).toFixed(2) + " sec",
                            error:
                                result.error?.message ||
                                (result.errors &&
                                    result.errors.length &&
                                    result.errors[0].message) ||
                                "Unknown Error"
                        });

                        break;

                    case "skipped":
                        summary.skipped++;
                        break;

                    case "timedOut":
                        summary.timedOut++;
                        break;

                    case "interrupted":
                        summary.interrupted++;
                        break;
                }
            }
        }
    }

    if (suite.suites) {
        suite.suites.forEach(parseSuite);
    }
}

(report.suites || []).forEach(parseSuite);

summary.duration = (summary.duration / 1000).toFixed(2);

summary.successRate =
    summary.total === 0
        ? "0%"
        : ((summary.passed / summary.total) * 100).toFixed(2) + "%";

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));

console.log("\n========== PLAYWRIGHT SUMMARY ==========");
console.log(`Total Tests : ${summary.total}`);
console.log(`Passed      : ${summary.passed}`);
console.log(`Failed      : ${summary.failed}`);
console.log(`Skipped     : ${summary.skipped}`);
console.log(`Timed Out   : ${summary.timedOut}`);
console.log(`Duration    : ${summary.duration} sec`);
console.log(`Success     : ${summary.successRate}`);

if (summary.failedTests.length) {
    console.log("\nFailed Tests:");

    summary.failedTests.forEach((t, i) => {
        console.log(`${i + 1}. ${t.title}`);
        console.log(`   File : ${t.file}`);
        console.log(`   Error: ${t.error}`);
    });
}

console.log("========================================");
console.log("summary.json created successfully.");