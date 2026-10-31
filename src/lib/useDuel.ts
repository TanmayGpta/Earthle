import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataConnection, Peer } from 'peerjs';
import { GameMode } from '../types/game';
import { newSeed } from './game';

export const DUEL_SECONDS = 900; // Always a 15-minute showdown
const COUNTDOWN_MS = 3000;
const CONNECT_TIMEOUT_MS = 15000;
// A rival silent this long after the final whistle is scored on what they last sent
const FINISH_GRACE_MS = 5000;

// No lookalikes (0/O, 1/I/L), the code gets read aloud
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const peerId = (code: string) => `earthle-duel-${code}`;

export const cleanCode = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
export const isFullCode = (code: string) => code.length === CODE_LENGTH;

const newCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

export type DuelOrder = 'same' | 'random';

export interface DuelConfig {
  mode: GameMode;
  continent: string;
  order: DuelOrder;
  seed: number;
}

export interface DuelScore {
  score: number;
  lastCorrectMs: number | null; // Since the start; the earlier one wins a tied score
  finished: boolean;
}

type DuelMessage =
  | { type: 'config'; config: DuelConfig }
  | { type: 'full' }
  | { type: 'ready'; ready: boolean }
  | { type: 'start'; inMs: number }
  | ({ type: 'score' } & DuelScore);

export interface DuelState {
  phase: 'idle' | 'opening' | 'lobby' | 'live';
  role: 'host' | 'guest' | null;
  code: string;
  config: DuelConfig | null;
  rivalHere: boolean;
  meReady: boolean;
  rivalReady: boolean;
  startsAt: number | null;
  rival: DuelScore;
  rivalLeft: boolean;
  error: string | null;
}

const IDLE: DuelState = {
  phase: 'idle',
  role: null,
  code: '',
  config: null,
  rivalHere: false,
  meReady: false,
  rivalReady: false,
  startsAt: null,
  rival: { score: 0, lastCorrectMs: null, finished: false },
  rivalLeft: false,
  error: null,
};

export type DuelVerdict = 'win' | 'lose' | 'draw';

// Most correct wins; on a tie, whoever reached that score first. Null until both are done.
export const duelVerdict = (me: DuelScore, rival: DuelScore, rivalLeft: boolean): DuelVerdict | null => {
  if (!me.finished) return null;
  if (rival.finished) {
    if (me.score !== rival.score) return me.score > rival.score ? 'win' : 'lose';
    if (me.lastCorrectMs === rival.lastCorrectMs) return 'draw';
    return (me.lastCorrectMs ?? Infinity) < (rival.lastCorrectMs ?? Infinity) ? 'win' : 'lose';
  }
  return rivalLeft ? 'win' : null;
};

const NETWORK_ERROR = "Couldn't reach the duel server. Check your connection and try again.";

// Peer-to-peer link between the two players; the PeerJS broker is only used to find each other
export function useDuel(onBegin: (config: DuelConfig, startsAt: number) => void) {
  const [state, setState] = useState<DuelState>(IDLE);
  const stateRef = useRef(IDLE);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionRef = useRef(0);
  const onBeginRef = useRef(onBegin);

  useEffect(() => {
    onBeginRef.current = onBegin;
  });

  const update = (patch: Partial<DuelState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  };

  const send = (message: DuelMessage) => {
    if (connRef.current?.open) connRef.current.send(message);
  };

  const teardown = () => {
    sessionRef.current++; // Late callbacks from this peer are now ignored
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
  };

  const fail = (error: string) => {
    teardown();
    update({ ...IDLE, error });
  };

  const begin = (startsAt: number) => {
    update({ phase: 'live', startsAt });
    timersRef.current.push(
      setTimeout(() => {
        const { rival } = stateRef.current;
        if (!rival.finished) update({ rival: { ...rival, finished: true } });
      }, startsAt + DUEL_SECONDS * 1000 + FINISH_GRACE_MS - Date.now())
    );
    onBeginRef.current(stateRef.current.config!, startsAt);
  };

  // The host calls the start, so one message sets both clocks
  const startIfBothReady = () => {
    const { role, meReady, rivalReady, phase } = stateRef.current;
    if (role !== 'host' || !meReady || !rivalReady || phase !== 'lobby') return;
    send({ type: 'start', inMs: COUNTDOWN_MS });
    begin(Date.now() + COUNTDOWN_MS);
  };

  const handleMessage = (message: DuelMessage) => {
    switch (message.type) {
      case 'config':
        timersRef.current.forEach(clearTimeout);
        update({ phase: 'lobby', config: message.config, rivalHere: true });
        break;
      case 'full':
        fail('That duel already has two players.');
        break;
      case 'ready':
        update({ rivalReady: message.ready });
        startIfBothReady();
        break;
      case 'start':
        begin(Date.now() + message.inMs);
        break;
      case 'score':
        update({
          rival: { score: message.score, lastCorrectMs: message.lastCorrectMs, finished: message.finished },
        });
        break;
    }
  };

  const handleClose = (conn: DataConnection) => {
    if (connRef.current !== conn) return;
    connRef.current = null;
    const { phase, role } = stateRef.current;
    if (phase === 'live') update({ rivalLeft: true });
    else if (role === 'host') update({ rivalHere: false, rivalReady: false });
    else fail('The host left the duel.');
  };

  const handlePeerError = (type: string, retryAsHost?: () => void) => {
    if (type === 'unavailable-id' && retryAsHost) return retryAsHost();
    // Already linked or mid-game: the broker no longer matters
    if (connRef.current?.open || stateRef.current.phase === 'live') return;
    fail(type === 'peer-unavailable' ? 'No duel found with that code.' : NETWORK_ERROR);
  };

  const create = async (settings: Pick<DuelConfig, 'mode' | 'continent' | 'order'>) => {
    teardown();
    const session = sessionRef.current;
    const code = newCode();
    const config: DuelConfig = { ...settings, seed: newSeed() };
    update({ ...IDLE, phase: 'opening', role: 'host', code, config });

    const { Peer } = await import('peerjs');
    if (session !== sessionRef.current) return;

    const peer = new Peer(peerId(code));
    peerRef.current = peer;
    peer.on('open', () => update({ phase: 'lobby' }));
    peer.on('error', (err) => handlePeerError(err.type, () => create(settings))); // Code taken
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (connRef.current || stateRef.current.phase !== 'lobby') {
          conn.send({ type: 'full' } satisfies DuelMessage);
          setTimeout(() => conn.close(), 500);
          return;
        }
        connRef.current = conn;
        conn.on('data', (data) => handleMessage(data as DuelMessage));
        conn.on('close', () => handleClose(conn));
        update({ rivalHere: true });
        send({ type: 'config', config });
      });
    });
  };

  const join = async (code: string) => {
    teardown();
    const session = sessionRef.current;
    update({ ...IDLE, phase: 'opening', role: 'guest', code });
    timersRef.current.push(
      setTimeout(() => fail("Couldn't connect to that duel. Try again, or try another network."), CONNECT_TIMEOUT_MS)
    );

    const { Peer } = await import('peerjs');
    if (session !== sessionRef.current) return;

    const peer = new Peer();
    peerRef.current = peer;
    peer.on('error', (err) => handlePeerError(err.type));
    peer.on('open', () => {
      const conn = peer.connect(peerId(code), { reliable: true, serialization: 'json' });
      conn.on('open', () => {
        connRef.current = conn;
      });
      conn.on('data', (data) => handleMessage(data as DuelMessage));
      conn.on('close', () => handleClose(conn));
    });
  };

  const setReady = (ready: boolean) => {
    update({ meReady: ready });
    send({ type: 'ready', ready });
    startIfBothReady();
  };

  const sendScore = useCallback((score: DuelScore) => {
    if (connRef.current?.open) connRef.current.send({ type: 'score', ...score } satisfies DuelMessage);
  }, []);

  const leave = () => {
    teardown();
    update(IDLE);
  };

  // Leaving the page closes the link so the rival isn't left waiting
  useEffect(
    () => () => {
      sessionRef.current++;
      timersRef.current.forEach(clearTimeout);
      peerRef.current?.destroy();
    },
    []
  );

  return { state, create, join, setReady, sendScore, leave };
}
