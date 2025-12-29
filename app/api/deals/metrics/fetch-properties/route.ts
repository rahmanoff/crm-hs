import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  try {
    const data = await hubSpotService.fetchDealProperties({
      forceRefresh,
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
