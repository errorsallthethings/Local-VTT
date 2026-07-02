import { useEffect, useState, type ReactNode } from "react";

export function shouldShowCompactAssetThumbnail(previewPath: string | null | undefined, failedPreviewPath: string | null): boolean {
  return Boolean(previewPath && previewPath !== failedPreviewPath);
}

export function CompactAssetThumbnail({
  previewPath,
  fallback,
  lazy = false
}: {
  previewPath: string | null | undefined;
  fallback: ReactNode;
  lazy?: boolean;
}) {
  const [failedPreviewPath, setFailedPreviewPath] = useState<string | null>(null);
  const showPreview = shouldShowCompactAssetThumbnail(previewPath, failedPreviewPath);

  useEffect(() => {
    if (previewPath && failedPreviewPath && previewPath !== failedPreviewPath) {
      setFailedPreviewPath(null);
    }
  }, [failedPreviewPath, previewPath]);

  if (!showPreview || !previewPath) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={window.localVtt.toAssetUrl(previewPath)}
      alt=""
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      draggable={false}
      onError={() => setFailedPreviewPath(previewPath)}
    />
  );
}
