import { useSyncExternalStore } from "react";

// Jam yang berdetak tiap detik untuk tampilan "X s ago" dan timer.
// Di server (prerender) nilainya 0, artinya "belum diketahui".
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}
