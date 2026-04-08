import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';

import '../styles/hero-3d.css';

const MOBILE_CARD_SHIFT_X = -680;
const MOBILE_CARD_SHIFT_Y = 300;
const MOBILE_CARD_SCALE = 0.9;
const MOBILE_TEXT_CARD_IDS = [
  'b466418a-90c7-4f81-8d5d-ccac94581c67',
  '314875a3-8d8c-4bf0-a2bf-22a29436e018',
];

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
  const object = spline.findObjectById(objectId);

  if (object) {
    object.position.x += deltaX;
    object.position.y += deltaY;
    object.scale.x *= scaleMultiplier;
    object.scale.y *= scaleMultiplier;
    object.scale.z *= scaleMultiplier;
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

    if (isMobile) {
      spline.setZoom(0.35);

      for (const objectId of MOBILE_TEXT_CARD_IDS) {
        transformObject(
          spline,
          objectId,
          MOBILE_CARD_SHIFT_X,
          MOBILE_CARD_SHIFT_Y,
          MOBILE_CARD_SCALE,
        );
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
    </div>
  );
}
