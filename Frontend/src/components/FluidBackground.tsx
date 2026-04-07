import { useRef, useEffect, memo } from 'react';
// @ts-ignore
import WebGLFluid from 'webgl-fluid';

export const FluidBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      WebGLFluid(canvasRef.current, {
        TRIGGER: 'click',
        IMMEDIATE: true,
        TRANSPARENT: false,
        AUTO: false,
        INTERVAL: 3000,
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2.0,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 20,
        SPLAT_RADIUS: 0.5,
        SPLAT_FORCE: 6000,
        SPLAT_COUNT: Math.floor(Math.random() * 20) + 5,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        BLOOM: false,
        SUNRAYS: false
      });
    }
  }, []);

  return <canvas id="fluid-canvas" ref={canvasRef} />;
});
