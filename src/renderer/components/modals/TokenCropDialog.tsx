import { Move } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Asset, Point, SquareCropRect } from "../../../shared/localvtt";
import { clampTokenCropOffset, getTokenCropLayout, getTokenCropSourceRect } from "../../lib/tokenCrop";

const PREVIEW_SIZE = 280;
interface TokenCropDialogProps {
  asset: Asset;
  onCancel: () => void;
  onUseDefault: () => void;
  onSubmit: (crop: SquareCropRect) => void;
}

export function TokenCropDialog({ asset, onCancel, onUseDefault, onSubmit }: TokenCropDialogProps) {
  const imageUrl = asset.absolutePath ? window.localVtt.toAssetUrl(asset.absolutePath) : "";
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startClient: Point; startOffset: Point } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize(null);
  }, [asset.id]);

  const cropInput = useMemo(
    () =>
      naturalSize
        ? {
            naturalWidth: naturalSize.width,
            naturalHeight: naturalSize.height,
            previewSize: PREVIEW_SIZE,
            zoom,
            offset
          }
        : null,
    [naturalSize, offset, zoom]
  );
  const layout = useMemo(() => (cropInput ? getTokenCropLayout({ ...cropInput, offset: clampTokenCropOffset(cropInput) }) : null), [cropInput]);

  const setClampedOffset = (nextOffset: Point, nextZoom = zoom) => {
    if (!naturalSize) {
      setOffset(nextOffset);
      return;
    }
    setOffset(
      clampTokenCropOffset({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        previewSize: PREVIEW_SIZE,
        zoom: nextZoom,
        offset: nextOffset
      })
    );
  };

  const submitCrop = () => {
    if (!cropInput) {
      return;
    }
    onSubmit(getTokenCropSourceRect(cropInput));
  };

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal token-crop-modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Frame Token</h2>
        <div
          className="token-crop-preview"
          style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          onPointerDown={(event) => {
            if (!naturalSize) {
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              startClient: { x: event.clientX, y: event.clientY },
              startOffset: offset
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) {
              return;
            }
            setClampedOffset({
              x: drag.startOffset.x + event.clientX - drag.startClient.x,
              y: drag.startOffset.y + event.clientY - drag.startClient.y
            });
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) {
              dragRef.current = null;
            }
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt=""
              draggable={false}
              style={
                layout
                  ? {
                      width: layout.displayWidth,
                      height: layout.displayHeight,
                      transform: `translate(${layout.left}px, ${layout.top}px)`
                    }
                  : undefined
              }
              onLoad={(event) => {
                const image = event.currentTarget;
                setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
                setClampedOffset({ x: 0, y: 0 });
              }}
            />
          )}
          <span className="token-crop-overlay" aria-hidden="true" />
          <span className="token-crop-move-hint" aria-hidden="true">
            <Move size={14} />
          </span>
        </div>
        <label className="token-crop-zoom">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => {
              const nextZoom = Number(event.target.value);
              setZoom(nextZoom);
              setClampedOffset(offset, nextZoom);
            }}
          />
        </label>
        <div className="button-row modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onUseDefault}>Use Auto Crop</button>
          <button disabled={!naturalSize} onClick={submitCrop}>
            Add Token
          </button>
        </div>
      </div>
    </div>
  );
}
