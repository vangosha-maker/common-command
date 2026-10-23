import test from 'node:test';
import assert from 'node:assert/strict';
class Element {
 constructor(dataset={}){this.dataset=dataset;this.children=[];this.attributes={};this.handlers={};this.classList={add:()=>{}};this.textContent='';this.disabled=false;}
 set innerHTML(value){this.html=value;this.children=[]}get innerHTML(){return this.html}
 append(child){this.children.push(child)}insertAdjacentHTML(){}
 setAttribute(name,value){this.attributes[name]=value}
 addEventListener(name,fn){this.handlers[name]=fn}
 click(){if(!this.disabled)(this.onclick||this.handlers.click)?.()}
}
test('UI defaults to level 2; switcher, keypad, undo, reset and keyboard work',async()=>{
 const elements=new Map();const get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)};
 const directions=[...'UDLR'].map(dir=>new Element({dir})),levels=['1','2'].map(level=>new Element({level}));
 let keydown;
 globalThis.document={querySelector:get,querySelectorAll:s=>s==='[data-dir]'?directions:levels,createElement:()=>new Element()};
 globalThis.window={addEventListener:(_,fn)=>{keydown=fn}};
 await import('../dist/app.js');
 assert.equal(get('.level-tag').textContent,'ЗАДАЧА 02');assert.equal(levels[1].attributes['aria-pressed'],'true');
 assert.equal(get('#red-board').children.length,16);assert.equal(get('#blue-board').children.length,16);
 directions[1].click();assert.equal(get('#count').textContent,'01');get('#undo').click();assert.equal(get('#count').textContent,'00');
 for(const d of 'DLUUURDDDLDDLLUUULD')directions.find(b=>b.dataset.dir===d).click();
 assert.match(get('#status-title').textContent,/синхронизация/);assert.equal(get('#count').textContent,'19');assert.ok(directions.every(b=>b.disabled));
 levels[0].click();assert.equal(get('#count').textContent,'00');assert.equal(get('#undo').disabled,true);assert.ok(directions.every(b=>!b.disabled));assert.equal(get('.level-tag').textContent,'ЗАДАЧА 01');
 for(const d of 'UULLRULDDDR')directions.find(b=>b.dataset.dir===d).click();assert.equal(get('#count').textContent,'11');assert.match(get('#status-title').textContent,/синхронизация/);
 levels[1].click();assert.equal(get('#count').textContent,'00');keydown({key:'ArrowDown',preventDefault(){}});assert.equal(get('#count').textContent,'01');get('#reset').click();assert.equal(get('#count').textContent,'00');
 delete globalThis.document;delete globalThis.window;
});
