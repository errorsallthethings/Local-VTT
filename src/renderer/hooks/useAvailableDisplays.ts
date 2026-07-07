import { useCallback, useEffect, useState } from "react";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";

export function useAvailableDisplays({
  run
}: {
  run: (task: () => Promise<void>) => Promise<boolean>;
}) {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);

  const refreshDisplays = useCallback(
    () =>
      run(async () => {
        setDisplays(await window.localVtt.getDisplays());
      }),
    [run]
  );

  useEffect(() => {
    void refreshDisplays();
    // Displays are refreshed once on mount; later updates happen when the GM opens display settings.
  }, [refreshDisplays]);

  return {
    displays,
    refreshDisplays
  };
}
