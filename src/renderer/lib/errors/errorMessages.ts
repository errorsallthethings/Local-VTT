export function formatUserFacingError(caught: unknown): string {
  const rawMessage = caught instanceof Error ? caught.message : String(caught || "");
  const message = stripElectronIpcPrefix(rawMessage);

  if (message.includes("Campaign metadata could not be read") || message.includes("Scene metadata could not be read")) {
    return message;
  }
  if (message.includes("Campaign metadata could not be saved") || message.includes("Scene metadata could not be saved")) {
    return formatMetadataSaveError(message);
  }
  if (message.includes("must be a relative path inside the campaign folder")) {
    return formatPortableAssetPathError();
  }
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
  if (message.includes("Unexpected end of JSON input")) {
    return "That campaign or scene file appears to be incomplete or corrupted. Check the campaign backups folder for a previous copy.";
  }
  if (message.includes("Unsupported map type")) {
    return "That map file type is not supported. Use JPG, PNG, WebP, GIF, MP4, or WebM.";
  }
  if (message.includes("Unsupported token type")) {
    return "That token file type is not supported. Use JPG, PNG, WebP, or GIF.";
  }
  if (message.includes("Selected asset file could not be read")) {
    return "That asset file could not be read. It may have been moved, deleted, or locked by another app.";
  }
  if (message.includes("Selected asset must be a file")) {
    return "Choose an image or video file instead of a folder.";
  }
  if (message.includes("Selected asset file is empty")) {
    return "That asset file is empty or could not be read. Choose a different image or video file.";
  }
  if (message.includes("Map assets must be")) {
    return "That map file is too large to import. Use a smaller map file, or reduce the video/image size and try again.";
  }
  if (message.includes("Token image assets must be")) {
    return "That token image is too large to import. Use a smaller image file and try again.";
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

function formatMetadataSaveError(message: string): string {
  const prefix = message.includes("Scene metadata could not be saved")
    ? "Scene metadata could not be saved."
    : "Campaign metadata could not be saved.";
  const detail = message.slice(prefix.length).trim();
  const action = formatKnownFilesystemError(detail);
  return action ? `${prefix} ${action}` : message;
}

function formatKnownFilesystemError(message: string): string | null {
  if (message.includes("must be a relative path inside the campaign folder")) {
    return formatPortableAssetPathError();
  }
  if (message.includes("ENOSPC") || message.includes("no space left on device")) {
    return "There is not enough free disk space to save that change. Free up space and try again.";
  }
  if (message.includes("EACCES") || message.includes("EPERM") || message.includes("permission denied") || message.includes("operation not permitted")) {
    return "Local VTT does not have permission to access that file or folder. Check the folder permissions or choose a different location.";
  }
  if (message.includes("ENOENT") || message.includes("no such file or directory")) {
    return "That file or folder could not be found. It may have been moved, renamed, or deleted.";
  }
  return null;
}

function formatPortableAssetPathError(): string {
  return "Campaign metadata contains an asset path that points outside the campaign folder. Keep imported assets inside the campaign folder, then reopen or restore a metadata backup.";
}
