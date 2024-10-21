"use client"
import React, {useEffect, useState} from "react";
import { redirect } from 'next/navigation'
import { getId } from '@/app/utils'

const generateCode = ( length: number ) => {
  return Array(length).fill('x').join('').replace(/x/g, () => {
      const r = Math.floor(Math.random() * 36);
      if (r >= 10) {
          return String.fromCharCode(r + 55);
      }
      return r.toString();
  })
}

export default function Home() {
  const [roomCode, setRoomCode] = useState<string>()
  useEffect(() => {
    if(!roomCode) return;
    const startState = "0,0,0,0,0,0,0,0,0"
    localStorage.setItem(getId(roomCode), startState);
    redirect(`room/${roomCode}`)
  },[roomCode]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
     <div className="">
      <button 
          className="p-2 custom-border custom-border-radius aspect-square hover:bg-sky-70 m-0 text-5xl lg:text-9xl"
          onClick={() => {
            setRoomCode(generateCode(6))
          }}
      >
          Create room
      </button >
     </div>
    </main>
  );
}
