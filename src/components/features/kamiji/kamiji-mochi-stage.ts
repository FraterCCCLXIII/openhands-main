import {
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";
// three ships these addons only with a file extension
// eslint-disable-next-line import-x/extensions
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// eslint-disable-next-line import-x/extensions
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { getMochiUrl } from "./kamiji-asset-urls";
import { KAMIJI_MOCHI, KamijiMochiId } from "./kamiji-catalog";
import {
  KamijiMochiClip,
  KamijiMochiFaceState,
  KAMIJI_MOCHI_FACE_STATES,
} from "./kamiji-mochi-expressions";
import {
  acquireRenderer,
  prefersReducedMotion,
  releaseRenderer,
} from "./kamiji-stage";

const CAMERA_FOV = 30;
/** Frame height as a multiple of the character, leaving room for hops and ears. */
const FRAME_MARGIN = 1.22;
const LOOK_HEIGHT = 0.5;
/** Head-and-shoulders crop for small avatars: the head sits in the upper part of the model. */
const HEAD_MARGIN = 0.62;
const HEAD_LOOK_HEIGHT = 0.7;

export type KamijiMochiFrame = "full" | "head";
const FADE_SECONDS = 0.2;
/**
 * Playback rate per clip. Walk and run are gait cycles of 0.33 s and 0.23 s,
 * meant for a body moving across ground; played in place as an avatar they
 * look frantic, so they run at a calmer rate.
 */
const CLIP_RATE: Partial<Record<string, number>> = { walk: 0.5, run: 0.4 };
const MAX_FRAME_SECONDS = 0.1;
const BLINK_SECONDS = 0.12;
const BLINK_MIN_GAP = 2;
const BLINK_GAP_JITTER = 3;
const BODY_MATERIAL = "body";
const FACE_MATERIAL = "face";

interface MochiAsset {
  scene: Group;
  animations: AnimationClip[];
  faceTextures: Map<KamijiMochiFaceState, Texture>;
}

const assets = new Map<KamijiMochiId, Promise<MochiAsset>>();

function loadMochiAsset(id: KamijiMochiId): Promise<MochiAsset> {
  let pending = assets.get(id);
  if (!pending) {
    pending = new GLTFLoader().loadAsync(getMochiUrl(id)).then(async (gltf) => {
      // material.extras.faceStates maps each state to a texture index; the
      // loader only resolves the default one, so fetch the rest by hand.
      const faceDef = (
        gltf.parser.json.materials as {
          name: string;
          extras?: { faceStates?: Record<string, number> };
        }[]
      ).find((material) => material.name === FACE_MATERIAL);
      const states = faceDef?.extras?.faceStates ?? {};
      const faceTextures = new Map<KamijiMochiFaceState, Texture>();
      await Promise.all(
        KAMIJI_MOCHI_FACE_STATES.map(async (state) => {
          const index = states[state];
          if (index === undefined) return;
          const texture = (await gltf.parser.getDependency(
            "texture",
            index,
          )) as Texture;
          texture.colorSpace = SRGBColorSpace;
          faceTextures.set(state, texture);
        }),
      );
      return {
        scene: gltf.scene,
        animations: gltf.animations,
        faceTextures,
      };
    });
    pending.catch(() => assets.delete(id));
    assets.set(id, pending);
  }
  return pending;
}

export interface KamijiMochiOptions {
  face: KamijiMochiFaceState;
  clip: KamijiMochiClip;
  /** CSS colour multiplied into the body's vertex colours; undefined keeps the natural colours. */
  tint?: string;
  /** "full" shows the whole body; "head" crops in on the face for avatar-sized use. */
  frame?: KamijiMochiFrame;
}

/**
 * One mochi on the shared renderer. The body has no texture, only baked vertex
 * colours, so a tint is a multiply on the body material: it can darken or shift
 * the natural colours but never brighten them. The face is a separate
 * alpha-tested material whose map is swapped per face state and is never tinted.
 */
export class KamijiMochiInstance {
  private readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();

  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.01, 50);

  private readonly root: Group;

  private readonly mixer: AnimationMixer;

  private readonly clips: AnimationClip[];

  private readonly faceTextures: Map<KamijiMochiFaceState, Texture>;

  private readonly bodyMaterials: MeshStandardMaterial[] = [];

  private readonly faceMaterials: MeshStandardMaterial[] = [];

  private action: AnimationAction | null = null;

  private readonly reducedMotion = prefersReducedMotion();

  private options: KamijiMochiOptions;

  private shownFace: KamijiMochiFaceState | null = null;

  private elapsed = 0;

  private nextBlinkAt = BLINK_MIN_GAP;

  private blinkEndsAt = 0;

  dirty = true;

  private constructor(
    renderer: WebGLRenderer,
    asset: MochiAsset,
    id: KamijiMochiId,
    options: KamijiMochiOptions,
  ) {
    this.renderer = renderer;
    this.options = { ...options };
    this.clips = asset.animations;
    this.faceTextures = asset.faceTextures;
    this.root = cloneSkinned(asset.scene) as Group;
    this.mixer = new AnimationMixer(this.root);

    this.root.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const source = mesh.material as Material;
      // Cloned so a tint or face swap never leaks into another instance.
      const material = source.clone() as MeshStandardMaterial;
      mesh.material = material;
      if (source.name === FACE_MATERIAL) this.faceMaterials.push(material);
      else if (source.name === BODY_MATERIAL) this.bodyMaterials.push(material);
    });

    const height =
      KAMIJI_MOCHI.find((mochi) => mochi.id === id)?.height ?? 0.55;
    this.scene.add(this.root);
    this.scene.add(new AmbientLight(0xffffff, 0.35));
    this.scene.add(new HemisphereLight(0xffffff, 0x9988aa, 1.5));
    const sun = new DirectionalLight(0xffffff, 1.8);
    sun.position.set(2, 3, 4);
    this.scene.add(sun);
    const head = options.frame === "head";
    // Full-body framing follows the measured model (ears and tails make some
    // characters taller than their nominal height), so no one is cropped.
    const bounds = new Box3().setFromObject(this.root);
    const measured = bounds.max.y - bounds.min.y;
    const bodyHeight = Number.isFinite(measured)
      ? Math.max(height, measured)
      : height;
    const bodyBottom = Number.isFinite(bounds.min.y) ? bounds.min.y : 0;
    const frameHeight = head ? height * HEAD_MARGIN : bodyHeight * FRAME_MARGIN;
    const lookY = head
      ? height * HEAD_LOOK_HEIGHT
      : bodyBottom + bodyHeight * LOOK_HEIGHT;
    const distance =
      frameHeight / 2 / Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
    this.camera.position.set(0, lookY, distance);
    this.camera.lookAt(0, lookY, 0);

    this.setTint(options.tint);
    this.applyFace(options.face);
    this.setClip(options.clip);
  }

  static async create(
    id: KamijiMochiId,
    options: KamijiMochiOptions,
  ): Promise<KamijiMochiInstance> {
    const renderer = acquireRenderer();
    try {
      return new KamijiMochiInstance(
        renderer,
        await loadMochiAsset(id),
        id,
        options,
      );
    } catch (error) {
      releaseRenderer();
      throw error;
    }
  }

  setTint(tint: string | undefined) {
    this.options.tint = tint;
    this.bodyMaterials.forEach((material) => {
      try {
        material.color.set(tint ?? "#ffffff");
      } catch {
        material.color.set(new Color(1, 1, 1));
      }
    });
    this.dirty = true;
  }

  setFace(face: KamijiMochiFaceState) {
    if (face === this.options.face) return;
    this.options.face = face;
    this.dirty = true;
  }

  private applyFace(face: KamijiMochiFaceState) {
    if (face === this.shownFace) return;
    const texture = this.faceTextures.get(face);
    if (!texture) return;
    this.shownFace = face;
    this.faceMaterials.forEach((material) => {
      Object.assign(material, { map: texture, needsUpdate: true });
    });
  }

  setClip(clip: KamijiMochiClip) {
    const unchanged = clip === this.options.clip && this.action !== null;
    this.options.clip = clip;
    if (unchanged) return;
    const found = this.clips.find((c) => c.name === clip);
    if (!found) return;
    const next = this.mixer.clipAction(found);
    if (next === this.action) return;
    next.setEffectiveTimeScale(CLIP_RATE[clip] ?? 1);
    this.action?.fadeOut(FADE_SECONDS);
    next.reset().fadeIn(FADE_SECONDS).play();
    this.action = next;
    if (this.reducedMotion) this.mixer.update(0);
    this.dirty = true;
  }

  /** Advance the animation; returns true when something should be redrawn. */
  tick(deltaSeconds: number): boolean {
    if (this.reducedMotion && !this.dirty) return false;
    const dt = Math.min(deltaSeconds, MAX_FRAME_SECONDS);
    this.elapsed += dt;
    let face = this.options.face;
    if (!this.reducedMotion && face === "neutral") {
      if (this.elapsed >= this.nextBlinkAt) {
        this.blinkEndsAt = this.elapsed + BLINK_SECONDS;
        this.nextBlinkAt =
          this.elapsed + BLINK_MIN_GAP + Math.random() * BLINK_GAP_JITTER;
      }
      if (this.elapsed < this.blinkEndsAt) face = "blink";
    }
    this.applyFace(face);
    if (!this.reducedMotion) this.mixer.update(dt);
    this.dirty = false;
    return true;
  }

  draw(context: CanvasRenderingContext2D) {
    this.renderer.render(this.scene, this.camera);
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);
    context.drawImage(this.renderer.domElement, 0, 0, width, height);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.bodyMaterials.forEach((material) => material.dispose());
    this.faceMaterials.forEach((material) => material.dispose());
    releaseRenderer();
  }
}
