export function parseImportMetaUrlPath(
  importMetaUrl: string,
): string | undefined {
  return importMetaUrl.split(".")[0].split("/").pop();
}
