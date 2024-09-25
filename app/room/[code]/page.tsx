"use client"
import React, {useEffect, useState} from "react";
import { DataConnection, Peer } from "peerjs";
import { getId } from '@/app/utils'

const ZERO_STATE = [0,0,0,0,0,0,0,0,0]

type rs = {
    d: {
        roomcode: string,
        state: string,
    }
}

const IDS: string[] = [];
const DATA_CONNECTIONS: DataConnection[] = [];

const generateCode = ( length: number ) => {
    return Array(length).fill('x').join('').replace(/x/g, () => {
        const r = Math.floor(Math.random() * 36);
        if (r >= 10) {
            return String.fromCharCode(r + 55);
        }
        return r.toString();
    })
}

const updateState = (state: number[]) => {
    console.log("Updating state");
    DATA_CONNECTIONS.forEach((conn) => {
        console.log("Sending data to : ", conn);
        conn.send({state});
    })
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

const winnerPage = (player: number) => (
    <main className="flex min-h-screen flex-col items-center p-24">
        <h2>{getSymbol(player)} is the winner!</h2>
    </main>
);

type PeerData = {
    id?: string;
    state?: number[];
};

export default function Page({ params }: { params: { code: string, fallback: any } }) {
    const [state, setState] = useState<number[]>()
    const [local, setLocal] = useState<boolean>();
    const [peer, setPeer] = useState<Peer>();

    useEffect(() => {
        if (local !== undefined) return;
        const loadedState = localStorage.getItem(getId(params.code));
        if (loadedState !== null && loadedState !== "") {
            const loadedNumberState = getState(loadedState);
            if (loadedNumberState) {
                setState(loadedNumberState)
            }
            setLocal(true)
        } else {
            setLocal(false)
        }
        console.log('UseEffect', Peer)
    },[params.code, local]);

    useEffect(() => {
        if (peer) return;
        if (local !== undefined) {
            if (local) {
                console.log('Server', Peer)
                const peer = new Peer(getId(params.code));
                peer.on("connection", (conn) => {
                    conn.on("data", (d) => {
                        const data = d as PeerData;
                        if (!data.state && !data.id) {
                            console.error("We recieved data that is not right :(");
                            return;
                        }
                        if (Array.isArray(data.state) && data.state.every(item => typeof item === 'number')) {
                            let numberArray: number[] = data.state;
                            if (state && !sameState(state, numberArray))
                            setState(numberArray)
                        }
                        if (data.id) {
                            IDS.push(data.id);
                        }
                    });
                    conn.on("open", () => {         
                        conn.send({
                            id: getId(params.code),
                            state,
                        });
                    });
                    console.log("Pushing to data conn")
                    console.log(conn)
                    DATA_CONNECTIONS.push(conn);
                    console.log(DATA_CONNECTIONS)
                });
                setPeer(peer);
            } else {
                const code = generateCode(6)
                const peer = new Peer(getId(code));
                peer.on("open", (id) => {
                    const conn = peer.connect(getId(params.code));
                    console.log("This is my id : ", id)
                    conn.on("open", () => {
                        conn.on("data", (d) => {
                            console.log("Recieved : ", d)
                            const data = d as PeerData;
                            if (!data.state && !data.id) {
                                console.error("We recieved data that is not right :(");
                                return;
                            }
                            if (Array.isArray(data.state) && data.state.every(item => typeof item === 'number')) {
                                let numberArray: number[] = data.state;
                                setState(numberArray)
                            }
                            if (data.id) {
                                IDS.push(data.id);
                            }
                        });
            
                        conn.send({id})
                    });
                    DATA_CONNECTIONS.push(conn);
                });
                setPeer(peer);
            }
        }
    }, [local, params.code, state, peer]);



    const usedState = state ? state : ZERO_STATE;
    const playersTurn = usedState.reduce((a,b) => a+b) === 0 ? 1 : -1;
    const win = checkWinner(usedState);
    
    if ( win !== 0) {
        setTimeout(() => {
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
                                const s = [...usedState];
                                s[i*3 + j] = playersTurn;
                                updateState(s)
                                setState(s)
                            }}
                        >
                            {`${getSymbol(usedState[i*3 + j])}`}
                        </button >
                    )
                    }))
                })}
            </div>
        </main>
    );
}
