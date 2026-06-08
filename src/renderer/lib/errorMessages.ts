export function formatUserFacingError(caught: unknown): string {
  const rawMessage = caught instanceof Error ? caught.message : String(caught || "");
  const message = stripElectronIpcPrefix(rawMessage);

  if (message.includes("ENOENT") || message.includes("no such file or directory")) {
    return "That file or folder could not be found. It may have been moved, renamed, or deleted.";
  }
  if (message.includes("Campaign metadata could not be read")) {
    return message;
  }
  if (message.includes("Unsupported map type")) {
    return "That map file type is not supported. Use JPG, PNG, WebP, GIF, MP4, or WebM.";
  }
  if (message.includes("Unsupported token type")) {
    return "That token file type is not supported. Use JPG, PNG, WebP, or GIF.";
  }
  if (message.includes("Unable to generate token thumbnail")) {
    return "Local VTT could not create a token thumbnail from that image. Try a different image file.";
  }
  if (message.includes("Could not open backups folder")) {
    return "Local VTT could not open the backups folder. You can still find it inside the campaign folder.";
  }
  if (message.includes("Path is outside the selected campaign folder")) {
    return "Local VTT blocked a file operation outside the selected campaign folder.";
  }
  if (message.includes("Campaign folder is not open")) {
    return "Open the campaign again before making changes.";
  }

  return message || "Something went wrong.";
}

function stripElectronIpcPrefix(message: string): string {
  return message.replace(/^Error invoking remote method '[^']+': Error: /, "").trim();
}
