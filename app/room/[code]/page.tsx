"use client"
import React, {useState} from "react";
import useSWR from "swr";

const ZERO_STATE = [0,0,0,0,0,0,0,0,0]
const fetcher = (url: any) => fetch(url).then((res) => res.json());

type rs = {
    d: {
        roomcode: string,
        state: string,
    }
}

const updateState = (roomCode: string, state: number[]) => {
    const url = `${process.env.API_URL}/api/updateRoom?roomCode=${roomCode}&state=${state.join()}`
    fetch(url)
}

const getState = (state: string): number[] => {
    const arr = state.split(',').map((s) => {return parseInt(s)});
    return arr;
}

const getSymbol = (s: number): string => {
    switch (s) {
        case -1:
            return '⭕'
        case 1:
            return '❌'
        default:
            return ' ';
    }
}

const sameState = (a: number[], b: number[]) => {
    if (a.length !== 9 || b.length !== 9) return false;
    for (let i = 0; i < 9; i++) {
        if(a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

const checkWinner = (s: number[]): number => {
    // rows
    for (let i = 0; i < 3; i++) {
        const sum = s.slice(i*3, i*3 + 3).reduce((a,b) => a+b);
        if( sum === 3 || sum === -3) return sum/3;
    }
    // columns
    for (let i = 0; i < 3; i++) {
        const sum = s[i] + s[i+3] + s[i+6]
        if( sum === 3 || sum === -3) return sum/3;
    }
    // diagonals
    const l = s[0] + s[4] + s[8]
    if( l === 3 || l === -3) return l/3;
    const r = s[2] + s[4] + s[6]
    if( r === 3 || r === -3) return r/3;

    return 0;
}

const errorPage = () => (
    <main className="flex min-h-screen flex-col items-center p-24">
        <h2>An error has occurred. :(</h2>
    </main>
);

const loadingPage = () => (
    <main className="flex min-h-screen flex-col items-center p-24">
        <h2>Loading...</h2>
    </main>
);

const winnerPage = (player: number) => (
    <main className="flex min-h-screen flex-col items-center p-24">
        <h2>{getSymbol(player)} is the winner!</h2>
    </main>
);

export default function Page({ params }: { params: { code: string, fallback: any } }) {
    const { data, error } = useSWR(`/api/getRoom?roomCode=${params.code}`, fetcher, { refreshInterval: 2500 });
    const [state, setState] = useState<number[]>(ZERO_STATE)

    if (error) return errorPage();
    if (!data) return loadingPage();

    if (!sameState(state, getState((data as rs).d.state))) {
        setState(getState((data as rs).d.state));
    }
    
    const playersTurn = state.reduce((a,b) => a+b) === 0 ? 1 : -1;
    const win = checkWinner(state);
    
    if ( win !== 0) {
        setTimeout(() => {
            updateState(params.code, ZERO_STATE);
            setState(ZERO_STATE);
          }, 5000)
        return winnerPage(win);
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 gap-6">
            <h1>⭕❌🤗🗒️❌⭕</h1>
            <h2> <b>Player</b> : {getSymbol(playersTurn)}</h2>
            <div className="board grid grid-cols-3 w-full max-w-3xl aspect-square max-h-dvh">
                {[0,1,2].map((i : number) => {
                    return ([0,1,2].map((j: number) => {
                        return (
                        <button 
                            className="p-2 custom-border custom-border-radius aspect-square hover:bg-sky-70 m-0 text-5xl lg:text-9xl"
                            key={`${j}-${i}`}
                            onClick={() => {
                                const s = [...state];
                                s[i*3 + j] = playersTurn;
                                updateState(params.code, s)
                                setState(s)
                            }}
                        >
                            {`${getSymbol(state[i*3 + j])}`}
                        </button >
                    )
                    }))
                })}
            </div>
        </main>
    );
}
