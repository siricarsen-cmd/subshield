const TARGET = "/lib/regulatory/registry-implementation-merge-production-adapter.ts";

export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context);
  if (!url.endsWith(TARGET)) return loaded;
  const source =
    typeof loaded.source === "string"
      ? loaded.source
      : Buffer.from(loaded.source).toString("utf8");
  const marker = "const runtimePaths = TRUSTED_RUNTIME_PATHS;";
  if (!source.includes(marker)) {
    throw new Error("Regulatory merge test runtime seam did not match production source");
  }
  return {
    ...loaded,
    source: source.replace(
      marker,
      "const runtimePaths = arguments[0];"
    ),
  };
}
