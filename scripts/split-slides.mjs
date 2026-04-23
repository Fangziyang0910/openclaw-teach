import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const inputFile = path.join(rootDir, "openclaw-training-ppt.html");
const outputDir = path.join(rootDir, ".slides-src");

const moduleSlugMap = new Map([
  ["开场", "opening"],
  ["本地部署", "local-deploy"],
  ["安装与配置", "install-config"],
  ["飞书接入", "feishu"],
  ["Skills 与个性化", "skills-customization"],
  ["案例与 FAQ", "cases-faq"],
  ["结束", "ending"],
]);

function requireIndex(source, needle, fromIndex = 0) {
  const index = source.indexOf(needle, fromIndex);
  if (index === -1) {
    throw new Error(`Missing marker: ${needle}`);
  }
  return index;
}

function normalizeBlock(source) {
  return source.replace(/^\n/, "").replace(/\s*$/, "\n");
}

function getModuleName(slideMarkup) {
  const matched = slideMarkup.match(/data-module="([^"]+)"/);
  if (!matched) {
    throw new Error("Slide is missing data-module.");
  }
  return matched[1];
}

function slugifyModule(moduleName) {
  return moduleSlugMap.get(moduleName) ?? `module-${moduleName.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()}`;
}

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const html = await fs.readFile(inputFile, "utf8");

  const styleOpen = requireIndex(html, "<style>");
  const styleClose = requireIndex(html, "</style>", styleOpen);
  const scriptOpen = html.lastIndexOf("<script>");
  const scriptClose = html.lastIndexOf("</script>");
  const firstSlideOpen = requireIndex(html, "<section class=\"slide", styleClose);
  const lastSlideClose = html.lastIndexOf("</section>", scriptOpen);

  if (scriptOpen === -1 || scriptClose === -1 || lastSlideClose === -1) {
    throw new Error("Could not locate script or slide boundaries.");
  }

  const lastSlideEnd = lastSlideClose + "</section>".length;
  const css = normalizeBlock(html.slice(styleOpen + "<style>".length, styleClose));
  const appJs = normalizeBlock(html.slice(scriptOpen + "<script>".length, scriptClose));

  const templatesDir = path.join(outputDir, "templates");
  const stylesDir = path.join(outputDir, "styles");
  const scriptsDir = path.join(outputDir, "scripts");
  const sectionsDir = path.join(outputDir, "sections");

  await resetDir(outputDir);
  await Promise.all([
    fs.mkdir(templatesDir, { recursive: true }),
    fs.mkdir(stylesDir, { recursive: true }),
    fs.mkdir(scriptsDir, { recursive: true }),
    fs.mkdir(sectionsDir, { recursive: true }),
  ]);

  await Promise.all([
    fs.writeFile(path.join(templatesDir, "head.html"), html.slice(0, styleOpen), "utf8"),
    fs.writeFile(path.join(templatesDir, "shell-start.html"), html.slice(styleClose + "</style>".length, firstSlideOpen), "utf8"),
    fs.writeFile(path.join(templatesDir, "shell-end.html"), html.slice(lastSlideEnd, scriptOpen), "utf8"),
    fs.writeFile(path.join(templatesDir, "footer.html"), html.slice(scriptClose + "</script>".length), "utf8"),
    fs.writeFile(path.join(stylesDir, "main.css"), css, "utf8"),
    fs.writeFile(path.join(scriptsDir, "app.js"), appJs, "utf8"),
  ]);

  const slideMarkup = html.slice(firstSlideOpen, lastSlideEnd);
  const slides = slideMarkup.match(/<section class="slide[\s\S]*?<\/section>/g);

  if (!slides || slides.length === 0) {
    throw new Error("No slides found in main stage.");
  }

  const sectionFiles = [];
  let currentModule = null;
  let currentGroup = [];
  let order = 0;

  async function flushGroup() {
    if (!currentModule || currentGroup.length === 0) {
      return;
    }

    order += 1;
    const fileName = `${String(order).padStart(2, "0")}-${slugifyModule(currentModule)}.html`;
    const filePath = path.join(sectionsDir, fileName);
    const content = `${currentGroup.join("\n\n")}\n`;

    await fs.writeFile(filePath, content, "utf8");
    sectionFiles.push({
      file: fileName,
      module: currentModule,
      slideCount: currentGroup.length,
    });
    currentGroup = [];
  }

  for (const slide of slides) {
    const moduleName = getModuleName(slide);
    if (currentModule !== moduleName) {
      await flushGroup();
      currentModule = moduleName;
    }
    currentGroup.push(slide);
  }

  await flushGroup();

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "openclaw-training-ppt.html",
    sections: sectionFiles,
  };

  const readme = [
    "# Slides Source",
    "",
    "- `styles/main.css`: shared CSS",
    "- `scripts/app.js`: shared runtime logic",
    "- `templates/*.html`: shell fragments used during build",
    "- `sections/*.html`: slide content grouped by module",
    "",
    "Rebuild the deck with:",
    "",
    "```bash",
    "node scripts/build-slides.mjs",
    "```",
    "",
  ].join("\n");

  await Promise.all([
    fs.writeFile(path.join(outputDir, "sections.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(outputDir, "README.md"), readme, "utf8"),
  ]);

  console.log(`Split ${slides.length} slides into ${sectionFiles.length} section files under ${path.relative(rootDir, outputDir)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
