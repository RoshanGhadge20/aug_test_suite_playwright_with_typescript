const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Safe to call unconditionally: a no-op if .env.email doesn't exist, and dotenv never
// overwrites variables already present in process.env (e.g. ones GitHub Actions injects).
require("dotenv").config({ path: ".env.email" });

const REQUIRED_ENV_VARS = ["SMTP_SERVER", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "EMAIL_TO"];

async function sendEmail() {
    try {
        const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(
                `Missing required email env var(s): ${missing.join(", ")}. ` +
                    "Check that .env.email was created from the EMAIL_ENV secret before this step ran.",
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.verify();
        console.log("✅ SMTP connection verified.");

        const emailHtmlPath = path.join("reports", "email.html");

        let emailHtml = `
            <h2>Playwright Automation</h2>
            <p>No HTML report was generated.</p>
        `;

        if (fs.existsSync(emailHtmlPath)) {
            emailHtml = fs.readFileSync(emailHtmlPath, "utf8");
        }

        const summaryPath = path.join("reports", "summary.json");

        let subject = "✅ Playwright Automation Report - Success";

        if (fs.existsSync(summaryPath)) {
            const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

            if (summary.failed > 0) {
                subject = "❌ Playwright Automation Report - Failed";
            }
        }

        const attachments = [];

        // 📦 ZIP report
        const zipPath = path.join("reports", "html-report.zip");
        if (fs.existsSync(zipPath)) {
            attachments.push({
                filename: "playwright-report.zip",
                path: zipPath,
            });
        }

        // 📊 JSON results
        const jsonPath = path.join("reports", "results.json");
        if (fs.existsSync(jsonPath)) {
            attachments.push({
                filename: "results.json",
                path: jsonPath,
            });
        }

        // 📸 Screenshots
        const screenshotDir = path.join("reports", "test-artifacts");

        if (fs.existsSync(screenshotDir)) {
            const files = fs.readdirSync(screenshotDir);

            files.forEach((file) => {
                const fullPath = path.join(screenshotDir, file);

                if (fs.statSync(fullPath).isFile()) {
                    attachments.push({
                        filename: file,
                        path: fullPath,
                    });
                }
            });
        }

        // 📧 Recipients
        const recipients = (process.env.EMAIL_TO || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || "Playwright"}" <${process.env.SMTP_USERNAME}>`,
            to: recipients,
            subject,
            html: emailHtml,
            attachments,
        });

        console.log("====================================");
        console.log("✅ Email sent successfully.");
        console.log("Message ID:", info.messageId);
        console.log("====================================");

    } catch (err) {
        console.error("❌ Email sending failed.");
        console.error(err);
        process.exit(1);
    }
}

sendEmail();