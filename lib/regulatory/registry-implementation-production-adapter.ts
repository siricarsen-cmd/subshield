import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  executeRegulatoryImplementationPullRequest,
  type RegulatoryImplementationCheckResult,
  type RegulatoryImplementationCommitRecord,
  type RegulatoryImplementationExecutionResult,
  type RegulatoryImplementationPullRequestRecord,
  type RegulatoryImplementationRepositoryAdapter,
  type RegulatoryImplementationRepositoryState,
} from "./registry-implementation-executor";
import type { RegulatoryRegistryImplementationPlan } from "./registry-implementation-plan";
import type { RegulatoryImplementationPullRequestBundle } from "./registry-implementation-pr-bundle";

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const CANONICAL_GIT_ENDPOINT =
  "https://github.com/siricarsen-cmd/subshield.git";
const MAX_OUTPUT_BYTES = 256 * 1024;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const CHECKSUM_RE = /^sha256:[a-f0-9]{64}$/;
const GITHUB_INSTANT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/;
const GIT_STRICT_INSTANT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const SAFE_PERMISSION = new Set(["ADMIN", "MAINTAIN", "WRITE"]);
const ALLOWED_PATHS = Object.freeze([
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
] as const);
const ALLOWED_PATH_SET = new Set<string>(ALLOWED_PATHS);
const REQUIRED_CHECKS = Object.freeze([
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
] as const);
const PRODUCTION_BOUNDARY = Object.freeze({
  applicationStatus: "not-applied" as const,
  customerFacingStatus: "benchmark-only" as const,
  mergeStatus: "not-authorized" as const,
});

const TEST_LOADER = "lib/analyzer/__tests__/ts-relative-import.loader.mjs";
const REGULATORY_TEST_FILES = Object.freeze([
  "lib/regulatory/__tests__/source-catalog.test.mjs",
  "lib/regulatory/__tests__/registry-integrity.test.mjs",
  "lib/regulatory/__tests__/registry-change-control.test.mjs",
  "lib/regulatory/__tests__/update-intake.test.mjs",
  "lib/regulatory/__tests__/stored-update-intake.test.mjs",
  "lib/regulatory/__tests__/update-review-packet.test.mjs",
  "lib/regulatory/__tests__/update-review-command.test.mjs",
  "lib/regulatory/__tests__/update-review-cli-arguments.test.mjs",
  "lib/regulatory/__tests__/ingestion-review-batch.test.mjs",
  "lib/regulatory/__tests__/ingestion-review-repeat-suppression.test.mjs",
  "lib/regulatory/__tests__/review-decision-command.test.mjs",
  "lib/regulatory/__tests__/review-decision-cli-arguments.test.mjs",
  "lib/regulatory/__tests__/review-decision-audit-provenance.test.mjs",
  "lib/regulatory/__tests__/stored-change-set-draft.test.mjs",
  "lib/regulatory/__tests__/stored-change-set-noncitation-guard.test.mjs",
  "lib/regulatory/__tests__/stored-change-set-review-decision.test.mjs",
  "lib/regulatory/__tests__/change-set-review-cli-arguments.test.mjs",
  "lib/regulatory/__tests__/registry-implementation-plan.test.mjs",
  "lib/regulatory/__tests__/registry-implementation-pr-bundle.test.mjs",
  "lib/regulatory/__tests__/registry-implementation-pr-bundle-semantic.test.mjs",
  "lib/regulatory/__tests__/registry-implementation-executor.test.mjs",
  "lib/regulatory/__tests__/registry-implementation-production-adapter.test.mjs",
  "lib/regulatory/__tests__/ingestion.test.mjs",
  "lib/regulatory/__tests__/verified-stored-update-pair.test.mjs",
  "lib/regulatory/__tests__/applicability-mapping.test.mjs",
  "lib/regulatory/__tests__/citation-package.test.mjs",
  "lib/regulatory/__tests__/source-coverage-citation-packages.test.mjs",
  "lib/regulatory/__tests__/historical-version-selection.test.mjs",
  "lib/regulatory/__tests__/historical-context-runtime.test.mjs",
  "lib/regulatory/__tests__/contract-date-evidence.test.mjs",
  "lib/regulatory/__tests__/contract-date-performance-boundary.test.mjs",
  "lib/regulatory/__tests__/historical-grounding-orchestration.test.mjs",
  "lib/regulatory/__tests__/historical-citation-regeneration.test.mjs",
] as const);
const ACCURACY_TEST_FILES = Object.freeze([
  "lib/analyzer/__tests__/qa-core-accuracy-benchmark.test.mjs",
  "lib/analyzer/__tests__/qa-c-cyber-coverage-grounding.test.mjs",
] as const);

const ALLOWED_LOCAL_CONFIG_EXACT = new Set([
  "core.repositoryformatversion",
  "core.filemode",
  "core.bare",
  "core.logallrefupdates",
  "core.ignorecase",
  "core.precomposeunicode",
  "remote.origin.url",
  "remote.origin.fetch",
  "remote.origin.pushurl",
]);
const ALLOWED_LOCAL_CONFIG_PATTERNS = [
  /^branch\.[^.]+\.remote$/,
  /^branch\.[^.]+\.merge$/,
];

type AdapterState =
  | "created"
  | "preflighted"
  | "branch-created"
  | "files-written"
  | "committed"
  | "checking"
  | "checked"
  | "pushed"
  | "pr-created"
  | "cleaned";
type FailureStage = "execution" | "cleanup" | "execution-and-cleanup";

type LocalConfigEntry = Readonly<{ key: string; value: string }>;

interface CommandRequest {
  executable: string;
  args: readonly string[];
  cwd: string;
  label: string;
  env: NodeJS.ProcessEnv;
  allowedExitCodes?: readonly number[];
}

interface CommandResult {
  stdout: string;
  exitCode: number;
}

interface GitHubRepositoryView {
  nameWithOwner?: string;
  defaultBranchRef?: { name?: string } | null;
  viewerPermission?: string;
  isFork?: boolean;
}

interface GitHubPullRequestView {
  number?: number;
  url?: string;
  baseRefName?: string;
  headRefName?: string;
  headRefOid?: string;
  title?: string;
  body?: string;
  state?: string;
  isDraft?: boolean;
  autoMergeRequest?: unknown;
  createdAt?: string;
}

interface CheckInvocation {
  executable: string;
  args: readonly string[];
  label: string;
}

export interface RegulatoryImplementationProductionOptions {
  repositoryRoot: string;
  /** Canonical absolute regular-file path to Git; PATH lookup is prohibited. */
  gitExecutable: string;
  /** Canonical absolute regular-file path to GitHub CLI; PATH lookup is prohibited. */
  githubCliExecutable: string;
  /** Canonical absolute real directory containing the authenticated gh host config. */
  githubCliConfigDir: string;
}

export type RegulatoryImplementationProductionBoundaryFailure = Readonly<{
  status: "production-boundary-failed";
  stage: FailureStage;
  priorResult?: RegulatoryImplementationExecutionResult;
  errors: readonly string[];
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  mergeStatus: "not-authorized";
}>;

export type RegulatoryImplementationProductionResult =
  | RegulatoryImplementationExecutionResult
  | RegulatoryImplementationProductionBoundaryFailure;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function productionBoundaryFailure(
  stage: FailureStage,
  priorResult?: RegulatoryImplementationExecutionResult
): RegulatoryImplementationProductionBoundaryFailure {
  const message =
    stage === "execution"
      ? "Controlled production adapter execution failed before a structured executor result was produced"
      : stage === "cleanup"
        ? "Controlled production adapter cleanup failed after a structured executor result was produced"
        : "Controlled production adapter execution and cleanup both failed";
  return deepFreeze({
    status: "production-boundary-failed" as const,
    stage,
    ...(priorResult ? { priorResult } : {}),
    errors: [message],
    ...PRODUCTION_BOUNDARY,
  });
}

function sha256(value: string | Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function commandFailure(label: string): Error {
  return new Error(`Controlled production adapter command failed: ${label}`);
}

function runCommand(request: CommandRequest): Promise<CommandResult> {
  const allowed = new Set(request.allowedExitCodes ?? [0]);
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      request.executable,
      [...request.args],
      {
        cwd: request.cwd,
        encoding: "utf8",
        env: request.env,
        maxBuffer: MAX_OUTPUT_BYTES,
        shell: false,
        windowsHide: true,
      },
      (error, stdout) => {
        const exitCode =
          error && typeof error.code === "number" ? error.code : error ? -1 : 0;
        if (!allowed.has(exitCode)) {
          rejectPromise(commandFailure(request.label));
          return;
        }
        const output = typeof stdout === "string" ? stdout : String(stdout ?? "");
        if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
          rejectPromise(commandFailure(request.label));
          return;
        }
        resolvePromise({ stdout: output, exitCode });
      }
    );
  });
}

function exactString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }
  return value.trim();
}

function normalizedJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Controlled production adapter returned invalid ${label}`);
  }
}

function validateCalendarParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  label: string
): number {
  if (
    year < 1970 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    millisecond < 0 ||
    millisecond > 999
  ) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }
  const local = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const check = new Date(local);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute ||
    check.getUTCSeconds() !== second ||
    check.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }
  return local;
}

function fractionToMilliseconds(value: string | undefined): number {
  return Number(`${value ?? ""}000`.slice(0, 3));
}

function normalizeGitHubInstant(value: unknown, label: string): string {
  const candidate = exactString(value, label);
  const match = GITHUB_INSTANT_RE.exec(candidate);
  if (!match) throw new Error(`Controlled production adapter ${label} is invalid`);
  const local = validateCalendarParts(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    fractionToMilliseconds(match[7]),
    label
  );
  return new Date(local).toISOString();
}

function normalizeGitStrictInstant(value: unknown, label: string): string {
  const candidate = exactString(value, label);
  const match = GIT_STRICT_INSTANT_RE.exec(candidate);
  if (!match) throw new Error(`Controlled production adapter ${label} is invalid`);
  const local = validateCalendarParts(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    fractionToMilliseconds(match[7]),
    label
  );
  let offsetMinutes = 0;
  if (match[8] !== "Z") {
    const offsetHours = Number(match[10]);
    const offsetRemainder = Number(match[11]);
    if (
      offsetHours > 14 ||
      offsetRemainder > 59 ||
      (offsetHours === 14 && offsetRemainder !== 0)
    ) {
      throw new Error(`Controlled production adapter ${label} is invalid`);
    }
    const direction = match[9] === "+" ? 1 : -1;
    offsetMinutes = direction * (offsetHours * 60 + offsetRemainder);
  }
  return new Date(local - offsetMinutes * 60_000).toISOString();
}

function normalizeOriginUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("Controlled production adapter origin URL is invalid");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Controlled production adapter origin must use canonical HTTPS");
  }
  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (
    pathname !== "/siricarsen-cmd/subshield" &&
    pathname !== "/siricarsen-cmd/subshield.git"
  ) {
    throw new Error("Controlled production adapter origin repository is invalid");
  }
  return EXPECTED_REPOSITORY;
}

function validateBranchName(value: string): string {
  const branch = value.trim();
  if (
    !branch ||
    branch.length > 200 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(branch) ||
    branch.includes("..") ||
    branch.includes("//") ||
    branch.includes("@{") ||
    branch.endsWith("/") ||
    branch.endsWith(".") ||
    branch.endsWith(".lock") ||
    /[\x00-\x20\x7f~^:?*[\\]/.test(branch)
  ) {
    throw new Error("Controlled production adapter target branch is invalid");
  }
  return branch;
}

function validateRepositoryPath(value: string): string {
  if (
    !ALLOWED_PATH_SET.has(value) ||
    isAbsolute(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new Error(`Controlled production adapter path is prohibited: ${value}`);
  }
  return value;
}

function unquoteConfigValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"')) return trimmed;
  if (!trimmed.endsWith('"') || trimmed.length < 2) {
    throw new Error("Controlled production adapter local Git config is malformed");
  }
  return trimmed
    .slice(1, -1)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseLocalGitConfig(source: string): LocalConfigEntry[] {
  let section = "";
  let subsection = "";
  const entries: LocalConfigEntry[] = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const sectionMatch = /^\[([A-Za-z0-9.-]+)(?:\s+"((?:[^"\\]|\\.)*)")?\]$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase();
      subsection = sectionMatch[2]
        ? sectionMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\")
        : "";
      continue;
    }
    if (!section) {
      throw new Error("Controlled production adapter local Git config is malformed");
    }
    const keyMatch = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=\s*(.*))?$/.exec(line);
    if (!keyMatch) {
      throw new Error("Controlled production adapter local Git config is malformed");
    }
    const key = `${section}${subsection ? `.${subsection}` : ""}.${keyMatch[1].toLowerCase()}`;
    const value = unquoteConfigValue(keyMatch[2] ?? "true");
    entries.push(Object.freeze({ key, value }));
  }
  return entries;
}

function validateLocalGitConfig(entries: readonly LocalConfigEntry[]): {
  fetchUrl: string;
  pushUrl: string;
} {
  const values = new Map<string, string[]>();
  for (const entry of entries) {
    const lower = entry.key.toLowerCase();
    if (
      lower.startsWith("include.") ||
      lower.startsWith("includeif.") ||
      (!ALLOWED_LOCAL_CONFIG_EXACT.has(lower) &&
        !ALLOWED_LOCAL_CONFIG_PATTERNS.some((pattern) => pattern.test(lower)))
    ) {
      throw new Error(`Controlled production adapter local Git config key is prohibited: ${entry.key}`);
    }
    const current = values.get(lower) ?? [];
    current.push(entry.value);
    values.set(lower, current);
  }
  for (const [key, configured] of values) {
    if (configured.length !== 1) {
      throw new Error(`Controlled production adapter local Git config key is duplicated: ${key}`);
    }
  }
  if ((values.get("core.bare")?.[0] ?? "false").toLowerCase() === "true") {
    throw new Error("Controlled production adapter bare repositories are prohibited");
  }
  const fetchUrls = values.get("remote.origin.url") ?? [];
  const pushUrls = values.get("remote.origin.pushurl") ?? fetchUrls;
  if (
    fetchUrls.length !== 1 ||
    pushUrls.length !== 1 ||
    normalizeOriginUrl(fetchUrls[0]) !== EXPECTED_REPOSITORY ||
    normalizeOriginUrl(pushUrls[0]) !== EXPECTED_REPOSITORY
  ) {
    throw new Error(
      "Controlled production adapter requires exactly one canonical HTTPS fetch and push endpoint"
    );
  }
  for (const [key, configured] of values) {
    if (key.startsWith("branch.") && key.endsWith(".remote") && configured[0] !== "origin") {
      throw new Error("Controlled production adapter branch remote must be origin");
    }
    if (
      key.startsWith("branch.") &&
      key.endsWith(".merge") &&
      !/^refs\/heads\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(configured[0])
    ) {
      throw new Error("Controlled production adapter branch merge ref is invalid");
    }
  }
  return { fetchUrl: fetchUrls[0], pushUrl: pushUrls[0] };
}

async function validateAbsoluteRegularFile(value: string, label: string): Promise<string> {
  if (!isAbsolute(value)) {
    throw new Error(`Controlled production adapter ${label} must be absolute`);
  }
  const requested = resolve(value);
  const requestedStat = await lstat(requested);
  if (!requestedStat.isFile() || requestedStat.isSymbolicLink()) {
    throw new Error(`Controlled production adapter ${label} must be a regular non-symlink file`);
  }
  const canonical = await realpath(requested);
  if (canonical !== requested) {
    throw new Error(`Controlled production adapter ${label} must be canonical`);
  }
  return canonical;
}

async function validateAbsoluteDirectory(value: string, label: string): Promise<string> {
  if (!isAbsolute(value)) {
    throw new Error(`Controlled production adapter ${label} must be absolute`);
  }
  const requested = resolve(value);
  const requestedStat = await lstat(requested);
  if (!requestedStat.isDirectory() || requestedStat.isSymbolicLink()) {
    throw new Error(`Controlled production adapter ${label} must be a regular non-symlink directory`);
  }
  const canonical = await realpath(requested);
  if (canonical !== requested) {
    throw new Error(`Controlled production adapter ${label} must be canonical`);
  }
  return canonical;
}

function minimalOsEnvironment(): NodeJS.ProcessEnv {
  const environment = {} as NodeJS.ProcessEnv;
  for (const key of ["SystemRoot", "SYSTEMROOT", "ComSpec", "PATHEXT", "WINDIR"]) {
    if (process.env[key]) environment[key] = process.env[key];
  }
  return environment;
}

function trustedPath(directories: readonly string[]): string {
  return [...new Set(directories)].join(process.platform === "win32" ? ";" : ":");
}

function buildGitEnvironment(request: {
  hooksPath: string;
  emptyGlobalConfig: string;
  emptySystemConfig: string;
  emptyAttributesFile: string;
  executableDirectories: readonly string[];
  authenticationToken?: string;
}): NodeJS.ProcessEnv {
  const environment = minimalOsEnvironment();
  environment.PATH = trustedPath(request.executableDirectories);
  if (process.platform === "win32") environment.Path = environment.PATH;
  environment.GIT_CONFIG_NOSYSTEM = "1";
  environment.GIT_CONFIG_GLOBAL = request.emptyGlobalConfig;
  environment.GIT_CONFIG_SYSTEM = request.emptySystemConfig;
  environment.GIT_TERMINAL_PROMPT = "0";
  environment.GCM_INTERACTIVE = "Never";
  environment.GIT_ASKPASS = "";
  environment.SSH_ASKPASS = "";
  const configuration: Array<[string, string]> = [
    ["core.hooksPath", request.hooksPath],
    ["core.attributesFile", request.emptyAttributesFile],
    ["core.fsmonitor", "false"],
    ["core.untrackedCache", "false"],
    ["core.sshCommand", ""],
    ["commit.gpgSign", "false"],
    ["tag.gpgSign", "false"],
    ["credential.helper", ""],
    ["credential.interactive", "never"],
    ["http.extraHeader", ""],
    ["http.proxy", ""],
    [`http.${CANONICAL_GIT_ENDPOINT}.proxy`, ""],
    ["http.sslVerify", "true"],
    [`http.${CANONICAL_GIT_ENDPOINT}.sslVerify`, "true"],
    ["http.followRedirects", "false"],
    [`http.${CANONICAL_GIT_ENDPOINT}.followRedirects`, "false"],
    ["http.cookieFile", ""],
    [`http.${CANONICAL_GIT_ENDPOINT}.cookieFile`, ""],
    ["protocol.allow", "never"],
    ["protocol.https.allow", "always"],
    ["protocol.ext.allow", "never"],
    ["protocol.file.allow", "never"],
    ["protocol.ssh.allow", "never"],
    ["protocol.git.allow", "never"],
  ];
  if (request.authenticationToken) {
    const authorization = Buffer.from(
      `x-access-token:${request.authenticationToken}`,
      "utf8"
    ).toString("base64");
    configuration.push([
      `http.${CANONICAL_GIT_ENDPOINT}.extraHeader`,
      `Authorization: Basic ${authorization}`,
    ]);
  }
  environment.GIT_CONFIG_COUNT = String(configuration.length);
  configuration.forEach(([key, value], index) => {
    environment[`GIT_CONFIG_KEY_${index}`] = key;
    environment[`GIT_CONFIG_VALUE_${index}`] = value;
  });
  return environment;
}

function buildGitHubEnvironment(
  configDir: string,
  executableDirectories: readonly string[],
  token?: string
): NodeJS.ProcessEnv {
  const environment = minimalOsEnvironment();
  environment.PATH = trustedPath(executableDirectories);
  if (process.platform === "win32") environment.Path = environment.PATH;
  environment.GH_CONFIG_DIR = configDir;
  environment.GH_HOST = "github.com";
  environment.GH_PROMPT_DISABLED = "1";
  if (token) {
    environment.GH_TOKEN = token;
    environment.GITHUB_TOKEN = token;
  }
  return environment;
}

function checkEnvironment(
  privateHome: string,
  nodeExecutable: string,
  repositoryRoot: string
): NodeJS.ProcessEnv {
  const environment = minimalOsEnvironment();
  const path = trustedPath([
    dirname(nodeExecutable),
    join(repositoryRoot, "node_modules", ".bin"),
  ]);
  environment.PATH = path;
  if (process.platform === "win32") environment.Path = path;
  environment.HOME = privateHome;
  environment.USERPROFILE = privateHome;
  environment.XDG_CONFIG_HOME = join(privateHome, "xdg-config");
  environment.XDG_CACHE_HOME = join(privateHome, "xdg-cache");
  environment.NPM_CONFIG_USERCONFIG = join(privateHome, "empty.npmrc");
  environment.npm_config_userconfig = environment.NPM_CONFIG_USERCONFIG;
  environment.NPM_CONFIG_GLOBALCONFIG = join(privateHome, "empty-global.npmrc");
  environment.npm_config_globalconfig = environment.NPM_CONFIG_GLOBALCONFIG;
  environment.NPM_CONFIG_CACHE = join(privateHome, "npm-cache");
  environment.npm_config_cache = environment.NPM_CONFIG_CACHE;
  environment.NPM_CONFIG_SCRIPT_SHELL = "";
  environment.npm_config_script_shell = "";
  environment.NPM_CONFIG_IGNORE_SCRIPTS = "true";
  environment.npm_config_ignore_scripts = "true";
  environment.CI = "1";
  environment.NODE_ENV = "production";
  environment.NEXT_TELEMETRY_DISABLED = "1";
  environment.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  environment.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  environment.NEXT_PUBLIC_SUPABASE_ANON_KEY = "ci-placeholder-anon-key";
  environment.SUPABASE_URL = "https://example.supabase.co";
  environment.SUPABASE_SERVICE_ROLE_KEY = "ci-placeholder-service-role-key";
  environment.STRIPE_SECRET_KEY = "sk_test_ci_placeholder";
  environment.STRIPE_WEBHOOK_SECRET = "whsec_ci_placeholder";
  environment.NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE = "price_ci_single";
  environment.NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN = "price_ci_active";
  environment.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN = "price_ci_enterprise";
  environment.OPENAI_API_KEY = "sk-ci-placeholder";
  environment.RESEND_API_KEY = "re_ci_placeholder";
  environment.CONTACT_FROM_EMAIL = "ci@example.com";
  environment.CONTACT_TO_EMAIL = "ci@example.com";
  return environment;
}

function testInvocation(
  nodeExecutable: string,
  repositoryRoot: string,
  worktreeRoot: string,
  relativeTestFile: string
): CheckInvocation {
  return {
    executable: nodeExecutable,
    args: [
      "--experimental-loader",
      join(repositoryRoot, TEST_LOADER),
      join(worktreeRoot, relativeTestFile),
    ],
    label: relativeTestFile,
  };
}

function buildCheckInvocations(
  command: string,
  nodeExecutable: string,
  repositoryRoot: string,
  worktreeRoot: string
): readonly CheckInvocation[] {
  switch (command) {
    case "npm run test:regulatory":
      return REGULATORY_TEST_FILES.map((file) =>
        testInvocation(nodeExecutable, repositoryRoot, worktreeRoot, file)
      );
    case "npm run test:accuracy":
      return ACCURACY_TEST_FILES.map((file) =>
        testInvocation(nodeExecutable, repositoryRoot, worktreeRoot, file)
      );
    case "npx tsc --noEmit":
      return [
        {
          executable: nodeExecutable,
          args: [join(repositoryRoot, "node_modules", "typescript", "bin", "tsc"), "--noEmit"],
          label: "TypeScript validation",
        },
      ];
    case "npm run build":
      return [
        {
          executable: nodeExecutable,
          args: [join(repositoryRoot, "node_modules", "next", "dist", "bin", "next"), "build"],
          label: "production build",
        },
      ];
    default:
      throw new Error("Controlled production adapter required check is not allowlisted");
  }
}

async function assertContainedPath(root: string, repositoryPath: string): Promise<string> {
  const validated = validateRepositoryPath(repositoryPath);
  const canonicalRoot = await realpath(root);
  const target = resolve(canonicalRoot, ...validated.split("/"));
  const containment = relative(canonicalRoot, target);
  if (
    !containment ||
    containment === ".." ||
    containment.startsWith(`..${sep}`) ||
    isAbsolute(containment)
  ) {
    throw new Error("Controlled production adapter path escaped its isolated worktree");
  }
  let current = canonicalRoot;
  for (const segment of validated.split("/").slice(0, -1)) {
    current = join(current, segment);
    try {
      const stats = await lstat(current);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error(
          "Controlled production adapter path contains a prohibited filesystem object"
        );
      }
      const canonical = await realpath(current);
      const parentContainment = relative(canonicalRoot, canonical);
      if (
        parentContainment === ".." ||
        parentContainment.startsWith(`..${sep}`) ||
        isAbsolute(parentContainment)
      ) {
        throw new Error("Controlled production adapter path escaped its isolated worktree");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(current, { mode: 0o700 });
      const created = await lstat(current);
      if (!created.isDirectory() || created.isSymbolicLink()) {
        throw new Error(
          "Controlled production adapter path contains a prohibited filesystem object"
        );
      }
    }
  }
  return target;
}

async function writeAtomicUtf8(target: string, content: string): Promise<void> {
  const temporary = `${target}.subshield-${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, { encoding: "utf8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, target);
}

class ProductionRegulatoryImplementationAdapter
  implements RegulatoryImplementationRepositoryAdapter
{
  private state: AdapterState = "created";
  private repositoryRoot?: string;
  private gitExecutable?: string;
  private githubCliExecutable?: string;
  private githubCliConfigDir?: string;
  private nodeExecutable?: string;
  private temporaryRoot?: string;
  private worktreeRoot?: string;
  private hooksPath?: string;
  private privateHome?: string;
  private emptyGlobalConfig?: string;
  private emptySystemConfig?: string;
  private emptyAttributesFile?: string;
  private localConfigPath?: string;
  private localConfigFingerprint?: string;
  private githubToken?: string;
  private trustedPrincipal?: string;
  private currentCommitSha?: string;
  private pullRequestCreatedAt?: string;
  private checkIndex = 0;
  private toolingLinked = false;
  private readonly writtenPaths = new Set<string>();
  private readonly branch: string;
  private readonly baseCommitSha: string;
  private readonly requiredChecks: readonly string[];

  constructor(
    private readonly options: RegulatoryImplementationProductionOptions,
    plan: RegulatoryRegistryImplementationPlan,
    bundle: RegulatoryImplementationPullRequestBundle
  ) {
    this.branch = validateBranchName(plan.targetBranch);
    this.baseCommitSha = plan.baseCommitSha;
    this.requiredChecks = [...bundle.requiredChecks];
    if (!COMMIT_SHA_RE.test(this.baseCommitSha)) {
      throw new Error("Controlled production adapter reviewed base commit is invalid");
    }
    if (
      this.requiredChecks.length !== REQUIRED_CHECKS.length ||
      this.requiredChecks.some((value, index) => value !== REQUIRED_CHECKS[index])
    ) {
      throw new Error("Controlled production adapter requires the exact approved check sequence");
    }
    const bundlePaths = bundle.files.map((file) => file.path).sort();
    const planPaths = [...new Set(plan.steps.map((step) => step.targetFile))].sort();
    if (
      bundle.baseCommitSha !== plan.baseCommitSha ||
      bundle.targetBranch !== plan.targetBranch ||
      bundle.planId !== plan.planId ||
      bundle.planChecksum !== plan.planChecksum ||
      bundlePaths.length === 0 ||
      bundlePaths.length !== new Set(bundlePaths).size ||
      JSON.stringify(bundlePaths) !== JSON.stringify(planPaths)
    ) {
      throw new Error("Controlled production adapter plan and bundle identities do not match");
    }
    for (const file of bundle.files) {
      validateRepositoryPath(file.path);
      if (
        !CHECKSUM_RE.test(file.beforeChecksum) ||
        !CHECKSUM_RE.test(file.afterChecksum) ||
        sha256(file.content) !== file.afterChecksum ||
        file.beforeChecksum === file.afterChecksum
      ) {
        throw new Error("Controlled production adapter bundle file checksum is invalid");
      }
    }
  }

  private assertState(...allowed: AdapterState[]): void {
    if (!allowed.includes(this.state)) {
      throw new Error("Controlled production adapter operation is out of sequence");
    }
  }

  private root(): string {
    if (!this.repositoryRoot) throw new Error("Controlled repository root is unavailable");
    return this.repositoryRoot;
  }

  private worktree(): string {
    if (!this.worktreeRoot) throw new Error("Controlled worktree is unavailable");
    return this.worktreeRoot;
  }

  private async initializeRuntime(): Promise<void> {
    if (this.temporaryRoot) return;
    this.repositoryRoot = await validateAbsoluteDirectory(
      this.options.repositoryRoot,
      "repository root"
    );
    this.gitExecutable = await validateAbsoluteRegularFile(
      this.options.gitExecutable,
      "Git executable"
    );
    this.githubCliExecutable = await validateAbsoluteRegularFile(
      this.options.githubCliExecutable,
      "GitHub CLI executable"
    );
    this.githubCliConfigDir = await validateAbsoluteDirectory(
      this.options.githubCliConfigDir,
      "GitHub CLI config directory"
    );
    this.nodeExecutable = await validateAbsoluteRegularFile(process.execPath, "Node executable");

    const gitMarker = join(this.repositoryRoot, ".git");
    const gitMarkerStat = await lstat(gitMarker);
    if (!gitMarkerStat.isDirectory() || gitMarkerStat.isSymbolicLink()) {
      throw new Error("Controlled production adapter requires a canonical primary Git worktree");
    }
    this.localConfigPath = join(gitMarker, "config");
    const configStat = await lstat(this.localConfigPath);
    if (!configStat.isFile() || configStat.isSymbolicLink()) {
      throw new Error("Controlled production adapter local Git config is invalid");
    }
    const configBytes = await readFile(this.localConfigPath);
    validateLocalGitConfig(parseLocalGitConfig(configBytes.toString("utf8")));
    this.localConfigFingerprint = sha256(configBytes);

    this.temporaryRoot = await mkdtemp(join(tmpdir(), "subshield-regulatory-production-"));
    this.hooksPath = join(this.temporaryRoot, "disabled-hooks");
    this.privateHome = join(this.temporaryRoot, "private-home");
    await mkdir(this.hooksPath, { mode: 0o700 });
    await mkdir(this.privateHome, { mode: 0o700 });
    await mkdir(join(this.privateHome, "xdg-config"), { mode: 0o700 });
    await mkdir(join(this.privateHome, "xdg-cache"), { mode: 0o700 });
    await mkdir(join(this.privateHome, "npm-cache"), { mode: 0o700 });
    this.emptyGlobalConfig = join(this.temporaryRoot, "empty-global.gitconfig");
    this.emptySystemConfig = join(this.temporaryRoot, "empty-system.gitconfig");
    this.emptyAttributesFile = join(this.temporaryRoot, "empty-attributes");
    for (const path of [
      this.emptyGlobalConfig,
      this.emptySystemConfig,
      this.emptyAttributesFile,
      join(this.privateHome, "empty.npmrc"),
      join(this.privateHome, "empty-global.npmrc"),
    ]) {
      const handle = await open(path, "wx", 0o600);
      await handle.close();
    }

    await this.assertToolingFiles();
  }

  private async assertToolingFiles(): Promise<void> {
    const root = this.root();
    for (const path of [
      TEST_LOADER,
      ...REGULATORY_TEST_FILES,
      ...ACCURACY_TEST_FILES,
      "node_modules/typescript/bin/tsc",
      "node_modules/next/dist/bin/next",
    ]) {
      await validateAbsoluteRegularFile(join(root, path), `tooling file ${path}`);
    }
  }

  private async assertLocalConfigUnchanged(): Promise<void> {
    if (!this.localConfigPath || !this.localConfigFingerprint) {
      throw new Error("Controlled production adapter local Git config was not bound");
    }
    const stat = await lstat(this.localConfigPath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Controlled production adapter local Git config changed");
    }
    const bytes = await readFile(this.localConfigPath);
    if (sha256(bytes) !== this.localConfigFingerprint) {
      throw new Error("Controlled production adapter local Git config changed after preflight");
    }
  }

  private gitEnvironment(authenticated = false): NodeJS.ProcessEnv {
    if (
      !this.hooksPath ||
      !this.emptyGlobalConfig ||
      !this.emptySystemConfig ||
      !this.emptyAttributesFile ||
      !this.gitExecutable ||
      !this.nodeExecutable
    ) {
      throw new Error("Controlled production adapter Git runtime is unavailable");
    }
    if (authenticated && !this.githubToken) {
      throw new Error("Controlled production adapter authenticated Git transport is unavailable");
    }
    return buildGitEnvironment({
      hooksPath: this.hooksPath,
      emptyGlobalConfig: this.emptyGlobalConfig,
      emptySystemConfig: this.emptySystemConfig,
      emptyAttributesFile: this.emptyAttributesFile,
      executableDirectories: [dirname(this.gitExecutable), dirname(this.nodeExecutable)],
      authenticationToken: authenticated ? this.githubToken : undefined,
    });
  }

  private async git(
    args: readonly string[],
    request: {
      cwd?: string;
      label: string;
      allowedExitCodes?: readonly number[];
      authenticated?: boolean;
    }
  ): Promise<CommandResult> {
    await this.assertLocalConfigUnchanged();
    if (!this.gitExecutable || !this.hooksPath) {
      throw new Error("Controlled production adapter Git executable is unavailable");
    }
    return runCommand({
      executable: this.gitExecutable,
      args: [
        "-c",
        `core.hooksPath=${this.hooksPath}`,
        "-c",
        "commit.gpgSign=false",
        "-c",
        "tag.gpgSign=false",
        ...args,
      ],
      cwd: request.cwd ?? this.root(),
      label: request.label,
      env: this.gitEnvironment(request.authenticated === true),
      allowedExitCodes: request.allowedExitCodes,
    });
  }

  private async gh(
    args: readonly string[],
    label: string,
    authenticated = true
  ): Promise<CommandResult> {
    if (!this.githubCliExecutable || !this.githubCliConfigDir) {
      throw new Error("Controlled production adapter GitHub CLI runtime is unavailable");
    }
    if (authenticated && !this.githubToken) {
      throw new Error("Controlled production adapter authenticated GitHub context is unavailable");
    }
    return runCommand({
      executable: this.githubCliExecutable,
      args,
      cwd: this.root(),
      label,
      env: buildGitHubEnvironment(
        this.githubCliConfigDir,
        [dirname(this.githubCliExecutable)],
        authenticated ? this.githubToken : undefined
      ),
    });
  }

  async inspectRepository(): Promise<RegulatoryImplementationRepositoryState> {
    this.assertState("created");
    await this.initializeRuntime();
    const observedRoot = await realpath(
      exactString(
        (
          await this.git(["rev-parse", "--show-toplevel"], {
            label: "inspect repository root",
          })
        ).stdout,
        "repository root"
      )
    );
    if (observedRoot !== this.root()) {
      throw new Error("Controlled production adapter repository root does not match");
    }

    const token = exactString(
      (
        await this.gh(
          ["auth", "token", "--hostname", "github.com"],
          "read authenticated GitHub token",
          false
        )
      ).stdout,
      "authenticated GitHub token"
    );
    if (/[\x00-\x20\x7f]/.test(token)) {
      throw new Error("Controlled production adapter authenticated GitHub token is invalid");
    }
    this.githubToken = token;

    const login = exactString(
      (
        await this.gh(
          ["api", "--hostname", "github.com", "user", "--jq", ".login"],
          "read authenticated principal"
        )
      ).stdout,
      "authenticated principal"
    );
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(login)) {
      throw new Error("Controlled production adapter authenticated principal is invalid");
    }

    const repository = normalizedJson<GitHubRepositoryView>(
      (
        await this.gh(
          [
            "repo",
            "view",
            EXPECTED_REPOSITORY,
            "--json",
            "nameWithOwner,defaultBranchRef,viewerPermission,isFork",
          ],
          "inspect authenticated repository"
        )
      ).stdout,
      "repository response"
    );
    if (
      repository.nameWithOwner !== EXPECTED_REPOSITORY ||
      repository.isFork !== false ||
      repository.defaultBranchRef?.name !== EXPECTED_DEFAULT_BRANCH ||
      !repository.viewerPermission ||
      !SAFE_PERMISSION.has(repository.viewerPermission)
    ) {
      throw new Error("Controlled production adapter authenticated repository is invalid");
    }
    this.trustedPrincipal = `github-user:${login.toLowerCase()}`;
    this.state = "preflighted";
    return {
      repositoryFullName: EXPECTED_REPOSITORY,
      defaultBranch: EXPECTED_DEFAULT_BRANCH,
    };
  }

  async readDefaultBranchHead(): Promise<string> {
    this.assertState("preflighted", "checked", "pushed");
    const output = (
      await this.git(
        [
          "ls-remote",
          "--exit-code",
          "--refs",
          CANONICAL_GIT_ENDPOINT,
          `refs/heads/${EXPECTED_DEFAULT_BRANCH}`,
        ],
        { label: "read authenticated default branch head", authenticated: true }
      )
    ).stdout.trim();
    const match = /^([a-f0-9]{40})\s+refs\/heads\/main$/.exec(output);
    if (!match) throw new Error("Controlled production adapter default branch head is invalid");
    return match[1];
  }

  async readTrustedPrincipal(): Promise<string> {
    this.assertState(
      "preflighted",
      "branch-created",
      "files-written",
      "committed",
      "checking",
      "checked",
      "pushed",
      "pr-created"
    );
    if (!this.trustedPrincipal) {
      throw new Error("Controlled production adapter trusted principal is unavailable");
    }
    return this.trustedPrincipal;
  }

  async commitExists(commitSha: string): Promise<boolean> {
    this.assertState("preflighted");
    if (!COMMIT_SHA_RE.test(commitSha)) return false;
    const result = await this.git(["cat-file", "-e", `${commitSha}^{commit}`], {
      label: "verify reviewed commit",
      allowedExitCodes: [0, 1, 128],
    });
    return result.exitCode === 0;
  }

  async readFileAtCommit(commitSha: string, path: string): Promise<string> {
    this.assertState("preflighted");
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error("Controlled production adapter reviewed commit is invalid");
    }
    const validated = validateRepositoryPath(path);
    return (
      await this.git(["show", `${commitSha}:${validated}`], {
        label: "read reviewed file",
      })
    ).stdout;
  }

  async branchExists(branch: string): Promise<boolean> {
    this.assertState("preflighted");
    const validated = validateBranchName(branch);
    if (validated !== this.branch) {
      throw new Error("Controlled production adapter branch inspection is unauthorized");
    }
    const local = await this.git(
      ["show-ref", "--verify", "--quiet", `refs/heads/${validated}`],
      { label: "inspect local branch", allowedExitCodes: [0, 1] }
    );
    if (local.exitCode === 0) return true;
    const remote = await this.git(
      [
        "ls-remote",
        "--exit-code",
        "--refs",
        CANONICAL_GIT_ENDPOINT,
        `refs/heads/${validated}`,
      ],
      {
        label: "inspect authenticated remote branch",
        authenticated: true,
        allowedExitCodes: [0, 2],
      }
    );
    return remote.exitCode === 0;
  }

  async findPullRequestByHead(
    branch: string
  ): Promise<RegulatoryImplementationPullRequestRecord | null> {
    this.assertState("preflighted");
    const validated = validateBranchName(branch);
    if (validated !== this.branch) {
      throw new Error("Controlled production adapter pull-request inspection is unauthorized");
    }
    const values = normalizedJson<GitHubPullRequestView[]>(
      (
        await this.gh(
          [
            "pr",
            "list",
            "--repo",
            EXPECTED_REPOSITORY,
            "--head",
            validated,
            "--state",
            "all",
            "--limit",
            "2",
            "--json",
            "number,url,baseRefName,headRefName,headRefOid,title,body,state,isDraft,autoMergeRequest,createdAt",
          ],
          "inspect pull requests"
        )
      ).stdout,
      "pull-request list"
    );
    if (!Array.isArray(values) || values.length > 1) {
      throw new Error("Controlled production adapter found duplicate pull requests");
    }
    return values.length === 0 ? null : this.pullRequestRecord(values[0]);
  }

  async createBranch(branch: string, baseCommitSha: string): Promise<void> {
    this.assertState("preflighted");
    if (
      validateBranchName(branch) !== this.branch ||
      baseCommitSha !== this.baseCommitSha ||
      !this.temporaryRoot
    ) {
      throw new Error("Controlled production adapter branch request is unauthorized");
    }
    this.worktreeRoot = join(this.temporaryRoot, "worktree");
    await this.git(
      [
        "worktree",
        "add",
        "--no-track",
        "-b",
        this.branch,
        this.worktreeRoot,
        baseCommitSha,
      ],
      { label: "create isolated worktree" }
    );
    const observed = await realpath(this.worktreeRoot);
    const temporary = await realpath(this.temporaryRoot);
    const containment = relative(temporary, observed);
    if (
      !containment ||
      containment === ".." ||
      containment.startsWith(`..${sep}`) ||
      isAbsolute(containment)
    ) {
      throw new Error("Controlled production adapter worktree escaped its temporary root");
    }
    const head = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: observed,
          label: "verify isolated worktree base",
        })
      ).stdout,
      "isolated worktree base"
    );
    if (head !== baseCommitSha) {
      throw new Error("Controlled production adapter isolated worktree base changed");
    }
    this.state = "branch-created";
  }

  async writeFile(branch: string, path: string, content: string): Promise<void> {
    this.assertState("branch-created", "files-written");
    if (branch !== this.branch || this.writtenPaths.has(path)) {
      throw new Error("Controlled production adapter file write is unauthorized");
    }
    const target = await assertContainedPath(this.worktree(), path);
    const existing = await lstat(target);
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error("Controlled production adapter target is not a regular file");
    }
    await writeAtomicUtf8(target, content);
    if ((await readFile(target, "utf8")) !== content) {
      throw new Error("Controlled production adapter written bytes do not reproduce");
    }
    this.writtenPaths.add(path);
    this.state = "files-written";
  }

  async listChangedFiles(branch: string): Promise<readonly string[]> {
    this.assertState("files-written");
    if (branch !== this.branch) {
      throw new Error("Controlled production adapter worktree branch is invalid");
    }
    const output = (
      await this.git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
        cwd: this.worktree(),
        label: "inspect isolated worktree",
      })
    ).stdout;
    const changed: string[] = [];
    for (const entry of output.split("\0").filter(Boolean)) {
      if (entry.length < 4 || /^[RC]/.test(entry.slice(0, 2))) {
        throw new Error("Controlled production adapter observed an unsupported Git change");
      }
      changed.push(validateRepositoryPath(entry.slice(3)));
    }
    return changed;
  }

  private async stageFileWithoutFilters(path: string): Promise<void> {
    const validated = validateRepositoryPath(path);
    const blobSha = exactString(
      (
        await this.git(["hash-object", "-w", "--no-filters", "--", validated], {
          cwd: this.worktree(),
          label: "hash authorized file without filters",
        })
      ).stdout,
      "authorized blob"
    );
    if (!COMMIT_SHA_RE.test(blobSha)) {
      throw new Error("Controlled production adapter authorized blob is invalid");
    }
    const treeLine = (
      await this.git(["ls-tree", this.baseCommitSha, "--", validated], {
        cwd: this.worktree(),
        label: "read reviewed file mode",
      })
    ).stdout.trim();
    const modeMatch = /^(100644|100755)\s+blob\s+[a-f0-9]{40}\t/.exec(treeLine);
    if (!modeMatch) {
      throw new Error("Controlled production adapter reviewed file mode is invalid");
    }
    await this.git(
      ["update-index", "--add", "--cacheinfo", modeMatch[1], blobSha, validated],
      { cwd: this.worktree(), label: "stage authorized blob without filters" }
    );
  }

  async createCommit(branch: string, message: string): Promise<string> {
    this.assertState("files-written");
    if (
      branch !== this.branch ||
      this.writtenPaths.size === 0 ||
      !message.trim() ||
      /[\x00\x7f]/.test(message)
    ) {
      throw new Error("Controlled production adapter commit request is invalid");
    }
    const paths = [...this.writtenPaths].sort();
    for (const path of paths) await this.stageFileWithoutFilters(path);
    const staged = (
      await this.git(["diff", "--cached", "--name-only", "--no-renames", "-z", "--"], {
        cwd: this.worktree(),
        label: "inspect staged files",
      })
    ).stdout
      .split("\0")
      .filter(Boolean)
      .sort();
    if (JSON.stringify(staged) !== JSON.stringify(paths)) {
      throw new Error("Controlled production adapter staged file set is invalid");
    }
    const commitDate = normalizeGitStrictInstant(
      (
        await this.git(["show", "-s", "--format=%cI", this.baseCommitSha], {
          cwd: this.worktree(),
          label: "read deterministic commit date",
        })
      ).stdout,
      "deterministic commit date"
    );
    const environment = this.gitEnvironment(false);
    environment.GIT_AUTHOR_NAME = "SubShield Regulatory Executor";
    environment.GIT_AUTHOR_EMAIL = "regulatory-executor@subshield.invalid";
    environment.GIT_COMMITTER_NAME = "SubShield Regulatory Executor";
    environment.GIT_COMMITTER_EMAIL = "regulatory-executor@subshield.invalid";
    environment.GIT_AUTHOR_DATE = commitDate;
    environment.GIT_COMMITTER_DATE = commitDate;
    if (!this.gitExecutable || !this.hooksPath) {
      throw new Error("Controlled production adapter Git runtime is unavailable");
    }
    await this.assertLocalConfigUnchanged();
    await runCommand({
      executable: this.gitExecutable,
      args: [
        "-c",
        `core.hooksPath=${this.hooksPath}`,
        "-c",
        "commit.gpgSign=false",
        "-c",
        "tag.gpgSign=false",
        "commit",
        "--no-verify",
        "--no-gpg-sign",
        "-m",
        message,
        "--",
        ...paths,
      ],
      cwd: this.worktree(),
      label: "create authorized commit",
      env: environment,
    });
    const commitSha = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: this.worktree(),
          label: "read created commit",
        })
      ).stdout,
      "created commit"
    );
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error("Controlled production adapter created commit is invalid");
    }
    this.currentCommitSha = commitSha;
    this.state = "committed";
    return commitSha;
  }

  async inspectCommit(commitSha: string): Promise<RegulatoryImplementationCommitRecord> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha) {
      throw new Error("Controlled production adapter commit inspection is unauthorized");
    }
    const raw = (
      await this.git(["cat-file", "commit", commitSha], {
        cwd: this.worktree(),
        label: "inspect created commit record",
      })
    ).stdout;
    const boundary = raw.indexOf("\n\n");
    if (boundary < 0) throw new Error("Controlled production adapter commit record is invalid");
    const headers = raw.slice(0, boundary).split("\n");
    return {
      parentCommitShas: headers
        .filter((line) => line.startsWith("parent "))
        .map((line) => line.slice(7)),
      message: raw.slice(boundary + 2).replace(/\n$/, ""),
    };
  }

  async listCommitChangedFiles(
    commitSha: string,
    baseCommitSha: string
  ): Promise<readonly string[]> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha || baseCommitSha !== this.baseCommitSha) {
      throw new Error("Controlled production adapter commit diff is unauthorized");
    }
    return (
      await this.git(
        ["diff", "--name-only", "--no-renames", "-z", baseCommitSha, commitSha, "--"],
        { cwd: this.worktree(), label: "inspect created commit paths" }
      )
    ).stdout
      .split("\0")
      .filter(Boolean)
      .map(validateRepositoryPath);
  }

  async readFileFromCommit(commitSha: string, path: string): Promise<string> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha) {
      throw new Error("Controlled production adapter committed file read is unauthorized");
    }
    const validated = validateRepositoryPath(path);
    return (
      await this.git(["show", `${commitSha}:${validated}`], {
        cwd: this.worktree(),
        label: "read created commit file",
      })
    ).stdout;
  }

  private async ensureWorktreeToolingLink(): Promise<void> {
    if (this.toolingLinked) return;
    const sourceNodeModules = await validateAbsoluteDirectory(
      join(this.root(), "node_modules"),
      "installed dependency directory"
    );
    const targetNodeModules = join(this.worktree(), "node_modules");
    try {
      await lstat(targetNodeModules);
      throw new Error("Controlled production adapter worktree node_modules path already exists");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await symlink(
      sourceNodeModules,
      targetNodeModules,
      process.platform === "win32" ? "junction" : "dir"
    );
    const linked = await lstat(targetNodeModules);
    if (!linked.isSymbolicLink()) {
      throw new Error("Controlled production adapter tooling link is invalid");
    }
    this.toolingLinked = true;
  }

  private async assertImmutablePackageMetadata(): Promise<void> {
    const reviewed = (
      await this.git(["show", `${this.baseCommitSha}:package.json`], {
        cwd: this.worktree(),
        label: "read reviewed package metadata",
      })
    ).stdout;
    const current = await readFile(join(this.worktree(), "package.json"), "utf8");
    if (current !== reviewed) {
      throw new Error("Controlled production adapter package metadata changed after review");
    }
  }

  async runCheck(
    command: string,
    commitSha: string
  ): Promise<RegulatoryImplementationCheckResult> {
    this.assertState("committed", "checking");
    if (
      commitSha !== this.currentCommitSha ||
      command !== this.requiredChecks[this.checkIndex] ||
      !this.nodeExecutable ||
      !this.privateHome
    ) {
      throw new Error("Controlled production adapter required check is out of sequence");
    }
    const head = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: this.worktree(),
          label: "bind check to commit",
        })
      ).stdout,
      "check commit"
    );
    if (head !== commitSha) {
      throw new Error("Controlled production adapter worktree moved before checks");
    }
    await this.assertImmutablePackageMetadata();
    await this.assertToolingFiles();
    await this.ensureWorktreeToolingLink();
    this.state = "checking";
    const invocations = buildCheckInvocations(
      command,
      this.nodeExecutable,
      this.root(),
      this.worktree()
    );
    let conclusion: "success" | "failure" = "success";
    for (const invocation of invocations) {
      try {
        await runCommand({
          executable: invocation.executable,
          args: invocation.args,
          cwd: this.worktree(),
          label: invocation.label,
          env: checkEnvironment(this.privateHome, this.nodeExecutable, this.root()),
        });
      } catch {
        conclusion = "failure";
        break;
      }
    }
    this.checkIndex += 1;
    if (this.checkIndex === this.requiredChecks.length && conclusion === "success") {
      this.state = "checked";
    }
    return { command, commitSha, conclusion };
  }

  async pushBranch(branch: string, commitSha: string, force: false): Promise<void> {
    this.assertState("checked");
    if (
      branch !== this.branch ||
      commitSha !== this.currentCommitSha ||
      force !== false
    ) {
      throw new Error("Controlled production adapter push request is unauthorized");
    }
    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error("Controlled production adapter default branch moved before push");
    }
    const targetRef = `refs/heads/${branch}`;
    await this.git(
      [
        "push",
        "--porcelain",
        `--force-with-lease=${targetRef}:`,
        CANONICAL_GIT_ENDPOINT,
        `${commitSha}:${targetRef}`,
      ],
      {
        cwd: this.worktree(),
        label: "atomically create implementation branch",
        authenticated: true,
      }
    );
    const remote = (
      await this.git(
        ["ls-remote", "--exit-code", "--refs", CANONICAL_GIT_ENDPOINT, targetRef],
        { label: "verify pushed branch", authenticated: true }
      )
    ).stdout.trim();
    if (remote !== `${commitSha}\t${targetRef}`) {
      throw new Error("Controlled production adapter pushed branch does not match the commit");
    }
    this.state = "pushed";
  }

  async createPullRequest(request: {
    baseBranch: string;
    headBranch: string;
    headCommitSha: string;
    title: string;
    body: string;
    autoMergeEnabled: false;
  }): Promise<RegulatoryImplementationPullRequestRecord> {
    this.assertState("pushed");
    if (
      request.baseBranch !== EXPECTED_DEFAULT_BRANCH ||
      request.headBranch !== this.branch ||
      request.headCommitSha !== this.currentCommitSha ||
      request.autoMergeEnabled !== false ||
      !this.temporaryRoot
    ) {
      throw new Error("Controlled production adapter pull-request request is unauthorized");
    }
    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error("Controlled production adapter default branch moved before pull request");
    }
    if (await this.findPullRequestAfterPush(this.branch)) {
      throw new Error("Controlled production adapter pull request already exists");
    }
    const bodyPath = join(this.temporaryRoot, `pr-body-${randomUUID()}.md`);
    const handle = await open(bodyPath, "wx", 0o600);
    try {
      await handle.writeFile(request.body, "utf8");
    } finally {
      await handle.close();
    }
    let createdUrl: string;
    try {
      createdUrl = exactString(
        (
          await this.gh(
            [
              "pr",
              "create",
              "--repo",
              EXPECTED_REPOSITORY,
              "--base",
              request.baseBranch,
              "--head",
              request.headBranch,
              "--title",
              request.title,
              "--body-file",
              bodyPath,
            ],
            "create implementation pull request"
          )
        ).stdout,
        "created pull-request URL"
      );
    } finally {
      await rm(bodyPath, { force: true });
    }
    const match = /^https:\/\/github\.com\/siricarsen-cmd\/subshield\/pull\/([1-9]\d*)$/.exec(
      createdUrl
    );
    if (!match) throw new Error("Controlled production adapter created PR URL is invalid");
    const number = Number(match[1]);
    const refetched = normalizedJson<GitHubPullRequestView>(
      (
        await this.gh(
          [
            "pr",
            "view",
            String(number),
            "--repo",
            EXPECTED_REPOSITORY,
            "--json",
            "number,url,baseRefName,headRefName,headRefOid,title,body,state,isDraft,autoMergeRequest,createdAt",
          ],
          "refetch implementation pull request"
        )
      ).stdout,
      "pull-request refetch"
    );
    const record = this.pullRequestRecord(refetched);
    if (
      record.number !== number ||
      record.url !== createdUrl ||
      record.baseBranch !== request.baseBranch ||
      record.headBranch !== request.headBranch ||
      record.headCommitSha !== request.headCommitSha ||
      record.title !== request.title ||
      record.body !== request.body ||
      record.state !== "OPEN" ||
      record.isDraft !== false ||
      record.autoMergeEnabled !== false
    ) {
      throw new Error("Controlled production adapter refetched pull request does not match");
    }
    this.pullRequestCreatedAt = record.createdAt;
    this.state = "pr-created";
    return record;
  }

  private async findPullRequestAfterPush(branch: string): Promise<boolean> {
    const values = normalizedJson<unknown[]>(
      (
        await this.gh(
          [
            "pr",
            "list",
            "--repo",
            EXPECTED_REPOSITORY,
            "--head",
            branch,
            "--state",
            "all",
            "--limit",
            "1",
            "--json",
            "number",
          ],
          "inspect duplicate pull request"
        )
      ).stdout,
      "pull-request list"
    );
    return Array.isArray(values) && values.length > 0;
  }

  private pullRequestRecord(value: GitHubPullRequestView): RegulatoryImplementationPullRequestRecord {
    if (!Number.isSafeInteger(value.number) || Number(value.number) <= 0) {
      throw new Error("Controlled production adapter pull-request number is invalid");
    }
    const number = Number(value.number);
    const url = exactString(value.url, "pull-request URL");
    if (url !== `https://github.com/${EXPECTED_REPOSITORY}/pull/${number}`) {
      throw new Error("Controlled production adapter pull-request URL is invalid");
    }
    if (typeof value.isDraft !== "boolean") {
      throw new Error("Controlled production adapter pull-request draft state is invalid");
    }
    return {
      number,
      url,
      baseBranch: exactString(value.baseRefName, "pull-request base"),
      headBranch: exactString(value.headRefName, "pull-request head"),
      headCommitSha: exactString(value.headRefOid, "pull-request head commit"),
      title: exactString(value.title, "pull-request title"),
      body: typeof value.body === "string" ? value.body : "",
      autoMergeEnabled: value.autoMergeRequest != null,
      state: exactString(value.state, "pull-request state"),
      isDraft: value.isDraft,
      createdAt: normalizeGitHubInstant(value.createdAt, "pull-request createdAt"),
    };
  }

  async readTrustedClock(): Promise<string> {
    this.assertState("pr-created");
    if (!this.pullRequestCreatedAt) {
      throw new Error("Controlled production adapter trusted clock is unavailable");
    }
    return this.pullRequestCreatedAt;
  }

  async cleanup(): Promise<void> {
    if (this.state === "cleaned") return;
    this.githubToken = undefined;
    const failures: string[] = [];
    if (this.worktreeRoot) {
      try {
        await this.git(["worktree", "remove", "--force", this.worktreeRoot], {
          label: "remove isolated worktree",
        });
        try {
          await lstat(this.worktreeRoot);
          failures.push("worktree-removal-verification");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            failures.push("worktree-removal-verification");
          }
        }
      } catch {
        failures.push("worktree-remove");
      }
      try {
        await this.git(["worktree", "prune"], {
          label: "prune isolated worktree metadata",
        });
      } catch {
        failures.push("worktree-prune");
      }
    }
    if (this.temporaryRoot) {
      try {
        await rm(this.temporaryRoot, { recursive: true, force: true });
      } catch {
        failures.push("temporary-runtime-remove");
      }
    }
    this.state = "cleaned";
    if (failures.length > 0) {
      throw new Error("Controlled production adapter cleanup failed");
    }
  }
}

/** Pure, non-mutating helpers exposed only for deterministic security tests. */
export const regulatoryImplementationProductionAdapterTestSurface = Object.freeze({
  allowedPaths: [...ALLOWED_PATHS],
  requiredChecks: [...REQUIRED_CHECKS],
  regulatoryTestFiles: [...REGULATORY_TEST_FILES],
  accuracyTestFiles: [...ACCURACY_TEST_FILES],
  normalizeOriginUrl,
  normalizeGitHubInstant,
  normalizeGitStrictInstant,
  validateBranchName,
  validateRepositoryPath,
  parseLocalGitConfig,
  validateLocalGitConfig,
  buildCheckInvocations,
  productionBoundaryFailure,
});

export async function executeRegulatoryImplementationWithProductionAdapter(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  options: RegulatoryImplementationProductionOptions
): Promise<RegulatoryImplementationProductionResult> {
  let adapter: ProductionRegulatoryImplementationAdapter;
  try {
    adapter = new ProductionRegulatoryImplementationAdapter(options, plan, bundle);
  } catch {
    return productionBoundaryFailure("execution");
  }

  let result: RegulatoryImplementationExecutionResult | undefined;
  let executionFailed = false;
  try {
    result = await executeRegulatoryImplementationPullRequest(plan, bundle, adapter);
  } catch {
    executionFailed = true;
  }

  let cleanupFailed = false;
  try {
    await adapter.cleanup();
  } catch {
    cleanupFailed = true;
  }

  if (executionFailed || cleanupFailed) {
    return productionBoundaryFailure(
      executionFailed && cleanupFailed
        ? "execution-and-cleanup"
        : executionFailed
          ? "execution"
          : "cleanup",
      result
    );
  }
  return result ?? productionBoundaryFailure("execution");
}
