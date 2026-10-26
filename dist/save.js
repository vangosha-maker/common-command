import {LEVELS,createGame} from './engine.js';

export const SAVE_KEY='common-command:save:v1';
const MAX_MOVES=10000;
const fresh=()=>createGame(LEVELS[1]);

// Replay commands rather than trusting stored coordinates or a stored result.
export function restoreGame(storage){
 try{
  const raw=storage?.getItem(SAVE_KEY);
  if(!raw||raw.length>100000)return fresh();
  const saved=JSON.parse(raw),level=LEVELS.find(l=>l.id===saved?.level);
  if(saved?.version!==1||!level||!Array.isArray(saved.moves)||saved.moves.length>MAX_MOVES)return fresh();
  const game=createGame(level);
  for(const d of saved.moves){
   if(!['U','D','L','R'].includes(d)||game.state.status!=='playing')return fresh();
   game.move(d);
  }
  return game;
 }catch{return fresh()}
}

export function saveGame(storage,game){
 try{
  if(!storage)return false;
  if(game.state.moves.length>MAX_MOVES){storage.removeItem(SAVE_KEY);return false}
  storage.setItem(SAVE_KEY,JSON.stringify({version:1,level:game.level.id,moves:game.state.moves}));
  return true;
 }catch{return false}
}
