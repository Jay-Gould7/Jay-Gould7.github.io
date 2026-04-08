import Spline from '@splinetool/react-spline';

import '../styles/hero-3d.css';

export default function Hero3D() {
  return (
    <div className="hero-spline">
      <Spline
        className="hero-spline__viewport"
        scene="/models/scene.splinecode"
        wasmPath="/"
      >
        <div className="hero-spline__loading" aria-hidden="true" />
      </Spline>
    </div>
  );
}
