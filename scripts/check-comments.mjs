import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import ts from "typescript";

const root = process.cwd();
const scannedDirectories = ["src", "scripts", "supabase/migrations"];
const scannedRootFiles = ["eslint.config.mjs", "next.config.ts", "postcss.config.mjs"];
const scriptExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]);
const ignoredDirectories = new Set(["node_modules", ".next"]);
const generatedFiles = new Set(["src/lib/supabase/database.types.ts"]);

function listFiles(directory) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return ignoredDirectories.has(entry) ? [] : listFiles(path);
    }
    return [path];
  });
}

function lineOf(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function findScriptComments(path, text) {
  const scriptKind = path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, scriptKind);
  const offsets = new Set();

  function collect(ranges) {
    for (const range of ranges ?? []) {
      offsets.add(range.pos);
    }
  }

  function visit(node) {
    collect(ts.getLeadingCommentRanges(text, node.getFullStart()));
    collect(ts.getTrailingCommentRanges(text, node.getEnd()));
    for (const child of node.getChildren(sourceFile)) {
      visit(child);
    }
  }

  visit(sourceFile);
  return [...offsets];
}

function skipQuoted(text, start, quote) {
  let index = start + 1;
  while (index < text.length) {
    if (text[index] === "\\" && quote !== "'") {
      index += 2;
      continue;
    }
    if (text[index] === quote) {
      if (quote === "'" && text[index + 1] === "'") {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function findDelimitedComments(text, markers) {
  const offsets = [];
  let index = 0;
  while (index < text.length) {
    const character = text[index];
    if (character === "'" || character === '"') {
      index = skipQuoted(text, index, character);
      continue;
    }
    if (markers.some((marker) => text.startsWith(marker, index))) {
      offsets.push(index);
      const closing = text.startsWith("/*", index) ? text.indexOf("*/", index + 2) : text.indexOf("\n", index);
      index = closing === -1 ? text.length : closing + 1;
      continue;
    }
    index += 1;
  }
  return offsets;
}

function findComments(path, text) {
  const extension = extname(path);
  if (scriptExtensions.has(extension)) {
    return findScriptComments(path, text);
  }
  if (extension === ".css") {
    return findDelimitedComments(text, ["/*"]);
  }
  if (extension === ".sql") {
    return findDelimitedComments(text, ["--", "/*"]);
  }
  return [];
}

const files = [
  ...scannedDirectories.flatMap((directory) => listFiles(join(root, directory))),
  ...scannedRootFiles.map((file) => join(root, file)),
];

const violations = files.flatMap((path) => {
  const relativePath = relative(root, path);
  if (generatedFiles.has(relativePath)) {
    return [];
  }
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  return findComments(path, text).map((offset) => `${relativePath}:${lineOf(text, offset)}`);
});

if (violations.length > 0) {
  console.error("Comments are not allowed (see CLAUDE.md):");
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}
