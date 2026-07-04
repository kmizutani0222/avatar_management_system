'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MOUSE, TOUCH } from 'three';

type ControlsHandle = {
  mouseButtons: { LEFT: (typeof MOUSE)[keyof typeof MOUSE] | undefined };
};

function setLeftMouseMode(controls: ControlsHandle, pan: boolean) {
  controls.mouseButtons.LEFT = pan ? MOUSE.PAN : MOUSE.ROTATE;
}

/** Shared camera controls for avatar / VRM previews */
export function PreviewOrbitControls() {
  const controlsRef = useRef<ControlsHandle | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    const dom = gl.domElement;

    const syncPanMode = (pan: boolean) => {
      const controls = controlsRef.current;
      if (controls) setLeftMouseMode(controls, pan);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') syncPanMode(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') syncPanMode(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      syncPanMode(e.shiftKey);
    };
    const onBlur = () => syncPanMode(false);
    const preventContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [gl]);

  return (
    <OrbitControls
      ref={(node) => {
        controlsRef.current = node as ControlsHandle | null;
      }}
      makeDefault
      target={[0, 1, 0]}
      minDistance={0.35}
      maxDistance={10}
      enablePan
      screenSpacePanning
      enableZoom
      enableRotate
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
    />
  );
}
