export const LEVELS = Object.freeze([
 Object.freeze({id:'1',name:'Первый контакт',size:4,
  red:{start:[3,0],goal:[1,2],walls:[[0,0],[1,3],[2,1]]},
  blue:{start:[0,2],goal:[3,1],walls:[[1,1],[1,2],[1,3]]}}),
 Object.freeze({id:'2',name:'Сложный манёвр',size:4,
  red:{start:[3,3],goal:[3,0],walls:[[1,0],[1,3],[2,3],[3,1]]},
  blue:{start:[2,3],goal:[1,2],walls:[[2,0],[3,0],[3,1],[3,2]]}})
]);
export const LEVEL=LEVELS[0];
export const DELTAS={U:[-1,0],D:[1,0],L:[0,-1],R:[0,1]};
export function initial(level=LEVEL){return {red:[...level.red.start],blue:[...level.blue.start],status:'playing',moves:[]};}
export function step(state,direction,level=LEVEL){
 if(state.status!=='playing'||!DELTAS[direction])return state;
 const next={...state,moves:[...state.moves,direction]};
 for(const color of ['red','blue']){
  const p=state[color].map((v,i)=>v+DELTAS[direction][i]);
  next[color]=p.some(v=>v<0||v>=level.size)||level[color].walls.some(w=>w[0]===p[0]&&w[1]===p[1])?[...state[color]]:p;
 }
 const reached=['red','blue'].map(c=>next[c].every((v,i)=>v===level[c].goal[i]));
 next.status=reached.every(Boolean)?'won':reached.some(Boolean)?'lost':'playing';
 return next;
}
export function createGame(level=LEVEL){let active=level,states=[initial(active)];return {
 get level(){return active},get state(){return states.at(-1)},get canUndo(){return states.length>1},
 move(d){const s=step(this.state,d,active);if(s!==this.state)states.push(s);return this.state},
 undo(){if(states.length>1)states.pop();return this.state},
 reset(){states=[initial(active)];return this.state},
 selectLevel(id){const next=LEVELS.find(l=>l.id===String(id));if(next&&next!==active){active=next;states=[initial(active)]}return this.state}
};}
