import type { CSSProperties } from "react";
import type { Camera } from "../../../canvas/core";
import type { MapCalibrationBox } from "../../../canvas/map";
import { MapCalibrationStatusStrip } from "../overlays/SceneCanvasStatusStrips";

interface MapCalibrationControlsProps {
  activeBox: MapCalibrationBox | null;
  draftBox: MapCalibrationBox | null;
  camera: Camera;
  onDraftBoxChange: (box: MapCalibrationBox | null) => void;
  onConfirm: (box: MapCalibrationBox) => void;
  onCancel?: () => void;
}

export function MapCalibrationControls({
  activeBox,
  draftBox,
  camera,
  onDraftBoxChange,
  onConfirm,
  onCancel
}: MapCalibrationControlsProps) {
  const sizeControlStyle = getMapCalibrationSizeControlStyle(activeBox, camera);

  return (
    <>
      <MapCalibrationStatusStrip />
      {activeBox && sizeControlStyle && (
        <label className="map-calibration-size-control" style={sizeControlStyle} onPointerDown={(event) => event.stopPropagation()}>
          Size
          <input
            type="number"
            min={4}
            step={1}
            value={Math.round(activeBox.width)}
            onChange={(event) => {
              const size = Math.max(4, Number(event.target.value));
              onDraftBoxChange({ ...activeBox, width: size, height: size });
            }}
          />
        </label>
      )}
      {draftBox && (
        <div className="map-calibration-actions" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => onConfirm(draftBox)}>
            Confirm
          </button>
          <button
            type="button"
            onClick={() => {
              onDraftBoxChange(null);
              onCancel?.();
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

export function getMapCalibrationSizeControlStyle(box: MapCalibrationBox | null, camera: Camera): CSSProperties | undefined {
  if (!box) {
    return undefined;
  }

  return {
    left: box.x * camera.zoom + camera.x + box.width * camera.zoom + 12,
    top: box.y * camera.zoom + camera.y
  };
}
