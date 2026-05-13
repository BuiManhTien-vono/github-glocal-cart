import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/v1/?depth=3', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache the response for 24 hours to improve performance and avoid rate limits
      next: { revalidate: 86400 } 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch provinces: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Provinces Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to load provinces data' },
      { status: 500 }
    );
  }
}
