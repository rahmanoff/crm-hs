import { hubSpotService } from '@/lib/hubspot';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get('start') || '0', 10);
  const end = parseInt(searchParams.get('end') || `${Date.now()}`, 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  try {
    const entities = await hubSpotService.getTopWonCompaniesOrContacts(
      start,
      end,
      limit
    );
    return NextResponse.json(entities);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
