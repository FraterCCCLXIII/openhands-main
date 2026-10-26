import {
  AmbientLight,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
// three ships these addons only with a file extension
// eslint-disable-next-line import-x/extensions
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getPropUrl } from "./kamiji-asset-urls";
import { KAMIJI_PROP_TINTS, KamijiPropName } from "./kamiji-catalog";
import {
  acquireRenderer,
  prefersReducedMotion,
  releaseRenderer,
} from "./kamiji-stage";

const CAMERA_DISTANCE = 2.9;
const SPIN_RADIANS_PER_SECOND = 1.4;
const MAX_FRAME_SECONDS = 0.1;
/** The static pose: turned a little and tipped back so the extrusion reads as 3D. */
const POSE_YAW = -0.45;
const POSE_PITCH = 0.14;

const assets = new Map<KamijiPropName, Promise<Group>>();

function loadPropAsset(name: KamijiPropName): Promise<Group> {
  let pending = assets.get(name);
  if (!pending) {
    pending = new GLTFLoader().loadAsync(getPropUrl(name)).then((g) => g.scene);
    pending.catch(() => assets.delete(name));
    assets.set(name, pending);
  }
  return pending;
}

export interface KamijiPropOptions {
  /** CSS colour for the prop's single "Clay" material; defaults to the prop's suggested tint. */
  color?: string;
  spin: boolean;
}

/** One prop on the shared renderer: static unless `spin`, in which case it turns about Y. */
export class KamijiPropInstance {
  private readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();

  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 20);

  private readonly root: Group;

  private readonly materials: MeshStandardMaterial[] = [];

  private readonly reducedMotion = prefersReducedMotion();

  private readonly defaultColor: string;

  private options: KamijiPropOptions;

  private angle = POSE_YAW;

  dirty = true;

  private constructor(
    renderer: WebGLRenderer,
    asset: Group,
    name: KamijiPropName,
    options: KamijiPropOptions,
  ) {
    this.renderer = renderer;
    this.options = { ...options };
    this.defaultColor = KAMIJI_PROP_TINTS[name];
    this.root = asset.clone(true);
    this.root.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      const material = (
        mesh.material as Material
      ).clone() as MeshStandardMaterial;
      mesh.material = material;
      this.materials.push(material);
    });
    this.scene.add(this.root);
    this.scene.add(new AmbientLight(0xffffff, 0.3));
    this.scene.add(new HemisphereLight(0xffffff, 0xb8a890, 1.6));
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 3, 4);
    this.scene.add(key);
    this.camera.position.set(0, 0, CAMERA_DISTANCE);
    this.root.rotation.set(POSE_PITCH, POSE_YAW, 0);
    this.setColor(options.color);
  }

  static async create(
    name: KamijiPropName,
    options: KamijiPropOptions,
  ): Promise<KamijiPropInstance> {
    const renderer = acquireRenderer();
    try {
      return new KamijiPropInstance(
        renderer,
        await loadPropAsset(name),
        name,
        options,
      );
    } catch (error) {
      releaseRenderer();
      throw error;
    }
  }

  setColor(color: string | undefined) {
    this.options.color = color;
    this.materials.forEach((material) => {
      try {
        material.color.set(color ?? this.defaultColor);
      } catch {
        material.color.set(this.defaultColor);
      }
    });
    this.dirty = true;
  }

  setSpin(spin: boolean) {
    if (spin === this.options.spin) return;
    this.options.spin = spin;
    if (!spin) {
      this.angle = POSE_YAW;
      this.root.rotation.y = POSE_YAW;
    }
    this.dirty = true;
  }

  /** Static props only repaint when something changed; spinning ones repaint every frame. */
  tick(deltaSeconds: number): boolean {
    const spinning = this.options.spin && !this.reducedMotion;
    if (!spinning && !this.dirty) return false;
    if (spinning) {
      this.angle +=
        Math.min(deltaSeconds, MAX_FRAME_SECONDS) * SPIN_RADIANS_PER_SECOND;
      this.root.rotation.y = this.angle;
    }
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
    this.materials.forEach((material) => material.dispose());
    releaseRenderer();
  }
}
