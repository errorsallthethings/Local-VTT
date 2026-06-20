import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Campaign, Scene } from "../../../shared/localvtt";
import {
  easeInCubic,
  easeOutCubic,
  getEdgeSlideTransform,
  getPlayerSeatStyle,
  getPlayerTurnStatusLabel,
  getPlayerTurnStatusStyle,
  getTurnOrderPlayerBarLayout
} from "../../lib/playerViewTurnOrder";

export function PlayerSeatIndicators({ campaign }: { campaign: Campaign | null }) {
  const seats = (campaign?.players ?? []).filter((player) => player.visibleInPlayer);
  if (seats.length === 0) {
    return null;
  }

  const assetsById = new Map((campaign?.assets ?? []).map((asset) => [asset.id, asset]));
  return (
    <>
      {seats.map((seat) => {
        const asset = seat.assetId ? assetsById.get(seat.assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const style = getPlayerSeatStyle(seat.defaultSeatEdge, seat.defaultSeatPosition, seat.color);
        return (
          <div key={seat.id} className={`player-seat-indicator player-seat-indicator-${seat.defaultSeatEdge}`} style={style}>
            <span className="player-seat-indicator-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : seat.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="player-seat-indicator-name">{seat.name}</span>
          </div>
        );
      })}
    </>
  );
}

export function TurnOrderPlayerBar({ scene, campaign }: { scene: Scene; campaign: Campaign | null }) {
  const turnOrder = scene.turnOrder;
  const entries = turnOrder.entries.filter((entry) => entry.visibleInPlayer);
  const visible = turnOrder.active && turnOrder.playerViewVisible && entries.length > 0;
  const reveal = useEdgeSlide(visible);
  const renderedEntries = useLastPresentValue(entries, visible && entries.length > 0);
  const renderedCampaign = useLastPresentValue(campaign, visible && Boolean(campaign));
  if (!reveal.present || renderedEntries.length === 0) {
    return null;
  }

  const assetsById = new Map((renderedCampaign?.assets ?? []).map((asset) => [asset.id, asset]));
  const playersById = new Map((renderedCampaign?.players ?? []).map((player) => [player.id, player]));
  const layout = getTurnOrderPlayerBarLayout(turnOrder.playerViewEdge, turnOrder.playerViewFacing);
  const displayedEntries = layout.reverseEntries ? [...renderedEntries].reverse() : renderedEntries;
  const currentIndex = Math.max(0, renderedEntries.findIndex((entry) => entry.id === turnOrder.currentEntryId));
  const nextEntryId = renderedEntries.length > 1 ? renderedEntries[(currentIndex + 1) % renderedEntries.length]?.id : null;

  return (
    <div
      className={`turn-order-player-bar turn-order-player-bar-${turnOrder.playerViewEdge} turn-order-player-bar-${turnOrder.playerViewSize} ${layout.arrowAtEnd ? "turn-order-player-bar-arrow-end" : ""}`}
      style={
        {
          "--turn-entry-rotation": `${layout.entryRotation}deg`,
          "--turn-arrow-rotation": `${layout.arrowRotation}deg`,
          transform: getEdgeSlideTransform(turnOrder.playerViewEdge, reveal.progress)
        } as React.CSSProperties
      }
    >
      <span className="turn-order-player-direction" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
      {displayedEntries.map((entry) => {
        const player = entry.playerId ? playersById.get(entry.playerId) : null;
        const assetId = player?.assetId ?? entry.assetId;
        const asset = assetId ? assetsById.get(assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const active = entry.id === turnOrder.currentEntryId;
        const next = entry.id === nextEntryId;
        const entryName = player?.name ?? entry.name;
        return (
          <article
            key={entry.id}
            className={["turn-order-player-entry", active ? "turn-order-player-entry-active" : "", next ? "turn-order-player-entry-next" : ""].filter(Boolean).join(" ")}
            style={player?.color ? ({ "--turn-player-color": player.color } as React.CSSProperties) : undefined}
          >
            <span className="turn-order-player-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : entryName.slice(0, 1).toUpperCase()}
            </span>
            <span className="turn-order-player-initiative">{entry.initiative}</span>
          </article>
        );
      })}
    </div>
  );
}

export function PlayerTurnStatusIndicators({ scene, campaign }: { scene: Scene; campaign: Campaign | null }) {
  const turnOrder = scene.turnOrder;
  const visible = turnOrder.active && turnOrder.playerViewVisible && Boolean(campaign);
  const reveal = useEdgeSlide(visible);
  const renderedCampaign = useLastPresentValue(campaign, visible && Boolean(campaign));
  const entries = turnOrder.entries.filter((entry) => entry.visibleInPlayer);
  const renderedEntries = useLastPresentValue(entries, visible && entries.length > 0);
  if (!reveal.present || !renderedCampaign) {
    return null;
  }

  if (renderedEntries.length === 0) {
    return null;
  }

  const currentIndex = Math.max(0, renderedEntries.findIndex((entry) => entry.id === turnOrder.currentEntryId));
  const nextEntry = renderedEntries.length > 1 ? renderedEntries[(currentIndex + 1) % renderedEntries.length] : null;
  const entriesByPlayerId = new Map<string, (typeof renderedEntries)[number]>();
  for (const entry of renderedEntries) {
    if (entry.playerId) {
      entriesByPlayerId.set(entry.playerId, entry);
    }
  }
  const assetsById = new Map(renderedCampaign.assets.map((asset) => [asset.id, asset]));
  const players = renderedCampaign.players.filter((player) => entriesByPlayerId.has(player.id));
  if (players.length === 0) {
    return null;
  }

  return (
    <>
      {players.map((player) => {
        const entry = entriesByPlayerId.get(player.id);
        if (!entry) {
          return null;
        }
        const asset = player.assetId ? assetsById.get(player.assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const status = entry.id === turnOrder.currentEntryId ? "current" : entry.id === nextEntry?.id ? "next" : "waiting";
        const theme = player.indicatorTheme ?? "generic";
        const style = getPlayerTurnStatusStyle(player.defaultSeatEdge, player.defaultSeatPosition, player.color, reveal.progress);
        return (
          <div
            key={player.id}
            className={`player-turn-status player-turn-status-${player.defaultSeatEdge} player-turn-status-${turnOrder.playerTurnStatusSize} player-turn-status-${status} player-turn-theme-${theme}`}
            style={style}
          >
            <PlayerTurnStatusFrame />
            <span className="player-turn-status-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : player.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="player-turn-status-copy">
              <strong>{player.name}</strong>
              <small>{getPlayerTurnStatusLabel(status)}</small>
            </span>
          </div>
        );
      })}
    </>
  );
}

function PlayerTurnStatusFrame() {
  return (
    <svg className="player-turn-status-frame" viewBox="0 0 260 82" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="player-turn-frame-shadow" d="M18 5H242L257 20V62L242 77H18L3 62V20L18 5Z" />
      <path className="player-turn-frame-fill" d="M22 4H238L254 20V62L238 78H22L6 62V20L22 4Z" />
      <path className="player-turn-frame-panel" d="M66 13H221L244 25V57L221 69H66L77 41L66 13Z" />
      <path className="player-turn-frame-crest" d="M22 11H64L77 41L64 71H22L12 59V23L22 11Z" />
      <path className="player-turn-frame-inner" d="M33 12H227L246 25V57L227 70H33L14 57V25L33 12Z" />
      <path className="player-turn-frame-corners" d="M24 10L35 18M236 10L225 18M24 72L35 64M236 72L225 64M8 31L18 41L8 51M252 31L242 41L252 51" />
      <path className="player-turn-frame-runes" d="M91 20H111M190 20H210M91 62H111M190 62H210" />
      <path className="player-turn-frame-sigil" d="M42 17L49 28L42 39L35 28L42 17ZM42 43L50 54L42 66L34 54L42 43Z" />
      <circle className="player-turn-frame-gem" cx="31" cy="41" r="4.5" />
      <circle className="player-turn-frame-gem" cx="229" cy="41" r="4.5" />
    </svg>
  );
}

function useEdgeSlide(show: boolean, durationMs = 560) {
  const [present, setPresent] = useState(show);
  const [progress, setProgress] = useState(show ? 1 : 0);
  const progressRef = useRef(show ? 1 : 0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = progressRef.current;
    const to = show ? 1 : 0;

    if (show) {
      setPresent(true);
    }

    const step = (now: number) => {
      const elapsed = now - start;
      const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
      const eased = show ? easeOutCubic(t) : easeInCubic(t);
      const nextProgress = from + (to - from) * eased;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      progressRef.current = to;
      setProgress(to);
      if (!show) {
        setPresent(false);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [durationMs, show]);

  return { present, progress };
}

function useLastPresentValue<T>(value: T, active: boolean): T {
  const lastValueRef = useRef(value);
  if (active) {
    lastValueRef.current = value;
  }
  return active ? value : lastValueRef.current;
}
