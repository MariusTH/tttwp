'use client'

import React from 'react'
import { createRoom } from '@/app/actions/createRoom'
 
export function Button() {
    return <button onClick={() => {createRoom()}} >Create Room</button>
  }