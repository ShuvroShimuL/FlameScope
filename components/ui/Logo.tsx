import { BRAND } from "@/lib/brand";

const { tile, glyphBox, path, colors } = BRAND.logo;
const SCALE = tile.glyph / glyphBox;
const DX = (tile.width - tile.glyph) / 2;
const DY = (tile.height - tile.glyph) / 2;

/**
 * The FlameScope flame on its tile (geometry and colours in lib/brand.ts). `size` is the height in pixels;
 * the tile keeps its 32:36 shape. Decorative by default, because the name is written beside it. Pass
 * `title` when the logo stands alone and has to name the product itself.
 */
export function Logo({ size = 36, className = "", title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={(size * tile.width) / tile.height}
      height={size}
      viewBox={`0 0 ${tile.width} ${tile.height}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      <rect x="0.5" y="0.5" width={tile.width - 1} height={tile.height - 1} rx={tile.radius} fill={colors.tile} stroke={colors.line} />
      <path d={path} fill={colors.flame} transform={`translate(${DX} ${DY}) scale(${SCALE})`} />
    </svg>
  );
}
