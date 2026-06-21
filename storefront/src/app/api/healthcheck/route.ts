import { NextRequest, NextResponse } from 'next/server';

// Force dynamic so the response reflects the running container's env (the SHA
// baked into the image), never a build-time-cached value.
export const dynamic = 'force-dynamic';

export const GET = (req: NextRequest) => {
  return NextResponse.json({
    status: 'ok',
    sha: process.env.GIT_SHA ?? 'unknown',
  });
};