import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

function isCharNumber(c: string) {
  return typeof c === 'string' && c.length === 1 && c === '0' || c === '1' || c === '-1';
}

const validState = (state: string) => {
  const s = state.split(',');
  if (s.length !== 9) return false;
  for (let index = 0; index < s.length; index++) {
    const element = s[index];
    console.log(element)
    if (!isCharNumber(element)) {
      return false;
    }
  }
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');
  const state = searchParams.get('state');

  try {
    if (!roomCode || !state) throw new Error('Missing params that are required');
    if (roomCode?.length !== 6) throw new Error('Param cde not valid');
    if (!validState(state)) throw new Error('Param adg not valid');
    await sql`UPDATE TTTWPRooms SET RoomCode=${roomCode}, State=${state} WHERE RoomCode=${roomCode};`;
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error }, { status: 500 });
  }
 
  const pets = await sql`SELECT * FROM TTTWPRooms;`;
  return NextResponse.json({ pets }, { status: 200 });
}