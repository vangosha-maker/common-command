import {LEVELS,createGame} from './engine.js';
const game=createGame(LEVELS[1]), arrows={U:'↑',D:'↓',L:'←',R:'→'};
const $=s=>document.querySelector(s);
const robot='<span class="robot" aria-hidden="true"><i></i><i></i></span>';
function render(){const s=game.state, LEVEL=game.level;
 $('.level-tag').textContent=`ЗАДАЧА 0${LEVEL.id}`;
 $('#level-name').textContent=LEVEL.name;
 document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===LEVEL.id)));
 for(const color of ['red','blue']){const board=$(`#${color}-board`);board.innerHTML='';
  for(let r=0;r<LEVEL.size;r++)for(let c=0;c<LEVEL.size;c++){const cell=document.createElement('div');cell.className='cell';const match=p=>p[0]===r&&p[1]===c;
   if(LEVEL[color].walls.some(match)){cell.classList.add('wall');cell.innerHTML='<span></span>';}
   if(match(LEVEL[color].goal)){cell.classList.add('goal');cell.innerHTML='<span class="target" aria-hidden="true"></span>';}
   if(match(s[color])){cell.classList.add('occupied');cell.insertAdjacentHTML('beforeend',robot);}
   board.append(cell);
  }
  board.setAttribute('aria-label',`${color==='red'?'Красный':'Синий'} робот: строка ${s[color][0]+1}, столбец ${s[color][1]+1}. Цель: строка ${LEVEL[color].goal[0]+1}, столбец ${LEVEL[color].goal[1]+1}. Стены: ${LEVEL[color].walls.map(p=>`${p[0]+1}, ${p[1]+1}`).join('; ')}.`);
 }
 $('#count').textContent=String(s.moves.length).padStart(2,'0');$('#history-count').textContent=s.moves.length;
 $('#history').innerHTML=s.moves.length?s.moves.map((m,i)=>`<span class="history-move" title="Ход ${i+1}">${arrows[m]}</span>`).join(''):'<span class="empty">Первый ход за тобой</span>';
 $('#history').scrollTop=$('#history').scrollHeight;
 $('#undo').disabled=!game.canUndo;document.querySelectorAll('[data-dir]').forEach(b=>b.disabled=s.status!=='playing');
 $('#status').className=`status ${s.status}`;
 const copy=s.status==='won'?['✓','Идеальная синхронизация!',`Оба робота впервые на целях. Получилось за ${s.moves.length} ходов.`]:s.status==='lost'?['!','Один робот пришёл раньше', 'Цели нужно занять одновременно. Отмени ход или начни заново.']:['↗','Один приказ для двоих','Выбери направление и наблюдай за обоими роботами.'];
 $('.status-icon').textContent=copy[0];$('#status-title').textContent=copy[1];$('#status-text').textContent=copy[2];
}
function move(d){game.move(d);render()}
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{game.selectLevel(b.dataset.level);render()}));
$('#undo').onclick=()=>{game.undo();render()};$('#reset').onclick=()=>{game.reset();render()};
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const d={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',s:'D',a:'L',d:'R',ц:'U',ы:'D',ф:'L',в:'R'}[e.key.length===1?e.key.toLowerCase():e.key];if(d){e.preventDefault();move(d)}});
render();
