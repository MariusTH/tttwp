"use client"
import React, {useEffect, useState} from "react";
import { DataConnection, Peer } from "peerjs";
import { getId } from '@/app/utils'
import { MaybeMonad, Monad } from "@/app/monad";

const ZERO_STATE = [0,0,0,0,0,0,0,0,0]
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

const sameState = (a: number[] | undefined, b: number[] | undefined) => {
    if (!a && b) return false;
    if (a && !b) return false;
    if (!a && !b) return true

    if (a && b ) {
        if (a.length !== 9 || b.length !== 9) return false;
        for (let i = 0; i < 9; i++) {
            if(a && b && a[i] !== b[i]) {
                return false;
            }
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
    state: number[];
};

const getLocalState = (id: string) => {
    const loadedState = localStorage.getItem(id);
    if (!loadedState) return undefined;
    return getState(loadedState);
}

const getBaseOfId = (roomCode: string) => (local: boolean): string => {
    return local ? roomCode : generateCode(6)
}

const createPeer = (id: string): Peer => {
    return new Peer(id);
}

const setupConnection = (
    conn: DataConnection,
    state: number[] | undefined,
    setState: React.Dispatch<React.SetStateAction<number[] | undefined>>, 
) => {
    DATA_CONNECTIONS.push(conn);
    console.log("Setting up : ", conn)
    conn.on("open", () => {
        console.log("Connection open now")
        conn.on("data", (d) => {
            console.log("Recieving data", d);
            const data = d as PeerData;
            if (!data.state) {
                console.error("We recieved data that is not right :(");
                return;
            }
            if (Array.isArray(data.state) && data.state.every(item => typeof item === 'number')) {
                let numberArray: number[] = data.state;
                console.log("State : ", state, "new state: ", numberArray)
                if (!sameState(state, numberArray)) {
                    console.log("Setting new state from data")
                    setState(numberArray)
                }
            }
        });
    })
}

const sendInitialState = (state: number[] | undefined, conn: DataConnection) => {      
    conn.send({state});
}

const updateCell = (i: number, j: number, playersTurn: 1 | -1) => (state: number[]) => {
    state[i*3 + j] = playersTurn;
    return state;
}

const getConnection = (
    state: number[] | undefined,
    setState: React.Dispatch<React.SetStateAction<number[] | undefined>>,
    roomCode?: string,
) => (peer: Peer) => {
    const promise = new Promise<DataConnection>((resolve) => {
        if(!roomCode) {
            peer.on("connection", (conn) => {
                setupConnection(conn, state, setState)
                sendInitialState(state, conn)
            })
        } else {     
            peer.on("open", () => {
                const conn = peer.connect(getId(roomCode));
                setupConnection(conn, state, setState)
            })
        }
    });
    return promise;
} 

export default function Page({ params }: { params: { code: string, fallback: any } }) {
    const [state, setState] = useState<number[] | undefined>()
    const [local, setLocal] = useState<boolean>();
    const [peer, setPeer] = useState<Peer>();

    useEffect(() => {
        if (local !== undefined) return;
        const isLocal = MaybeMonad.of(getId(params.code))
        .map(getLocalState)
        .map((s) => {
            setState(s)
            return s
        }).isSome();
        console.log("Is local: ", isLocal);
        setLocal(isLocal)
        
    },[params.code, local]);

    useEffect(() => {
        if (peer || local === undefined) return;
        Monad.of(local)
        .map(getBaseOfId(params.code))
        .map(getId)
        .map(createPeer)
        .map((peer) => {
            setPeer(peer);
        });
    }, [local, params.code, peer]);


    if(peer && local !== undefined) {
        Monad.of(peer)
        .map(getConnection(state, setState, local ? undefined : params.code))
        .map(async (connPromise) => {
            const conn = await connPromise;
            if ( local && state) {
                sendInitialState(state, conn)
            }
            DATA_CONNECTIONS.push(conn);
        })
    }

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
                                Monad.of([...usedState])
                                .map(updateCell(i,j,playersTurn))
                                .map((newState) => {
                                    updateState(newState);
                                    setState(newState);
                                })
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
