import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');

  try {
    if (!roomCode) throw new Error('Missing params that are required');
    if (roomCode?.length !== 6) throw new Error('Param cde not valid');
    // const { rows } = await sql`SELECT * FROM TTTWPRooms WHERE roomCode= ${roomCode} LIMIT 1;`;
    // const d = rows[0];
    return NextResponse.json({ }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  } 
}