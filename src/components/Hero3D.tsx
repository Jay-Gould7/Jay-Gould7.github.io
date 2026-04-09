import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';

import GlassTopBar from './GlassTopBar';
import Shuffle from './reactbits/Shuffle';
import '../styles/hero-3d.css';

const MOBILE_CARD_SHIFT_X = -580;
const MOBILE_CARD_SHIFT_Y = 200;
const MOBILE_CARD_SCALE = 0.9;
const MOBILE_ZOOM = 0.6;
const DESKTOP_CARD_SCALE = 1.3;
const DESKTOP_CARD_SHIFT_X = -180;
const HIDDEN_SCENE_GROUP_IDS = [
  'a76d91f5-b9fc-49e0-a4fe-bd27112f524f',
  '5bb83dd4-f628-484c-9434-dcf23ade24a3',
];
const TEXT_CARD_IDS = [
  'b466418a-90c7-4f81-8d5d-ccac94581c67',
  '314875a3-8d8c-4bf0-a2bf-22a29436e018',
];

type SplineSceneObject = {
  visible?: boolean;
  children?: SplineSceneObject[];
  position: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
};

function shouldUseMobileZoom() {
  const mobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallViewport = window.matchMedia('(max-width: 820px)').matches;

  return mobileUserAgent || (coarsePointer && smallViewport);
}

function transformObject(
  spline: Application,
  objectId: string,
  deltaX: number,
  deltaY: number,
  scaleMultiplier: number,
) {
  const object = spline.findObjectById(objectId) as SplineSceneObject | null;

  if (object) {
    object.position.x += deltaX;
    object.position.y += deltaY;
    object.scale.x *= scaleMultiplier;
    object.scale.y *= scaleMultiplier;
    object.scale.z *= scaleMultiplier;
  }
}

function hideObject(object: SplineSceneObject) {
  object.visible = false;

  if (Array.isArray(object.children)) {
    for (const child of object.children) {
      hideObject(child);
    }
  }
}

function hideObjectById(spline: Application, objectId: string) {
  const object = spline.findObjectById(objectId) as SplineSceneObject | null;

  if (object) {
    hideObject(object);
  }
}

export default function Hero3D() {
  function handleLoad(spline: Application) {
    const isMobile = shouldUseMobileZoom();

    const orbitControls = (spline.controls as
      | {
          orbitControls?: {
            enableZoom?: boolean;
            mouseButtons?: number[];
            mouseButtonsPlay?: number[];
          };
        }
      | undefined)?.orbitControls;

    if (orbitControls) {
      orbitControls.enableZoom = false;

      if (Array.isArray(orbitControls.mouseButtons) && orbitControls.mouseButtons.length >= 3) {
        orbitControls.mouseButtons[2] = -1;
      }

      if (Array.isArray(orbitControls.mouseButtonsPlay) && orbitControls.mouseButtonsPlay.length >= 3) {
        orbitControls.mouseButtonsPlay[2] = -1;
      }
    }

    for (const objectId of HIDDEN_SCENE_GROUP_IDS) {
      hideObjectById(spline, objectId);
    }

    if (isMobile) {
      spline.setZoom(MOBILE_ZOOM);

      for (const objectId of TEXT_CARD_IDS) {
        transformObject(
          spline,
          objectId,
          MOBILE_CARD_SHIFT_X,
          MOBILE_CARD_SHIFT_Y,
          MOBILE_CARD_SCALE,
        );
      }
    } else {
      for (const objectId of TEXT_CARD_IDS) {
        transformObject(spline, objectId, DESKTOP_CARD_SHIFT_X, 0, DESKTOP_CARD_SCALE);
      }
    }
  }

  return (
    <div
      className="hero-spline"
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      <Spline
        className="hero-spline__viewport"
        scene="/models/scene.splinecode"
        onLoad={handleLoad}
        wasmPath="/"
      >
        <div className="hero-spline__loading" aria-hidden="true" />
      </Spline>
      <div className="hero-spline__mask hero-spline__mask--left-r" aria-hidden="true" />
      <div className="hero-spline__wordmark" aria-label="JAY'S BLOG">
        <Shuffle
          text="JAY'S"
          className="hero-spline__wordmark-line"
          shuffleDirection="down"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          threshold={0.1}
          triggerOnce={true}
          triggerOnHover
          respectReducedMotion={true}
          loop={false}
          loopDelay={0}
          tag="p"
          textAlign="left"
          style={{
            margin: 0,
            color: '#ffffff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(18px, 7vw, 40px)',
            fontWeight: 700,
            lineHeight: 'var(--hero-wordmark-line-height, 1)',
            letterSpacing: 'var(--hero-wordmark-letter-spacing, 0.01em)',
          }}
        />
        <Shuffle
          text="BLOG"
          className="hero-spline__wordmark-line"
          shuffleDirection="down"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          threshold={0.1}
          triggerOnce={true}
          triggerOnHover
          respectReducedMotion={true}
          loop={false}
          loopDelay={0}
          tag="p"
          textAlign="left"
          style={{
            margin: 0,
            color: '#ffffff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(18px, 7vw, 40px)',
            fontWeight: 700,
            lineHeight: 'var(--hero-wordmark-line-height, 1)',
            letterSpacing: 'var(--hero-wordmark-letter-spacing, 0.01em)',
          }}
        />
      </div>
      <GlassTopBar />
    </div>
  );
}
