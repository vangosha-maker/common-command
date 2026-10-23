import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,initial,step,createGame} from '../dist/engine.js';
function shortest(level){
 const queue=[initial(level)],seen=new Set();
 for(let head=0;head<queue.length;head++){
  const s=queue[head];
  for(const d of 'UDLR'){
   const next=step(s,d,level);
   if(next.status==='won')return next.moves.join('');
   if(next.status==='lost')continue;
   const key=[...next.red,...next.blue].join(',');
   if(seen.has(key))continue;seen.add(key);queue.push(next);
  }
 }
 return null;
}
for(const [index,level] of LEVELS.entries()){
 test(`level ${level.id}: BFS verifies shortest legal first-arrival solution`,()=>{
  const solution=shortest(level);assert.equal(solution.length,[11,19][index]);
  let s=initial(level);for(const [i,d] of [...solution].entries()){
   s=step(s,d,level);assert.equal(s.status,i===solution.length-1?'won':'playing');
  }
  assert.equal(step(s,'R',level),s);
 });
 test(`level ${level.id}: all reachable states keep robots in free cells`,()=>{
  const q=[initial(level)],seen=new Set();
  for(let h=0;h<q.length;h++)for(const d of 'UDLR'){
   const s=step(q[h],d,level);
   for(const c of ['red','blue']){assert.ok(s[c].every(v=>v>=0&&v<level.size));assert.ok(!level[c].walls.some(w=>w.every((v,i)=>v===s[c][i])))}
   const k=[...s.red,...s.blue].join(',');if(s.status==='playing'&&!seen.has(k)){seen.add(k);q.push(s)}
  }
 });
}
test('second level loss, undo, reset, victory, undo victory',()=>{
 const g=createGame(LEVELS[1]);for(const d of 'ULLLDD')g.move(d);assert.equal(g.state.status,'lost');assert.equal(g.move('R').status,'lost');
 g.undo();assert.equal(g.state.status,'playing');g.reset();assert.deepEqual(g.state,initial(LEVELS[1]));assert.equal(g.canUndo,false);
 for(const d of shortest(LEVELS[1]))g.move(d);assert.equal(g.state.status,'won');g.undo();assert.equal(g.state.status,'playing');assert.equal(g.state.moves.length,18);
});
test('level switches discard old history and reset only when changed',()=>{
 const g=createGame(LEVELS[1]);g.move('D');g.selectLevel('2');assert.equal(g.state.moves.length,1);
 g.selectLevel('1');assert.equal(g.level,LEVELS[0]);assert.deepEqual(g.state,initial());assert.equal(g.canUndo,false);g.undo();assert.deepEqual(g.state,initial());
 g.move('U');g.selectLevel('2');assert.deepEqual(g.state,initial(LEVELS[1]));g.selectLevel('bad');assert.equal(g.level,LEVELS[1]);
 for(const d of shortest(LEVELS[1]))g.move(d);g.selectLevel('1');assert.equal(g.state.status,'playing');assert.equal(g.canUndo,false);
});
