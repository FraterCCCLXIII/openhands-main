import { KamijiCanvas, getBufferSize } from "./kamiji-3d-canvas";
import { KamijiPropName } from "./kamiji-catalog";
import { KamijiPropInstance } from "./kamiji-prop-stage";

interface KamijiPropSceneProps {
  name: KamijiPropName;
  color?: string;
  spin: boolean;
  size: number;
  onReady: () => void;
  onUnavailable: () => void;
}

/** The three.js half of KamijiProp; loaded lazily so three stays out of the eager bundle. */
export default function KamijiPropScene({
  name,
  color,
  spin,
  size,
  onReady,
  onUnavailable,
}: KamijiPropSceneProps) {
  return (
    <KamijiCanvas<KamijiPropInstance>
      key={name}
      create={() => KamijiPropInstance.create(name, { color, spin })}
      sync={(instance) => {
        instance.setColor(color);
        instance.setSpin(spin);
      }}
      bufferSize={getBufferSize(size)}
      onReady={onReady}
      onUnavailable={onUnavailable}
    />
  );
}
