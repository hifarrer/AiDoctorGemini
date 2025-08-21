import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('=== TEST CHAT ROUTE CALLED ===');
  
  return NextResponse.json({ 
    message: 'Test route called successfully',
    timestamp: new Date().toISOString()
  });
}
