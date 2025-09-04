function runSEOChecks(html) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const report = [];

	const checks = [
		{
			label: "Title Tag",
			passed: !!doc.querySelector("title"),
			value: doc.querySelector("title")?.textContent || "Missing"
		},
		{
			label: "Meta Description",
			passed: !!doc.querySelector('meta[name="description"]'),
			value: doc.querySelector('meta[name="description"]')?.content || "Missing"
		},
		{
			label: "Canonical Tag",
			passed: !!doc.querySelector('link[rel="canonical"]'),
			value: doc.querySelector('link[rel="canonical"]')?.href || "Missing"
		},
		{
			label: "Open Graph Title",
			passed: !!doc.querySelector('meta[property="og:title"]'),
			value: doc.querySelector('meta[property="og:title"]')?.content || "Missing"
		},
		{
			label: "Open Graph Description",
			passed: !!doc.querySelector('meta[property="og:description"]'),
			value:
				doc.querySelector('meta[property="og:description"]')?.content || "Missing"
		},
		{
			label: "Favicon",
			passed: !!doc.querySelector('link[rel="icon"]'),
			value: doc.querySelector('link[rel="icon"]')?.href || "Missing"
		},
		{
			label: "Meta Robots",
			passed: !!doc.querySelector('meta[name="robots"]'),
			value: doc.querySelector('meta[name="robots"]')?.content || "Missing"
		},
		{
			label: "Structured Data (JSON-LD)",
			passed: !!doc.querySelector('script[type="application/ld+json"]'),
			value:
				doc.querySelector('script[type="application/ld+json"]')?.textContent ||
				"Missing"
		},
		{
			label: "One <h1> tag only",
			passed: doc.querySelectorAll("h1").length === 1,
			value: `${doc.querySelectorAll("h1").length} found`
		},
		{
			label: "Image alt tags",
			passed: [...doc.querySelectorAll("img")].every((img) => img.alt),
			value: `${
				[...doc.querySelectorAll("img")].filter((img) => !img.alt).length
			} missing`
		}
	];

	for (const check of checks) {
		const cssClass = check.passed ? "report-pass" : "report-fail";
		const symbol = check.passed ? "✅" : "❌";
		report.push(
			`<div class="${cssClass}">${symbol} <strong>${check.label}:</strong> ${check.value}</div>`
		);
	}

	return report;
}

let editor;

require.config({
	paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs" }
});

require(["vs/editor/editor.main"], function () {
	editor = monaco.editor.create(document.getElementById("editor"), {
		value: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Sample Page</title>
  <meta name="description" content="An example description.">
</head>
<body>
  <h1>Hello World</h1>
  <img src="example.jpg" alt="Example image">
</body>
</html>`,
		language: "html",
		theme: "vs-dark",
		fontSize: 14,
		wordWrap: "on"
	});
});

function renderHTML() {
	const htmlContent = editor.getValue();
	const outputFrame = document.getElementById("outputFrame").contentWindow
		.document;
	const seoReport = document.getElementById("seoReport");
	const errorBox = document.getElementById("errors");

	try {
		outputFrame.open();
		outputFrame.write(htmlContent);
		outputFrame.close();

		const checks = runSEOChecks(htmlContent);
		seoReport.innerHTML = checks.join("");
		errorBox.style.display = "none";
	} catch (e) {
		errorBox.style.display = "block";
		errorBox.textContent = `Error: ${e.message}`;
	}
}
function runAxeAudit() {
	const frame = document.getElementById("outputFrame");
	const auditResult = document.getElementById("waveReport");

	auditResult.innerHTML = "<p>♿ Running accessibility audit...</p>";

	// Wait for frame content to be ready
	setTimeout(() => {
		try {
			const frameDoc = frame.contentWindow.document;

			axe
				.run(frameDoc, {
					runOnly: ["wcag2a", "wcag2aa"],
					resultTypes: ["violations"]
				})
				.then((results) => {
					if (results.violations.length === 0) {
						auditResult.innerHTML =
							'<p class="report-pass">✅ No accessibility violations found</p>';
					} else {
						let html = `<h3>⚠️ Accessibility Violations (${results.violations.length})</h3><ul>`;
						results.violations.forEach((v) => {
							html += `<li class="report-fail"><strong>${v.help}:</strong> ${v.description}<br/><em>${v.nodes.length} occurrence(s)</em></li>`;
						});
						html += "</ul>";
						auditResult.innerHTML = html;
					}
				})
				.catch((err) => {
					auditResult.innerHTML = `<p class="report-fail">❌ axe error: ${err.message}</p>`;
				});
		} catch (e) {
			auditResult.innerHTML = `<p class="report-fail">❌ Cannot run audit: ${e.message}</p>`;
		}
	}, 500); // small delay for frame to render
}
