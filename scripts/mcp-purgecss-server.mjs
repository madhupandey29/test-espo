#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PurgeCSS } from "purgecss";
import fg from "fast-glob";
import * as z from "zod/v4";

const DEFAULT_CONTENT_GLOBS = [
  "src/**/*.{js,jsx,ts,tsx,html,md,mdx}",
  "app/**/*.{js,jsx,ts,tsx,html,md,mdx}",
  "pages/**/*.{js,jsx,ts,tsx,html,md,mdx}",
  "public/**/*.html",
];

const DEFAULT_CSS_GLOBS = [
  "src/**/*.{css,scss,sass}",
  "app/**/*.{css,scss,sass}",
  "pages/**/*.{css,scss,sass}",
  "styles/**/*.{css,scss,sass}",
  "public/**/*.{css,scss,sass}",
];

const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
];

function normalizeProjectPath(projectPathInput) {
  const input = projectPathInput?.trim();
  return path.resolve(input && input.length > 0 ? input : process.cwd());
}

async function ensureDirectoryExists(dirPath) {
  const stat = await fs.stat(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }
}

function toRelative(projectPath, targetPath) {
  return path.relative(projectPath, targetPath).split(path.sep).join("/");
}

function buildResultReport(results, projectPath) {
  const files = results.map((item) => {
    const file = item.file ? toRelative(projectPath, item.file) : "inline";
    return {
      file,
      cssBytes: Buffer.byteLength(item.css || "", "utf8"),
      removedSelectors: Array.isArray(item.rejected) ? item.rejected.length : 0,
    };
  });

  const totals = files.reduce(
    (acc, file) => {
      acc.cssBytes += file.cssBytes;
      acc.removedSelectors += file.removedSelectors;
      return acc;
    },
    { cssBytes: 0, removedSelectors: 0 },
  );

  return { files, totals };
}

const server = new McpServer({
  name: "purgecss-mcp",
  version: "1.0.0",
});

server.registerTool(
  "purge_css",
  {
    description:
      "Run PurgeCSS for a project and optionally write merged optimized CSS to a file.",
    inputSchema: {
      projectPath: z
        .string()
        .optional()
        .describe("Absolute or relative path to the target project (defaults to current working directory)."),
      contentGlobs: z
        .array(z.string())
        .optional()
        .describe("Content globs relative to projectPath."),
      cssGlobs: z
        .array(z.string())
        .optional()
        .describe("CSS globs relative to projectPath."),
      ignoreGlobs: z
        .array(z.string())
        .optional()
        .describe("Optional ignore globs relative to projectPath."),
      safelist: z
        .array(z.string())
        .optional()
        .describe("Selectors to always keep."),
      blocklist: z
        .array(z.string())
        .optional()
        .describe("Selectors to always remove."),
      includeRejected: z
        .boolean()
        .optional()
        .describe("If true, include removed selectors in output metadata."),
      outputFile: z
        .string()
        .optional()
        .describe("Optional file path relative to projectPath where merged CSS is written."),
    },
  },
  async ({
    projectPath: projectPathInput,
    contentGlobs,
    cssGlobs,
    ignoreGlobs,
    safelist,
    blocklist,
    includeRejected,
    outputFile,
  }) => {
    const projectPath = normalizeProjectPath(projectPathInput);
    await ensureDirectoryExists(projectPath);

    const activeContentGlobs = contentGlobs?.length ? contentGlobs : DEFAULT_CONTENT_GLOBS;
    const activeCssGlobs = cssGlobs?.length ? cssGlobs : DEFAULT_CSS_GLOBS;
    const activeIgnoreGlobs = ignoreGlobs?.length ? ignoreGlobs : DEFAULT_IGNORES;

    const matchedContentFiles = await fg(activeContentGlobs, {
      cwd: projectPath,
      absolute: true,
      onlyFiles: true,
      ignore: activeIgnoreGlobs,
      unique: true,
    });

    const matchedCssFiles = await fg(activeCssGlobs, {
      cwd: projectPath,
      absolute: true,
      onlyFiles: true,
      ignore: activeIgnoreGlobs,
      unique: true,
    });

    if (matchedContentFiles.length === 0) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `No content files matched in ${projectPath}. Update contentGlobs.`,
          },
        ],
      };
    }

    if (matchedCssFiles.length === 0) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `No CSS files matched in ${projectPath}. Update cssGlobs.`,
          },
        ],
      };
    }

    const purgeResults = await new PurgeCSS().purge({
      content: matchedContentFiles,
      css: matchedCssFiles,
      safelist: safelist ?? [],
      blocklist: blocklist ?? [],
      rejected: includeRejected ?? true,
    });

    const report = buildResultReport(purgeResults, projectPath);
    const mergedCss = purgeResults
      .map((entry) => {
        const label = entry.file ? toRelative(projectPath, entry.file) : "inline";
        return `/* ${label} */\n${entry.css || ""}`;
      })
      .join("\n\n");

    let outputPath = null;
    if (outputFile) {
      outputPath = path.resolve(projectPath, outputFile);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, mergedCss, "utf8");
    }

    const summary = {
      projectPath,
      contentFilesScanned: matchedContentFiles.length,
      cssFilesProcessed: matchedCssFiles.length,
      mergedCssBytes: Buffer.byteLength(mergedCss, "utf8"),
      removedSelectors: report.totals.removedSelectors,
      outputFile: outputPath,
      files: report.files,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
      structuredContent: summary,
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("purgecss-mcp server error:", error);
  process.exit(1);
});
