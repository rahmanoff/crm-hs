import { NextResponse } from 'next/server';
import { fetchDealProperties } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDealProperties();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
