import sharp from 'sharp';
import type { AvatarBodyType, PartPreviewMeta } from '@ams/shared-types';
import { getAttachPosition, HUMANOID_BASE, MASCOT_BASE } from './attach-points';

const SIZE = 512;
const CX = SIZE / 2;
const BASE_Y = SIZE * 0.74;
const UNIT = SIZE * 0.2;

function toSvg(x: number, y: number): [number, number] {
  return [CX + x * UNIT, BASE_Y - y * UNIT];
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function ellipse(cx: number, cy: number, rx: number, ry: number, fill: string): string {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${esc(fill)}"/>`;
}

function roundedRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: string,
  rotateDeg = 0,
): string {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = Math.min(w, h) * 0.35;
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" fill="${esc(fill)}" transform="rotate(${rotateDeg} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
}

function humanoidBaseShapes(): string {
  const shapes: string[] = [];
  const [hx, hy] = toSvg(0, 1.5);
  shapes.push(ellipse(hx, hy, UNIT * 0.22, UNIT * 0.22, HUMANOID_BASE.skinColor));

  const [tx, ty] = toSvg(0, 0.9);
  shapes.push(roundedRect(tx, ty, UNIT * 0.38, UNIT * 0.55, HUMANOID_BASE.bodyColor));

  for (const [x, rot] of [
    [-0.35, 18],
    [0.35, -18],
  ] as const) {
    const [ax, ay] = toSvg(x, 0.95);
    shapes.push(roundedRect(ax, ay, UNIT * 0.12, UNIT * 0.42, HUMANOID_BASE.bodyColor, rot));
  }

  for (const x of [-0.12, 0.12]) {
    const [lx, ly] = toSvg(x, 0.35);
    shapes.push(roundedRect(lx, ly, UNIT * 0.14, UNIT * 0.48, HUMANOID_BASE.skinColor));
  }

  return shapes.join('\n    ');
}

function mascotBaseShapes(): string {
  const shapes: string[] = [];
  const [bx, by] = toSvg(0, 0.75);
  shapes.push(ellipse(bx, by, UNIT * 0.42, UNIT * 0.42, MASCOT_BASE.bodyColor));

  const [hx, hy] = toSvg(0, 1.35);
  shapes.push(ellipse(hx, hy, UNIT * 0.28, UNIT * 0.28, MASCOT_BASE.headColor));

  for (const x of [-0.15, 0.15]) {
    const [fx, fy] = toSvg(x, 0.25);
    shapes.push(ellipse(fx, fy, UNIT * 0.1, UNIT * 0.1, MASCOT_BASE.bodyColor));
  }

  return shapes.join('\n    ');
}

function partShape(preview: PartPreviewMeta): string {
  const [ax, ay] = getAttachPosition(preview.attachTo);
  const [ox, oy] = preview.offset;
  const [sx, sy] = preview.scale;
  const [px, py] = toSvg(ax + ox, ay + oy);
  const color = preview.color;

  switch (preview.geometry) {
    case 'sphere':
      return ellipse(px, py, UNIT * 0.2 * sx, UNIT * 0.2 * sy, color);
    case 'capsule':
      return roundedRect(px, py, UNIT * 0.28 * sx, UNIT * 0.45 * sy, color);
    case 'cylinder':
      return roundedRect(px, py, UNIT * 0.16 * sx, UNIT * 0.42 * sy, color);
    default:
      return roundedRect(px, py, UNIT * 0.28 * sx, UNIT * 0.28 * sy, color);
  }
}

export function renderPartsThumbnailSvg(
  bodyType: AvatarBodyType,
  parts: PartPreviewMeta[],
): string {
  const base = bodyType === 'humanoid_vrm' ? humanoidBaseShapes() : mascotBaseShapes();
  const accessories = parts.map(partShape).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g>
    ${base}
    ${accessories}
  </g>
</svg>`;
}

export async function bakePartsThumbnail(
  bodyType: AvatarBodyType,
  parts: PartPreviewMeta[],
): Promise<Buffer> {
  const svg = renderPartsThumbnailSvg(bodyType, parts);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function bakeDefaultVrmThumbnail(name: string): Promise<Buffer> {
  const initial = esc((name.trim()[0] ?? 'V').toUpperCase());
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <ellipse cx="${CX}" cy="${BASE_Y - UNIT * 0.55}" rx="${UNIT * 0.55}" ry="${UNIT * 0.7}" fill="#6366f1" opacity="0.35"/>
  <ellipse cx="${CX}" cy="${BASE_Y - UNIT * 1.05}" rx="${UNIT * 0.28}" ry="${UNIT * 0.28}" fill="#a5b4fc"/>
  <text x="${CX}" y="${BASE_Y + UNIT * 0.55}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="700" fill="#e0e7ff">${initial}</text>
  <text x="${CX}" y="${BASE_Y + UNIT * 0.95}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="#94a3b8">VRM</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
