'use server'

import { redirect } from 'next/navigation'

const generateCode = ( length: number ) => {
    return Array(length).fill('x').join('').replace(/x/g, () => {
      const r = Math.floor(Math.random() * 36);
      if (r >= 10) {
          return String.fromCharCode(r + 55);
      }
      return r.toString();
    })
  }

export async function createRoom() {
    const roomCode = await generateCode(6);
    const startState = "0,0,0,0,0,0,0,0,0"
    const rep = await fetch(`${process.env.API_URL}/api/addRoom?roomCode=${roomCode}&state=${startState}`)
    console.log(roomCode)
    if (rep.status === 200) {
        redirect(`room/${roomCode}`)
    }

    const body = await rep.json();
    console.log(body)
}