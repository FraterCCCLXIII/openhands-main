import { KamijiCanvas, getBufferSize } from "./kamiji-3d-canvas";
import { KamijiMochiId } from "./kamiji-catalog";
import {
  KamijiMochiClip,
  KamijiMochiFaceState,
} from "./kamiji-mochi-expressions";
import { KamijiMochiFrame, KamijiMochiInstance } from "./kamiji-mochi-stage";

interface KamijiMochiSceneProps {
  id: KamijiMochiId;
  face: KamijiMochiFaceState;
  clip: KamijiMochiClip;
  tint?: string;
  frame?: KamijiMochiFrame;
  size: number;
  onReady: () => void;
  onUnavailable: () => void;
}

/** The three.js half of KamijiMochi; loaded lazily so three stays out of the eager bundle. */
export default function KamijiMochiScene({
  id,
  face,
  clip,
  tint,
  frame,
  size,
  onReady,
  onUnavailable,
}: KamijiMochiSceneProps) {
  return (
    <KamijiCanvas<KamijiMochiInstance>
      key={`${id}:${frame}`}
      create={() => KamijiMochiInstance.create(id, { face, clip, tint, frame })}
      sync={(instance) => {
        instance.setTint(tint);
        instance.setFace(face);
        instance.setClip(clip);
      }}
      bufferSize={getBufferSize(size)}
      onReady={onReady}
      onUnavailable={onUnavailable}
    />
  );
}
