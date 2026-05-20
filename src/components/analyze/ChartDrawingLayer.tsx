"use client";

import * as React from "react";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  color: string;
  id: string;
  points: DrawingPoint[];
}

interface ChartDrawingLayerProps {
  color: string;
  enabled: boolean;
  onCommitPath: (path: DrawingPath) => void;
  paths: DrawingPath[];
}

function getDrawingId() {
  return globalThis.crypto?.randomUUID?.() ?? `drawing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPointFromEvent(event: React.PointerEvent<SVGSVGElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

function toSvgPath(points: DrawingPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    return `${path} L ${point.x} ${point.y}`;
  }, "");
}

function DrawingStroke({ path }: { path: DrawingPath }) {
  const svgPath = toSvgPath(path.points);

  if (!svgPath) {
    return null;
  }

  return (
    <path
      d={svgPath}
      fill="none"
      stroke={path.color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function ChartDrawingLayer({ color, enabled, onCommitPath, paths }: ChartDrawingLayerProps) {
  const [currentPath, setCurrentPath] = React.useState<DrawingPath | null>(null);
  const currentPathRef = React.useRef<DrawingPath | null>(null);
  const pointerIdRef = React.useRef<number | null>(null);

  const updateCurrentPath = React.useCallback((path: DrawingPath | null) => {
    currentPathRef.current = path;
    setCurrentPath(path);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    const startPoint = getPointFromEvent(event);
    if (!startPoint) {
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser cancels the pointer during rapid UI changes.
    }

    pointerIdRef.current = event.pointerId;

    updateCurrentPath({
      color,
      id: getDrawingId(),
      points: [startPoint],
    });
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const nextPoint = getPointFromEvent(event);
    if (!nextPoint) {
      return;
    }

    const path = currentPathRef.current;
    if (!path) {
      return;
    }

    const previousPoint = path.points[path.points.length - 1];
    const distance = previousPoint
      ? Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y)
      : 0;

    if (distance < 0.25) {
      return;
    }

    updateCurrentPath({
      ...path,
      points: [...path.points, nextPoint],
    });
  };

  const finishPath = (event: React.PointerEvent<SVGSVGElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The pointer can already be released by the browser on cancel/leave.
    }

    const path = currentPathRef.current;
    updateCurrentPath(null);

    if (path && path.points.length > 1) {
      onCommitPath(path);
    }
  };

  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full touch-none ${
        enabled ? "z-30 cursor-crosshair pointer-events-auto" : "z-10 pointer-events-none"
      }`}
      onPointerCancel={finishPath}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPath}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {paths.map((path) => (
        <DrawingStroke key={path.id} path={path} />
      ))}
      {currentPath ? <DrawingStroke path={currentPath} /> : null}
    </svg>
  );
}
