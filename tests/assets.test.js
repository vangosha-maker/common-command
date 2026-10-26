import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('all shipped application files match between dist and docs',async()=>{
 for(const file of ['index.html','style.css','app.js','engine.js','save.js']){
  const [dist,docs]=await Promise.all(['dist','docs'].map(dir=>readFile(new URL(`../${dir}/${file}`,import.meta.url))));
  assert.deepEqual(dist,docs,file);
 }
});
