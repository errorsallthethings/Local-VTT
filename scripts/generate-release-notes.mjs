#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const TYPE_SECTIONS = [
  { heading: "Added", labels: ["type:feature"], titlePatterns: [/\bui\b/i, /\bregeneration\b/i, /\breplacement\b/i, /\brestore\b/i] },
  { heading: "Changed", labels: ["type:enhancement", "type:refactor"], titlePatterns: [/\benhancement\b/i, /\brefactor\b/i] },
  { heading: "Fixed", labels: ["type:bug"], titlePatterns: [/\bfix\b/i, /\bbug\b/i, /\berror\b/i] },
  { heading: "Security", labels: ["type:security"], titlePatterns: [/\bsecurity\b/i] },
  { heading: "Documentation", labels: ["type:docs"], titlePatterns: [/\bdocs?\b/i, /\bdocumentation\b/i] },
  { heading: "Tests", labels: ["type:test"], titlePatterns: [/\btest\b/i, /\bharness\b/i, /\bregression\b/i] },
  { heading: "Release", labels: ["type:release"], titlePatterns: [/\brelease\b/i, /\bworkflow\b/i, /\bchangelog\b/i] }
];

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.milestone) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const repo = args.repo ?? getRepo();
const state = args.state ?? "closed";
const output = args.output ?? path.join("docs", "release-notes", `v${args.milestone}.md`);
const issues = getMilestoneIssues({ repo, milestone: args.milestone, state });
const notes = formatReleaseNotes(args.milestone, issues);

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${notes}\n`, "utf8");
console.log(`Wrote ${output}`);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--milestone") {
      parsed.milestone = argv[++index];
    } else if (arg === "--repo") {
      parsed.repo = argv[++index];
    } else if (arg === "--state") {
      parsed.state = argv[++index];
    } else if (arg === "--output") {
      parsed.output = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage: npm run release:notes -- --milestone 0.1.14 [--output docs/release-notes/v0.1.14.md]

Options:
  --milestone <name>  GitHub milestone title to summarize.
  --repo <owner/repo> Repository override. Defaults to the current git remote.
  --state <state>    Issue state to include: open, closed, or all. Defaults to closed.
  --output <path>    Markdown file to write. Defaults to docs/release-notes/v<milestone>.md.`);
}

function getRepo() {
  const remote = run("git", ["remote", "get-url", "origin"]).trim();
  const match = /github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i.exec(remote);
  if (!match?.groups) {
    throw new Error("Unable to infer GitHub repository from origin remote. Pass --repo owner/name.");
  }
  return `${match.groups.owner}/${match.groups.repo}`;
}

function getMilestoneIssues({ repo, milestone, state }) {
  const output = run("gh", [
    "issue",
    "list",
    "--repo",
    repo,
    "--milestone",
    milestone,
    "--state",
    state,
    "--limit",
    "200",
    "--json",
    "number,title,url,labels,state"
  ]);
  return JSON.parse(output);
}

function formatReleaseNotes(version, issues) {
  const grouped = new Map(TYPE_SECTIONS.map((section) => [section.heading, []]));
  const uncategorized = [];

  for (const issue of issues) {
    const labelNames = new Set((issue.labels ?? []).map((label) => label.name));
    const section = TYPE_SECTIONS.find((candidate) => candidate.labels.some((label) => labelNames.has(label))) ?? inferSectionFromTitle(issue.title);
    const entry = `- ${issue.title} ([#${issue.number}](${issue.url}))`;
    if (section) {
      grouped.get(section.heading).push(entry);
    } else {
      uncategorized.push(entry);
    }
  }

  const lines = [`# Local VTT v${version}`, ""];
  if (issues.length === 0) {
    lines.push("_No closed GitHub issues were found for this milestone._");
    return lines.join("\n");
  }

  for (const section of TYPE_SECTIONS) {
    const entries = grouped.get(section.heading);
    if (!entries || entries.length === 0) {
      continue;
    }
    lines.push(`## ${section.heading}`, "", ...entries, "");
  }

  if (uncategorized.length > 0) {
    lines.push("## Other", "", ...uncategorized, "");
  }

  return lines.join("\n").trimEnd();
}

function inferSectionFromTitle(title) {
  return TYPE_SECTIONS.find((section) => section.titlePatterns?.some((pattern) => pattern.test(title)));
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    const detail = stderr ? `\n${stderr}` : "";
    throw new Error(`Command failed: ${command} ${args.join(" ")}${detail}`);
  }
  return result.stdout;
}
