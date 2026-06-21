export function formatUserFacingError(caught: unknown): string {
  const rawMessage = caught instanceof Error ? caught.message : String(caught || "");
  const message = stripElectronIpcPrefix(rawMessage);

  if (message.includes("ENOENT") || message.includes("no such file or directory")) {
    return "That file or folder could not be found. It may have been moved, renamed, or deleted.";
  }
  if (message.includes("EACCES") || message.includes("EPERM") || message.includes("permission denied") || message.includes("operation not permitted")) {
    return "Local VTT does not have permission to access that file or folder. Check the folder permissions or choose a different location.";
  }
  if (message.includes("ENOTDIR") || message.includes("not a directory")) {
    return "Local VTT expected a folder but found a file instead. Choose a campaign folder and try again.";
  }
  if (message.includes("EISDIR") || message.includes("illegal operation on a directory")) {
    return "Local VTT expected a file but found a folder instead. Choose a valid file and try again.";
  }
  if (message.includes("ENOSPC") || message.includes("no space left on device")) {
    return "There is not enough free disk space to save that change. Free up space and try again.";
  }
  if (message.includes("Campaign metadata could not be read")) {
    return message;
  }
  if (message.includes("Unexpected end of JSON input")) {
    return "That campaign or scene file appears to be incomplete or corrupted. Check the campaign backups folder for a previous copy.";
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
