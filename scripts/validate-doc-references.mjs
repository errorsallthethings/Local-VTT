import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const markdownRoots = ["README.md", "docs"];
const ignoredSchemes = /^(?:https?:|mailto:|tel:)/i;

const failures = [];

for (const filePath of getMarkdownFiles(markdownRoots)) {
  const fileText = await import("node:fs/promises").then((fs) => fs.readFile(filePath, "utf8"));
  for (const reference of getMarkdownReferences(fileText)) {
    if (shouldIgnoreReference(reference)) {
      continue;
    }
    const targetPath = resolveReferencePath(filePath, reference);
    if (!existsSync(targetPath)) {
      failures.push(`${path.relative(repoRoot, filePath)} references missing file: ${reference}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Documentation reference validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Documentation reference validation passed.");

function getMarkdownFiles(entries) {
  const files = [];
  for (const entry of entries) {
    const absoluteEntry = path.resolve(repoRoot, entry);
    if (!existsSync(absoluteEntry)) {
      continue;
    }
    collectMarkdownFiles(absoluteEntry, files);
  }
  return files.sort();
}

function collectMarkdownFiles(entryPath, files) {
  const stats = statSync(entryPath);
  if (stats.isFile()) {
    if (entryPath.endsWith(".md")) {
      files.push(entryPath);
    }
    return;
  }

  if (!stats.isDirectory()) {
    return;
  }

  for (const child of readdirSync(entryPath)) {
    collectMarkdownFiles(path.join(entryPath, child), files);
  }
}

function getMarkdownReferences(fileText) {
  const references = [];
  const markdownLinkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of fileText.matchAll(markdownLinkPattern)) {
    references.push(match[1]);
  }
  return references;
}

function shouldIgnoreReference(reference) {
  return reference.startsWith("#") || ignoredSchemes.test(reference);
}

function resolveReferencePath(sourceFilePath, reference) {
  const [referencePath] = reference.split("#");
  const decodedReferencePath = decodeURIComponent(referencePath);
  return path.resolve(path.dirname(sourceFilePath), decodedReferencePath);
}
