import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, ".slides-src");
const outputFile = path.join(rootDir, "openclaw-training-ppt.html");

async function read(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function getSectionFiles(sectionsDir) {
  const manifestPath = path.join(sourceDir, "sections.json");
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return manifest.sections.map((entry) => entry.file);
  } catch {
    const files = await fs.readdir(sectionsDir);
    return files.filter((file) => file.endsWith(".html")).sort();
  }
}

async function main() {
  const templatesDir = path.join(sourceDir, "templates");
  const stylesDir = path.join(sourceDir, "styles");
  const scriptsDir = path.join(sourceDir, "scripts");
  const sectionsDir = path.join(sourceDir, "sections");

  const [head, css, shellStart, shellEnd, appJs, footer, sectionFiles] = await Promise.all([
    read(path.join(templatesDir, "head.html")),
    read(path.join(stylesDir, "main.css")),
    read(path.join(templatesDir, "shell-start.html")),
    read(path.join(templatesDir, "shell-end.html")),
    read(path.join(scriptsDir, "app.js")),
    read(path.join(templatesDir, "footer.html")),
    getSectionFiles(sectionsDir),
  ]);

  const sectionContents = await Promise.all(
    sectionFiles.map(async (file) => {
      const content = await read(path.join(sectionsDir, file));
      return `      <!-- section: ${file} -->\n${content.trimEnd()}`;
    }),
  );

  const html = [
    head,
    "<style>\n",
    css.trimEnd(),
    "\n  </style>",
    shellStart,
    sectionContents.join("\n\n"),
    shellEnd,
    "  <script>\n",
    appJs.trimEnd(),
    "\n  </script>",
    footer,
  ].join("");

  await fs.writeFile(outputFile, html, "utf8");
  console.log(`Built ${path.relative(rootDir, outputFile)} from ${sectionFiles.length} section files.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
