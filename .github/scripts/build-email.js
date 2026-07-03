const fs = require("fs");
const path = require("path");

const summaryPath = path.join("reports", "summary.json");
const templatePath = path.join(
    ".github",
    "scripts",
    "email-template.html"
);
const outputPath = path.join("reports", "email.html");

if (!fs.existsSync(summaryPath)) {
    console.error("summary.json not found.");
    process.exit(1);
}

if (!fs.existsSync(templatePath)) {
    console.error("email-template.html not found.");
    process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

let html = fs.readFileSync(templatePath, "utf8");

const status = summary.failed > 0 ? "FAILED ❌" : "PASSED ✅";
const headerClass =
    summary.failed > 0 ? "header-failed" : "header-success";

const failedRows =
    summary.failedTests.length === 0
        ? `
<tr>
<td colspan="3" style="text-align:center;">
No Failed Tests 🎉
</td>
</tr>
`
        : summary.failedTests
            .map(
                (t) => `
<tr>
<td>${t.title}</td>
<td>${t.file}</td>
<td>${t.error}</td>
</tr>
`
            )
            .join("");

const values = {
    "{{STATUS}}": status,
    "{{HEADER_CLASS}}": headerClass,

    "{{WORKFLOW}}": process.env.GITHUB_WORKFLOW || "",
    "{{REPOSITORY}}": process.env.GITHUB_REPOSITORY || "",
    "{{BRANCH}}": process.env.GITHUB_REF_NAME || "",
    "{{PROJECT}}": process.env.PROJECT || "",
    "{{FOLDER}}": process.env.FOLDER || "",
    "{{TESTCASE}}": process.env.TESTCASE || "",
    "{{ACTOR}}": process.env.GITHUB_ACTOR || "",
    "{{COMMIT}}": process.env.GITHUB_SHA
        ? process.env.GITHUB_SHA.substring(0, 8)
        : "",

    "{{TOTAL}}": summary.total,
    "{{PASSED}}": summary.passed,
    "{{FAILED}}": summary.failed,
    "{{SKIPPED}}": summary.skipped,
    "{{TIMEDOUT}}": summary.timedOut,
    "{{INTERRUPTED}}": summary.interrupted,
    "{{DURATION}}": summary.duration + " sec",
    "{{SUCCESS_RATE}}": summary.successRate,

    "{{FAILED_TESTS}}": failedRows,

    "{{RUN_URL}}":
        process.env.GITHUB_SERVER_URL +
        "/" +
        process.env.GITHUB_REPOSITORY +
        "/actions/runs/" +
        process.env.GITHUB_RUN_ID
};

for (const key of Object.keys(values)) {
    html = html.replaceAll(key, values[key]);
}

fs.writeFileSync(outputPath, html);

console.log("email.html generated successfully.");