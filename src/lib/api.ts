import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isApplicationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function readOptionalJson(request: Request): Promise<unknown> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody);
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "Request body must contain valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "Request payload validation failed.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (isApplicationError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  logger.error("Internal API route failed.", {
    error: error instanceof Error ? error.message : "Unknown error",
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        message: "Unexpected internal error.",
      },
    },
    { status: 500 },
  );
}
