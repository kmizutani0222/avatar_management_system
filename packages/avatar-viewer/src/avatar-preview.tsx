'use client';

import { Component, memo, Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AvatarBodyType } from '@ams/shared-types';
import { AvatarModel } from './avatar-model';
import { BaseTemplateScene } from './base-template-scene';
import { PreviewFrame } from './preview-frame';
import { PreviewOrbitControls } from './preview-orbit-controls';
import type { ResolvedPart } from './resolve-parts';

export interface AvatarPreviewProps {
  bodyType: AvatarBodyType;
  parts: ResolvedPart[];
  className?: string;
  showControlsHint?: boolean;
  /** Dashboard cards: disable orbit controls to avoid WebGL conflicts across multiple canvases */
  interactive?: boolean;
  /** MinIO base-template GLB URL — when set, preview matches bake output body. */
  baseTemplateUrl?: string;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class TemplateLoadErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function SceneContent({
  bodyType,
  parts,
  baseTemplateUrl,
}: {
  bodyType: AvatarBodyType;
  parts: ResolvedPart[];
  baseTemplateUrl?: string;
}) {
  const previewMetas = parts.map((p) => p.preview);
  const partKeys = parts.map((p) => p.category);

  if (baseTemplateUrl) {
    return (
      <TemplateLoadErrorBoundary
        fallback={
          <AvatarModel bodyType={bodyType} parts={previewMetas} partKeys={partKeys} />
        }
      >
        <Suspense
          fallback={
            <AvatarModel bodyType={bodyType} parts={previewMetas} partKeys={partKeys} />
          }
        >
          <BaseTemplateScene
            url={baseTemplateUrl}
            bodyType={bodyType}
            parts={previewMetas}
            partKeys={partKeys}
          />
        </Suspense>
      </TemplateLoadErrorBoundary>
    );
  }

  return <AvatarModel bodyType={bodyType} parts={previewMetas} partKeys={partKeys} />;
}

function AvatarPreviewInner({
  bodyType,
  parts,
  className,
  showControlsHint = true,
  interactive = true,
  baseTemplateUrl,
}: AvatarPreviewProps) {
  const camera =
    bodyType === AvatarBodyType.QUADRUPED
      ? { position: [0, 0.65, 2.4] as [number, number, number], fov: 45 }
      : { position: [0, 1.2, 2.8] as [number, number, number], fov: 45 };

  return (
    <PreviewFrame className={className} showControlsHint={showControlsHint}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={camera}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <directionalLight position={[-2, 3, -2]} intensity={0.4} />
        <SceneContent bodyType={bodyType} parts={parts} baseTemplateUrl={baseTemplateUrl} />
        {interactive && <PreviewOrbitControls />}
      </Canvas>
    </PreviewFrame>
  );
}

export const AvatarPreview = memo(AvatarPreviewInner);
