import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Stub for now
  return new NextResponse(JSON.stringify({ code: 'SUCCESS', message: '成功' }));
}
