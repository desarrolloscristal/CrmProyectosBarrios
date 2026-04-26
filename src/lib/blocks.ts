export type LotStatus = "disponible" | "reservado" | "vendido" | "bloqueado";

export interface BlockDef {
  code: string;
  etapa: 1 | 2;
  lots: number;
  layout: "perimeter24" | "perimeter20" | "linear21" | "linear18";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LotRect {
  num: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BLOCKS: BlockDef[] = [
  { code: "Mz. 1",  etapa: 1, lots: 24, layout: "perimeter24", x: 14,  y: 12,  w: 96,  h: 38 },
  { code: "Mz. 2",  etapa: 1, lots: 24, layout: "perimeter24", x: 114, y: 12,  w: 96,  h: 38 },
  { code: "Mz. 3",  etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 12,  w: 96,  h: 38 },
  { code: "Mz. 4",  etapa: 1, lots: 24, layout: "perimeter24", x: 14,  y: 54,  w: 96,  h: 38 },
  { code: "Mz. 5",  etapa: 1, lots: 24, layout: "perimeter24", x: 114, y: 54,  w: 96,  h: 38 },
  { code: "Mz. 6",  etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 54,  w: 96,  h: 38 },
  { code: "Mz. 7",  etapa: 1, lots: 24, layout: "perimeter24", x: 14,  y: 96,  w: 96,  h: 38 },
  { code: "Mz. 8",  etapa: 1, lots: 24, layout: "perimeter24", x: 114, y: 96,  w: 96,  h: 38 },
  { code: "Mz. 9",  etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 96,  w: 96,  h: 38 },
  { code: "Mz. 10", etapa: 1, lots: 21, layout: "linear21",    x: 14,  y: 138, w: 196, h: 14 },
  { code: "Mz. 11", etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 138, w: 96,  h: 38 },
  { code: "Mz. 18", etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 222, w: 96,  h: 38 },
  { code: "Mz. 22", etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 264, w: 96,  h: 38 },
  { code: "Mz. 26", etapa: 1, lots: 24, layout: "perimeter24", x: 214, y: 306, w: 96,  h: 38 },
  { code: "Mz. 12", etapa: 2, lots: 24, layout: "perimeter24", x: 314, y: 138, w: 96,  h: 38 },
  { code: "Mz. 13", etapa: 2, lots: 24, layout: "perimeter24", x: 414, y: 138, w: 96,  h: 38 },
  { code: "Mz. 14", etapa: 2, lots: 20, layout: "perimeter20", x: 514, y: 138, w: 80,  h: 38 },
  { code: "Mz. 15", etapa: 2, lots: 24, layout: "perimeter24", x: 314, y: 180, w: 96,  h: 38 },
  { code: "Mz. 16", etapa: 2, lots: 24, layout: "perimeter24", x: 414, y: 180, w: 96,  h: 38 },
  { code: "Mz. 17", etapa: 2, lots: 20, layout: "perimeter20", x: 514, y: 180, w: 80,  h: 38 },
  { code: "Mz. 19", etapa: 2, lots: 24, layout: "perimeter24", x: 314, y: 222, w: 96,  h: 38 },
  { code: "Mz. 20", etapa: 2, lots: 24, layout: "perimeter24", x: 414, y: 222, w: 96,  h: 38 },
  { code: "Mz. 21", etapa: 2, lots: 20, layout: "perimeter20", x: 514, y: 222, w: 80,  h: 38 },
  { code: "Mz. 23", etapa: 2, lots: 24, layout: "perimeter24", x: 314, y: 264, w: 96,  h: 38 },
  { code: "Mz. 24", etapa: 2, lots: 24, layout: "perimeter24", x: 414, y: 264, w: 96,  h: 38 },
  { code: "Mz. 25", etapa: 2, lots: 20, layout: "perimeter20", x: 514, y: 264, w: 80,  h: 38 },
  { code: "Mz. 27", etapa: 2, lots: 24, layout: "perimeter24", x: 414, y: 306, w: 96,  h: 38 },
  { code: "Mz. 28", etapa: 2, lots: 20, layout: "perimeter20", x: 514, y: 306, w: 80,  h: 38 },
];

export const AMENITIES = [
  { code: "PLAZA",  x: 214, y: 180, w: 96, h: 38, label: "Plaza · Espacio verde" },
  { code: "CANCHA", x: 314, y: 306, w: 96, h: 38, label: "Cancha · Parrillas" },
];

export function computeLotRects(b: BlockDef): LotRect[] {
  const rects: LotRect[] = [];
  const m = 1.2;
  const innerX = b.x + m;
  const innerY = b.y + m;
  const innerW = b.w - 2 * m;
  const innerH = b.h - 2 * m;

  if (b.layout === "linear21" || b.layout === "linear18") {
    const cols = b.lots;
    const gap = 0.2;
    const lotW = (innerW - (cols - 1) * gap) / cols;
    const lotH = innerH;
    for (let i = 0; i < cols; i++) {
      rects.push({
        num: i + 1,
        x: innerX + i * (lotW + gap),
        y: innerY,
        w: lotW,
        h: lotH,
      });
    }
    return rects;
  }

  const cfg = b.layout === "perimeter24"
    ? { left: 4, top: 8, right: 4, bottom: 8 }
    : { left: 4, top: 6, right: 4, bottom: 6 };

  const sideW = innerW * 0.085;
  const centerW = innerW - 2 * sideW;
  const gap = 0.18;

  const topCount = cfg.top;
  const topLotW = (centerW - (topCount - 1) * gap) / topCount;
  const topRowH = innerH * 0.46;

  const leftLotH = (innerH - 3 * gap) / 4;
  const rightLotH = leftLotH;

  const bottomCount = cfg.bottom;
  const bottomLotW = (centerW - (bottomCount - 1) * gap) / bottomCount;
  const bottomRowY = innerY + innerH - innerH * 0.46;

  rects.push({ num: 1, x: innerX, y: innerY, w: sideW, h: leftLotH });

  for (let i = 0; i < topCount; i++) {
    rects.push({
      num: 2 + i,
      x: innerX + sideW + gap + i * (topLotW + gap),
      y: innerY,
      w: topLotW,
      h: topRowH,
    });
  }

  const trNum = topCount + 2;
  rects.push({
    num: trNum,
    x: innerX + innerW - sideW,
    y: innerY,
    w: sideW,
    h: leftLotH,
  });

  for (let i = 1; i <= 3; i++) {
    rects.push({
      num: trNum + i,
      x: innerX + innerW - sideW,
      y: innerY + i * (rightLotH + gap),
      w: sideW,
      h: rightLotH,
    });
  }

  const brNum = trNum + 3;
  for (let i = 0; i < bottomCount; i++) {
    rects.push({
      num: brNum + 1 + i,
      x: innerX + innerW - sideW - gap - (i + 1) * bottomLotW - i * gap,
      y: bottomRowY,
      w: bottomLotW,
      h: innerH * 0.46,
    });
  }

  const blNum = brNum + 1 + bottomCount;
  rects.push({
    num: blNum,
    x: innerX,
    y: innerY + innerH - leftLotH,
    w: sideW,
    h: leftLotH,
  });

  for (let i = 1; i <= 2; i++) {
    rects.push({
      num: blNum + i,
      x: innerX,
      y: innerY + (3 - i) * (leftLotH + gap),
      w: sideW,
      h: leftLotH,
    });
  }

  return rects;
}

export function totalLots(): number {
  return BLOCKS.reduce((s, b) => s + b.lots, 0);
}
