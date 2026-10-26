import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,createGame,initial} from '../dist/engine.js';
import {SAVE_KEY,restoreGame,saveGame} from '../dist/save.js';

const storage=()=>{
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
};
const solutions=['UULLRULDDDR','DLUUURDDDLDDLLUUULD','URURRUL','RUUULLLRDDRLULD','RDRDLDLULDDURRLD'];
for(const [index,level] of LEVELS.entries()){
 test(`save level ${level.id}: reload preserves position, victory, undo history and reset`,()=>{
  const store=storage(),game=createGame(level);
  for(const d of solutions[index].slice(0,3))game.move(d);
  assert.equal(saveGame(store,game),true);
  const resumed=restoreGame(store);
  assert.equal(resumed.level,level);assert.deepEqual(resumed.state,game.state);
  resumed.undo();game.undo();assert.deepEqual(resumed.state,game.state);
  resumed.reset();
  for(const d of solutions[index])resumed.move(d);
  assert.equal(resumed.state.status,'won');saveGame(store,resumed);
  const won=restoreGame(store);assert.deepEqual(won.state,resumed.state);
  won.undo();assert.equal(won.state.status,'playing');assert.equal(won.state.moves.length,solutions[index].length-1);
  won.reset();saveGame(store,won);assert.deepEqual(restoreGame(store).state,initial(level));
 });
}
test('loss, undo, and level transitions persist on reload',()=>{
 const store=storage(),game=createGame(LEVELS[3]);game.move('L');
 saveGame(store,game);const resumed=restoreGame(store);assert.equal(resumed.state.status,'lost');
 resumed.undo();saveGame(store,resumed);assert.equal(restoreGame(store).state.status,'playing');
 resumed.selectLevel('5');saveGame(store,resumed);
 assert.equal(restoreGame(store).level.id,'5');assert.deepEqual(restoreGame(store).state,initial(LEVELS[4]));
});
test('absent, malformed, incompatible and impossible saves safely start level 2',()=>{
 const store=storage();
 const invalid=[null,'{','null','[]',JSON.stringify({version:2,level:'3',moves:[]}),JSON.stringify({version:1,level:'99',moves:[]}),JSON.stringify({version:1,level:'3',moves:'U'}),JSON.stringify({version:1,level:'3',moves:['X']}),JSON.stringify({version:1,level:'4',moves:['L','U']}),JSON.stringify({version:1,level:'3',moves:Array(10001).fill('U')}),' '.repeat(100001)];
 for(const raw of invalid){store.setItem(SAVE_KEY,raw);const game=restoreGame(store);assert.equal(game.level.id,'2');assert.deepEqual(game.state,initial(LEVELS[1]));}
});
test('storage read, write and quota errors never prevent play',()=>{
 for(const store of [undefined,{getItem(){throw Error('denied')},setItem(){throw Error('quota')}}]){
  const game=restoreGame(store);game.move('D');assert.equal(game.state.moves.length,1);assert.equal(saveGame(store,game),false);
 }
});
