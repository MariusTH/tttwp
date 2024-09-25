'use server'

export const getId = (code: string): string => {
  return `${process.env.GAME_ID}-${code}`
}