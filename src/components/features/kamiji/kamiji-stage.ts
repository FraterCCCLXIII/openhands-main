import {
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Bone,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  Scene,
  SkinnedMesh,
  WebGLRenderer,
} from "three";
// three ships these addons only with a file extension
// eslint-disable-next-line import-x/extensions
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// eslint-disable-next-line import-x/extensions
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import agentHandUrl from "#/assets/kamiji/kamiji.glb?url";
import {
  KAMIJI_EXPRESSIONS,
  KamijiAnimation,
  KamijiExpression,
  KamijiMorph,
  KAMIJI_SHOW_BROWS,
  KAMIJI_SHOW_GLINTS,
  KAMIJI_SHOW_MOUTH,
  KamijiPose,
  DEFAULT_KAMIJI_COLOR,
} from "./kamiji-expressions";
import {
  SHAPE_TARGETS,
  ShapeTween,
  ShapeWeights,
  KamijiShape,
  getFingerScale,
  startShapeTween,
  stepShapeTween,
} from "./kamiji-shape";
import {
  IDENTITY_MOTION,
  MOTION_BASE_CLIP,
  MOTION_CLIP_SPEED,
  MOTION_DEFAULT_POSE,
  MotionTransform,
  evaluateMotion,
  isKamijiMotion,
  wrapAngle,
} from "./kamiji-motion";
import {
  KAMIJI_BONES,
  KamijiBoneName,
  PoseTween,
  getKnuckleLift,
  getPoseCurls,
  startPoseTween,
  stepPoseTween,
} from "./kamiji-pose-tween";
import { isolateHandSkinWeights } from "./kamiji-skin-weights";

const RENDER_SIZE = 256;
const CAMERA_DISTANCE = 5.2;
const FACE_BONE_NAME = "Face";
const SKIN_MATERIAL_NAME = "HandSkin";
const FACE_MATERIAL_PREFIX = "Face";
const EYE_MATERIAL_NAME = "FacePupil";
const INK_MATERIAL_NAME = "FaceInk";
const TONGUE_MATERIAL_NAME = "FaceTongue";
const GLINT_MATERIAL_NAME = "FaceGlint";
// Soft clay: fully diffuse skin, a faint warm sheen at grazing angles, and
// shadows that turn deeper and warmer than the surface colour.
const SKIN_ROUGHNESS = 1;
const SKIN_SPECULAR = 0.12;
const SKIN_SHEEN = 0.45;
const SKIN_SHEEN_ROUGHNESS = 0.8;
const SKY_LIGHT = 0xfff4de;
const KEY_LIGHT = 0xffefd2;
const SHADOW_HUE_SHIFT = -14 / 360;
const SHADOW_SATURATION_BOOST = 0.12;
const SHADOW_LIGHT_LEVEL = 0.6;
const FADE_SECONDS = 0.2;
const MORPH_RESPONSE = 12;
const SWAY_RADIANS = 0.2;
const SWAY_SPEED = 0.6;
const MOTION_RESPONSE = 14;
const BLINK_SECONDS = 0.12;
const BLINK_MIN_GAP = 2;
const BLINK_GAP_JITTER = 3;
const TALK_SPEED = 9;
const TALK_MAX_OPEN = 0.8;
const MAX_FRAME_SECONDS = 0.1;
const CURL_AXIS = new Vector3(1, 0, 0);
const FRONT_AXIS = new Vector3(0, 0, 1);
export const DEFAULT_POSE_DURATION_MS = 450;
export const DEFAULT_SHAPE_DURATION_MS = 700;
const SHAPE_MORPHS = { sphere: "shapeSphere", cube: "shapeCube" } as const;

interface HandAsset {
  scene: Group;
  animations: AnimationClip[];
}

let assetPromise: Promise<HandAsset> | null = null;

function loadHandAsset(): Promise<HandAsset> {
  if (!assetPromise) {
    assetPromise = new GLTFLoader()
      .loadAsync(agentHandUrl)
      .then((asset) => {
        asset.scene.traverse((node) => {
          if ((node as SkinnedMesh).isSkinnedMesh) {
            isolateHandSkinWeights(node as SkinnedMesh);
          }
        });
        return asset;
      })
      .catch((error) => {
        assetPromise = null;
        throw error;
      });
  }
  return assetPromise;
}

interface SharedRenderer {
  renderer: WebGLRenderer;
  users: number;
}

let shared: SharedRenderer | null = null;

/**
 * One WebGL context renders every avatar: each instance draws into the shared
 * canvas and the result is copied into its own 2D canvas. This keeps a list of
 * agents well under the browser's WebGL context limit.
 */
export function acquireRenderer(): WebGLRenderer {
  if (!shared) {
    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_SIZE, RENDER_SIZE, false);
    renderer.setClearColor(0x000000, 0);
    shared = { renderer, users: 0 };
  }
  shared.users += 1;
  return shared.renderer;
}

export function releaseRenderer() {
  if (!shared) return;
  shared.users -= 1;
  if (shared.users <= 0) {
    shared.renderer.dispose();
    shared.renderer.forceContextLoss();
    shared = null;
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface KamijiOptions {
  color: string;
  expression: KamijiExpression;
  animation: KamijiAnimation;
  speaking: boolean;
  pose?: KamijiPose;
  poseDurationMs?: number;
  /** Keep the face (eyes) facing the camera while the hand turns. */
  lockFace?: boolean;
  shape?: KamijiShape;
  shapeDurationMs?: number;
}

export class KamijiInstance {
  private readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();

  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 20);

  private readonly root: Group;

  private readonly mixer: AnimationMixer;

  private readonly clips: AnimationClip[];

  private readonly skin: MeshPhysicalMaterial;

  private readonly shadowLight = new HemisphereLight(SKY_LIGHT, 0xffffff, 2);

  private readonly morphMeshes: Mesh[] = [];

  private readonly current = new Map<KamijiMorph, number>();

  private action: AnimationAction | null = null;

  private readonly fingerBones = new Map<
    KamijiBoneName,
    {
      bone: Bone;
      rest: Quaternion;
      restPosition: Vector3;
      /** Palm-front direction in the bone's parent space; set on first bones only. */
      front: Vector3 | null;
    }
  >();

  /** True while finger bones are driven by pose tweens instead of the clip. */
  private poseMode = false;

  private curls = getPoseCurls("open");

  private tween: PoseTween | null = null;

  private resumeClipAfterTween = false;

  private elapsed = 0;

  private motionStartedAt = 0;

  private shapeWeights: ShapeWeights = { ...SHAPE_TARGETS.hand };

  private shapeTween: ShapeTween | null = null;

  private faceBone: Bone | null = null;

  private faceRestLocal = new Quaternion();

  private faceRestWorld = new Quaternion();

  private motion: MotionTransform = { ...IDENTITY_MOTION };

  private nextBlinkAt = BLINK_MIN_GAP;

  private blinkEndsAt = 0;

  private readonly reducedMotion = prefersReducedMotion();

  private options: KamijiOptions;

  dirty = true;

  private constructor(
    renderer: WebGLRenderer,
    asset: HandAsset,
    options: KamijiOptions,
  ) {
    this.renderer = renderer;
    this.options = { ...options };
    this.clips = asset.animations;
    this.root = cloneSkinned(asset.scene) as Group;
    this.root.updateMatrixWorld(true);
    this.mixer = new AnimationMixer(this.root);

    const meshes: Mesh[] = [];
    this.root.traverse((node) => {
      if ((node as Mesh).isMesh) meshes.push(node as Mesh);
      if ((node as Bone).isBone && node.name === FACE_BONE_NAME) {
        this.faceBone = node as Bone;
        this.faceRestLocal.copy(node.quaternion);
      }
      if ((node as Bone).isBone) {
        const name = node.name as KamijiBoneName;
        if (KAMIJI_BONES.includes(name)) {
          const parentQuaternion = new Quaternion();
          node.parent?.getWorldQuaternion(parentQuaternion);
          this.fingerBones.set(name, {
            bone: node as Bone,
            rest: node.quaternion.clone(),
            restPosition: node.position.clone(),
            front: name.endsWith("_1")
              ? FRONT_AXIS.clone().applyQuaternion(parentQuaternion.invert())
              : null,
          });
        }
      }
    });
    this.root.updateMatrixWorld(true);
    this.faceBone?.getWorldQuaternion(this.faceRestWorld);
    let skin: MeshPhysicalMaterial | null = null;
    for (let i = 0; i < meshes.length; i += 1) {
      const mesh = meshes[i];
      const material = mesh.material as Material;
      if (material.name === SKIN_MATERIAL_NAME) {
        skin = new MeshPhysicalMaterial({
          name: SKIN_MATERIAL_NAME,
          color: (material as MeshPhysicalMaterial).color.clone(),
          roughness: SKIN_ROUGHNESS,
          metalness: 0,
          specularIntensity: SKIN_SPECULAR,
          sheen: SKIN_SHEEN,
          sheenRoughness: SKIN_SHEEN_ROUGHNESS,
        });
        mesh.material = skin;
      }
      if (mesh.morphTargetDictionary) this.morphMeshes.push(mesh);
    }
    this.skin = skin ?? new MeshPhysicalMaterial();
    if (!KAMIJI_SHOW_MOUTH) this.hideMouth();
    if (!KAMIJI_SHOW_GLINTS) this.hideGlints();
    if (!KAMIJI_SHOW_BROWS) this.hideBrows();

    this.scene.add(this.root);
    this.scene.add(new AmbientLight(SKY_LIGHT, 0.25));
    this.scene.add(this.shadowLight);
    const key = new DirectionalLight(KEY_LIGHT, 0.85);
    key.position.set(-1.5, 2, 4);
    this.scene.add(key);
    const bounce = new DirectionalLight(0xffc266, 0.35);
    bounce.position.set(2, -2, 2);
    this.scene.add(bounce);
    this.camera.position.set(0, 0, CAMERA_DISTANCE);

    this.setColor(options.color);
    this.setAnimation(options.animation);
    if (options.pose) this.setPose(options.pose, 0);
    if (options.shape) this.setShape(options.shape, 0);
  }

  static async create(options: KamijiOptions): Promise<KamijiInstance> {
    const renderer = acquireRenderer();
    try {
      return new KamijiInstance(renderer, await loadHandAsset(), options);
    } catch (error) {
      releaseRenderer();
      throw error;
    }
  }

  /** Hides the dark primitive above the eyes (the brows). */
  private hideBrows() {
    const centerY = (mesh: Mesh) => {
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      return box ? (box.min.y + box.max.y) / 2 : 0;
    };
    const named = (mesh: Mesh, name: string) =>
      (mesh.material as Material).name === name;
    const eye = this.morphMeshes.find((mesh) => named(mesh, EYE_MATERIAL_NAME));
    const eyeY = eye ? centerY(eye) : 0;
    this.morphMeshes.forEach((mesh) => {
      if (named(mesh, INK_MATERIAL_NAME) && centerY(mesh) > eyeY) {
        Object.assign(mesh, { visible: false });
      }
    });
  }

  private hideGlints() {
    this.morphMeshes.forEach((mesh) => {
      if ((mesh.material as Material).name === GLINT_MATERIAL_NAME) {
        Object.assign(mesh, { visible: false });
      }
    });
  }

  /** Hides the tongue and the dark primitive below the eyes (the mouth). */
  private hideMouth() {
    const centerY = (mesh: Mesh) => {
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      return box ? (box.min.y + box.max.y) / 2 : 0;
    };
    const faceMeshes = this.morphMeshes.filter((mesh) =>
      (mesh.material as Material).name.startsWith(FACE_MATERIAL_PREFIX),
    );
    const eye = faceMeshes.find(
      (mesh) => (mesh.material as Material).name === EYE_MATERIAL_NAME,
    );
    const eyeY = eye ? centerY(eye) : 0;
    faceMeshes.forEach((mesh) => {
      const name = (mesh.material as Material).name;
      const isMouth =
        name === TONGUE_MATERIAL_NAME ||
        (name === INK_MATERIAL_NAME && centerY(mesh) < eyeY);
      if (isMouth) Object.assign(mesh, { visible: false });
    });
  }

  setColor(color: string) {
    try {
      this.skin.color.set(color);
    } catch {
      this.skin.color.set(DEFAULT_KAMIJI_COLOR);
    }
    this.updateShadowTint();
    this.options.color = color;
    this.dirty = true;
  }

  /** Lower hemisphere light: the skin hue shifted warmer and saturated. */
  private updateShadowTint() {
    const hsl = { h: 0, s: 0, l: 0 };
    this.skin.color.getHSL(hsl, SRGBColorSpace);
    this.shadowLight.groundColor.setHSL(
      (hsl.h + SHADOW_HUE_SHIFT + 1) % 1,
      Math.min(1, hsl.s + SHADOW_SATURATION_BOOST),
      SHADOW_LIGHT_LEVEL,
      SRGBColorSpace,
    );
  }

  setExpression(expression: KamijiExpression) {
    this.options.expression = expression;
    this.dirty = true;
  }

  /** Tween between the hand and the sphere / rounded cube morph targets. */
  setShape(shape: KamijiShape | undefined, durationMs?: number) {
    this.options.shape = shape;
    const target = SHAPE_TARGETS[shape ?? "hand"];
    const duration = this.reducedMotion
      ? 0
      : (durationMs ??
        this.options.shapeDurationMs ??
        DEFAULT_SHAPE_DURATION_MS);
    if (duration <= 0) {
      this.shapeTween = null;
      this.shapeWeights = { ...target };
    } else {
      this.shapeTween = startShapeTween(this.shapeWeights, target, duration);
    }
    this.dirty = true;
  }

  private applyShape(dt: number) {
    if (this.shapeTween) {
      const step = stepShapeTween(this.shapeTween, dt * 1000);
      this.shapeWeights = step.weights;
      if (step.done) this.shapeTween = null;
    }
    this.morphMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) return;
      (Object.keys(SHAPE_MORPHS) as (keyof ShapeWeights)[]).forEach((key) => {
        const index = dict[SHAPE_MORPHS[key]];
        if (index !== undefined) influences[index] = this.shapeWeights[key];
      });
    });
    this.action?.setEffectiveWeight(getFingerScale(this.shapeWeights));
  }

  setLockFace(lockFace: boolean) {
    this.options.lockFace = lockFace;
    this.dirty = true;
  }

  /** Counter-rotate the Face bone so the eyes stay square to the camera. */
  private applyFaceLock() {
    const bone = this.faceBone;
    if (!bone?.parent) return;
    if (!this.options.lockFace) {
      bone.quaternion.copy(this.faceRestLocal);
      return;
    }
    this.root.updateMatrixWorld(true);
    bone.parent.getWorldQuaternion(bone.quaternion);
    bone.quaternion.invert().multiply(this.faceRestWorld);
  }

  setSpeaking(speaking: boolean) {
    this.options.speaking = speaking;
    this.dirty = true;
  }

  setAnimation(animation: KamijiAnimation) {
    this.options.animation = animation;
    this.motionStartedAt = this.elapsed;
    if (
      this.options.pose === undefined &&
      this.poseMode !== this.hasMotionPose()
    ) {
      this.setPose(undefined);
    } else if (!this.poseMode) {
      this.playClip();
    }
    this.dirty = true;
  }

  private hasMotionPose(): boolean {
    const { animation } = this.options;
    return isKamijiMotion(animation) && !!MOTION_DEFAULT_POSE[animation];
  }

  private clipName(): KamijiAnimation {
    const { animation } = this.options;
    return isKamijiMotion(animation) ? MOTION_BASE_CLIP[animation] : animation;
  }

  private playClip() {
    const clip = this.clips.find((c) => c.name === this.clipName());
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    const { animation } = this.options;
    next.setEffectiveTimeScale(
      (isKamijiMotion(animation) && MOTION_CLIP_SPEED[animation]) || 1,
    );
    if (next === this.action && next.isRunning()) return;
    if (next !== this.action) this.action?.fadeOut(FADE_SECONDS);
    next.reset().fadeIn(FADE_SECONDS).play();
    this.action = next;
    if (this.reducedMotion) this.mixer.update(0);
  }

  /**
   * Tween the fingers to a pose (clip stops); `undefined` tweens back to an
   * open hand and then resumes the clip animation.
   */
  setPose(pose: KamijiPose | undefined, durationMs?: number) {
    this.options.pose = pose;
    const duration = this.reducedMotion
      ? 0
      : (durationMs ?? this.options.poseDurationMs ?? DEFAULT_POSE_DURATION_MS);
    const { animation } = this.options;
    const effective =
      pose ??
      (isKamijiMotion(animation) ? MOTION_DEFAULT_POSE[animation] : undefined);
    if (!effective && !this.poseMode) return;
    if (!this.poseMode) {
      // Hand the bones over from the clip; the rest pose is the tween origin.
      this.mixer.stopAllAction();
      this.mixer.update(0);
      this.action = null;
      this.curls = getPoseCurls("open");
      this.poseMode = true;
    }
    this.resumeClipAfterTween = !effective;
    const target = getPoseCurls(effective ?? "open");
    if (duration <= 0) {
      this.tween = null;
      this.curls = target;
      this.applyCurls();
      this.finishPose();
    } else {
      this.tween = startPoseTween(this.curls, target, duration);
    }
    this.dirty = true;
  }

  private finishPose() {
    if (!this.resumeClipAfterTween) return;
    this.resumeClipAfterTween = false;
    this.poseMode = false;
    this.playClip();
  }

  private applyCurls() {
    const q = new Quaternion();
    this.fingerBones.forEach(({ bone, rest, restPosition, front }, name) => {
      const curl = this.curls[name] * getFingerScale(this.shapeWeights);
      q.setFromAxisAngle(CURL_AXIS, (curl * Math.PI) / 180);
      bone.quaternion.copy(rest).multiply(q);
      if (front) {
        bone.position
          .copy(restPosition)
          .addScaledVector(front, getKnuckleLift(curl));
      }
    });
  }

  private applyMotion(dt: number) {
    const { animation } = this.options;
    const target = isKamijiMotion(animation)
      ? evaluateMotion(animation, this.elapsed - this.motionStartedAt)
      : {
          ...IDENTITY_MOTION,
          rotY: Math.sin(this.elapsed * SWAY_SPEED) * SWAY_RADIANS,
        };
    const blend = 1 - Math.exp(-MOTION_RESPONSE * dt);
    const m = this.motion;
    m.rotX += (target.rotX - m.rotX) * blend;
    m.rotY = wrapAngle(m.rotY + wrapAngle(target.rotY - m.rotY) * blend);
    m.rotZ += (target.rotZ - m.rotZ) * blend;
    m.posY += (target.posY - m.posY) * blend;
    m.scaleX += (target.scaleX - m.scaleX) * blend;
    m.scaleY += (target.scaleY - m.scaleY) * blend;
    this.root.rotation.set(m.rotX, m.rotY, m.rotZ);
    this.root.position.y = m.posY;
    this.root.scale.set(m.scaleX, m.scaleY, m.scaleX);
  }

  /** Advance the pose; returns true when something should be redrawn. */
  tick(deltaSeconds: number): boolean {
    if (this.reducedMotion && !this.dirty) return false;
    const dt = Math.min(deltaSeconds, MAX_FRAME_SECONDS);
    this.elapsed += dt;
    if (this.tween) {
      const step = stepPoseTween(this.tween, dt * 1000);
      this.curls = step.curls;
      if (step.done) {
        this.tween = null;
        this.finishPose();
      }
    }
    this.applyShape(dt);
    if (this.poseMode) this.applyCurls();
    if (!this.reducedMotion) {
      if (!this.poseMode) this.mixer.update(dt);
      this.applyMotion(dt);
    }
    this.applyFaceLock();
    this.applyFace(dt);
    this.dirty = false;
    return true;
  }

  private applyFace(dt: number) {
    const target = new Map<KamijiMorph, number>(
      Object.entries(KAMIJI_EXPRESSIONS[this.options.expression]) as [
        KamijiMorph,
        number,
      ][],
    );
    if (this.options.speaking && !this.reducedMotion) {
      const talk =
        Math.abs(
          Math.sin(this.elapsed * TALK_SPEED + Math.sin(this.elapsed * 3) * 2),
        ) * TALK_MAX_OPEN;
      target.set("mouthOpen", Math.max(target.get("mouthOpen") ?? 0, talk));
    }
    if (!this.reducedMotion) {
      if (this.elapsed >= this.nextBlinkAt) {
        this.blinkEndsAt = this.elapsed + BLINK_SECONDS;
        this.nextBlinkAt =
          this.elapsed + BLINK_MIN_GAP + Math.random() * BLINK_GAP_JITTER;
      }
      if (this.elapsed < this.blinkEndsAt) {
        target.set("eyeBlinkLeft", 1);
        target.set("eyeBlinkRight", 1);
      }
    }

    const blend = this.reducedMotion ? 1 : 1 - Math.exp(-MORPH_RESPONSE * dt);
    const names = new Set<KamijiMorph>([
      ...this.current.keys(),
      ...target.keys(),
    ]);
    names.forEach((name) => {
      const from = this.current.get(name) ?? 0;
      const value = from + ((target.get(name) ?? 0) - from) * blend;
      this.current.set(name, value);
      this.morphMeshes.forEach((mesh) => {
        const index = mesh.morphTargetDictionary?.[name];
        const influences = mesh.morphTargetInfluences;
        if (index !== undefined && influences) influences[index] = value;
      });
    });
  }

  draw(context: CanvasRenderingContext2D) {
    this.renderer.render(this.scene, this.camera);
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);
    context.drawImage(this.renderer.domElement, 0, 0, width, height);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.skin.dispose();
    releaseRenderer();
  }
}

export const KAMIJI_BUFFER_SIZE = RENDER_SIZE;

// ----------------------------------------------------------------- loop
/** Anything the shared frame loop can advance and paint (hands, mochi, props). */
export interface KamijiDrawable {
  tick(deltaSeconds: number): boolean;
  draw(context: CanvasRenderingContext2D): void;
}

interface Registration {
  instance: KamijiDrawable;
  context: CanvasRenderingContext2D;
  isVisible: () => boolean;
}

const registrations = new Set<Registration>();
let frameHandle = 0;
let lastFrameAt = 0;

function frame(now: number) {
  const dt = lastFrameAt ? (now - lastFrameAt) / 1000 : 0;
  lastFrameAt = now;
  registrations.forEach(({ instance, context, isVisible }) => {
    if (isVisible() && instance.tick(dt)) instance.draw(context);
  });
  frameHandle = registrations.size ? requestAnimationFrame(frame) : 0;
}

/** Start drawing an instance into a 2D context; returns the unregister fn. */
export function registerKamiji(
  instance: KamijiDrawable,
  context: CanvasRenderingContext2D,
  isVisible: () => boolean,
): () => void {
  const registration = { instance, context, isVisible };
  registrations.add(registration);
  if (!frameHandle) {
    lastFrameAt = 0;
    frameHandle = requestAnimationFrame(frame);
  }
  return () => {
    registrations.delete(registration);
    if (!registrations.size && frameHandle) {
      cancelAnimationFrame(frameHandle);
      frameHandle = 0;
    }
  };
}
