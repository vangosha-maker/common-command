import test from 'node:test';import assert from 'node:assert/strict';import {initial,step,createGame} from '../dist/engine.js';
test('initial coordinates',()=>{assert.deepEqual(initial().red,[3,0]);assert.deepEqual(initial().blue,[0,2]);});
test('both move on same command, border independently blocks',()=>{const s=step(initial(),'U');assert.deepEqual(s.red,[2,0]);assert.deepEqual(s.blue,[0,2]);});
test('wall blocks blue but red moves',()=>{let s=step(initial(),'R');s=step(s,'U');assert.deepEqual(s.red,[3,1]);assert.deepEqual(s.blue,[0,3]);});
test('blocked commands still count',()=>{const s=step(initial(),'D');assert.deepEqual(s.red,[3,0]);assert.deepEqual(s.blue,[0,2]);assert.equal(s.moves.length,1)});
test('early arrival loses and freezes',()=>{let s=initial();for(const d of 'UURR')s=step(s,d);assert.equal(s.status,'lost');assert.equal(step(s,'D'),s)});
test('verified simultaneous first arrival wins at 11, never earlier',()=>{let s=initial();for(const [i,d] of [...'UULLRULDDDR'].entries()){s=step(s,d);assert.equal(s.status,i===10?'won':'playing')}assert.deepEqual(s.red,[1,2]);assert.deepEqual(s.blue,[3,1]);assert.equal(step(s,'L'),s)});
test('undo restores lost and won game, reset clears history',()=>{const g=createGame();for(const d of 'UURR')g.move(d);assert.equal(g.state.status,'lost');g.undo();assert.equal(g.state.status,'playing');g.reset();assert.deepEqual(g.state,initial());assert.equal(g.canUndo,false);for(const d of 'UULLRULDDDR')g.move(d);g.undo();assert.equal(g.state.status,'playing');assert.equal(g.state.moves.length,10);g.move('R');assert.equal(g.state.status,'won');g.reset();assert.deepEqual(g.state,initial())});
test('invalid input no-op',()=>assert.equal(step(initial(),'X').moves.length,0));
