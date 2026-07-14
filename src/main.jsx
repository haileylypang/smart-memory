import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Music2, Volume2, VolumeX, RotateCcw, Play, Trophy, ChartNoAxesColumnIncreasing, X} from 'lucide-react';
import './styles.css';
import './mobile.css';

const LEVELS={easy:{label:'Easy',count:9,speed:1250,cols:3},medium:{label:'Medium',count:12,speed:1000,cols:3},hard:{label:'Hard',count:9,speed:500,cols:3}};
const NOTES=[261.63,293.66,329.63,349.23,392,440,493.88,523.25,587.33,659.25,698.46,783.99];
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

function App(){
 const [level,setLevel]=useState('easy'),[status,setStatus]=useState('ready'),[round,setRound]=useState(0),[best,setBest]=useState(()=>+localStorage.getItem('smart-memory-best')||0),[sequence,setSequence]=useState([]),[input,setInput]=useState([]),[active,setActive]=useState(null),[muted,setMuted]=useState(false);
 const run=useRef(0),audio=useRef(null),winSound=useRef(null),loseSound=useRef(null); const config=LEVELS[level];
 useEffect(()=>{winSound.current=new Audio(`${import.meta.env.BASE_URL}audio/win.mp3`);loseSound.current=new Audio(`${import.meta.env.BASE_URL}audio/lose.mp3`);winSound.current.volume=.25;loseSound.current.volume=.25},[]);
 useEffect(()=>()=>{run.current++},[]);
 const tone=(i,d=240)=>{if(muted)return; const C=window.AudioContext||window.webkitAudioContext; audio.current ||= new C(); const ctx=audio.current,o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine';o.frequency.value=NOTES[i];g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.32,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d/1000);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+d/1000+.03)};
 const show=async(seq,token)=>{setStatus('watch');setInput([]);await sleep(450);for(const n of seq){if(token!==run.current)return;setActive(n);tone(n,Math.min(360,config.speed*.48));await sleep(config.speed*.58);setActive(null);await sleep(config.speed*.22)}if(token===run.current)setStatus('turn')};
 const playResult=(kind)=>{if(muted)return;const sound=kind==='won'?winSound.current:loseSound.current;if(sound){sound.currentTime=0;sound.play().catch(()=>{})}};
 const begin=async()=>{winSound.current?.pause();loseSound.current?.pause();const token=++run.current;const first=Math.floor(Math.random()*config.count);setRound(1);setSequence([first]);setStatus('watch');await show([first],token)};
 const choose=async(i)=>{if(status!=='turn')return;tone(i,220);setActive(i);setTimeout(()=>setActive(null),160);const next=[...input,i];setInput(next);if(i!==sequence[next.length-1]){run.current++;setStatus('failed');playResult('failed');setBest(b=>{const n=Math.max(b,round-1);localStorage.setItem('smart-memory-best',n);return n});return}if(next.length===sequence.length){if(sequence.length===config.count){setBest(b=>{const n=Math.max(b,round);localStorage.setItem('smart-memory-best',n);return n});setStatus('won');playResult('won');return}setStatus('correct');await sleep(650);const token=++run.current,n=Math.floor(Math.random()*config.count),seq=[...sequence,n];setSequence(seq);setRound(seq.length);show(seq,token)}};
 const stopResultSounds=()=>{winSound.current?.pause();loseSound.current?.pause()};
 const closeResult=()=>{stopResultSounds();setStatus('ready')};
 const changeLevel=(key)=>{stopResultSounds();run.current++;setLevel(key);setRound(0);setSequence([]);setInput([]);setActive(null);setStatus('ready')};
 const replay=()=>{if(sequence.length&&status!=='watch'){const token=++run.current;show(sequence,token)}};
 const copy={ready:['Ready to play?','Press start and listen closely.'],watch:['Watch closely','Remember the order of the notes.'],turn:['Your turn',`Repeat ${sequence.length} ${sequence.length===1?'note':'notes'} in order.`],correct:['Perfect!','Adding one more note…'],failed:['Not quite','The sequence got away. Try again!'],won:['Brilliant memory!','You completed every note.']}[status];
 return <main className="app">
  <header><div className="brand"><span className="brandIcon"><img src={`${import.meta.env.BASE_URL}assets/smart-memory-logo-256.png`} alt=""/></span><div><h1>Smart Memory</h1><p>Train your ear. Trust your memory.</p></div></div><div className="levels" aria-label="Difficulty">{Object.entries(LEVELS).map(([k,v])=><button key={k} className={level===k?'selected':''} onClick={()=>changeLevel(k)} disabled={status==='watch'}>{v.label}<small>{v.count} notes · {v.speed/1000}s</small></button>)}</div></header>
  <section className="game" aria-live="polite">
   <div className="status"><span className={`pulse ${status}`}/><div><h2>{copy[0]}</h2><p>{copy[1]}</p></div></div>
   <div className="playRow"><div className="stat"><span><ChartNoAxesColumnIncreasing/></span><small>Round</small><strong>{round}</strong></div>
    <div className={`board ${status==='watch'?'locked':''}`} style={{'--cols':config.cols,'--rows':Math.ceil(config.count/config.cols)}}>{Array.from({length:config.count},(_,i)=><button key={i} onClick={()=>choose(i)} className={`pad ${active===i?'active':''}`} disabled={status!=='turn'} aria-label={`Note ${i+1}`}><span>{i+1}</span><Music2/></button>)}</div>
    <div className="stat"><span><Trophy/></span><small>Best</small><strong>{best}</strong></div></div>
   <div className="controls"><button className="roundBtn" onClick={()=>setMuted(!muted)} aria-label={muted?'Turn sound on':'Mute sound'}>{muted?<VolumeX/>:<Volume2/>}</button><button className="start" onClick={begin}><Play fill="currentColor"/>{status==='failed'||status==='won'?'Play again':round?'Restart game':'Start game'}</button><button className="roundBtn" onClick={replay} disabled={!sequence.length||status==='watch'} aria-label="Replay sequence"><RotateCcw/></button></div>
  </section>
  <footer><span className="howIcon"><Music2/></span><div><h3>How to play</h3><p>Listen to the pattern, then play it back in the same order. Each round adds one more note.</p></div><div className="legend"><b>{config.count}</b><span>notes</span><i/><b>{config.speed/1000}s</b><span>per note</span></div></footer>
  {(status==='won'||status==='failed')&&<div className="modalBackdrop" role="presentation"><section className={`resultModal ${status}`} role="dialog" aria-modal="true" aria-labelledby="result-title"><button className="modalClose" onClick={closeResult} aria-label="Close result"><X/></button><span className="resultIcon">{status==='won'?<Trophy/>:<RotateCcw/>}</span><p className="resultLabel">Game complete</p><h2 id="result-title">{status==='won'?'You win!':'You lose'}</h2><p className="resultScore">Score <strong>{status==='won'?round:Math.max(0,round-1)}</strong></p><button className="resultAction" onClick={begin}><Play fill="currentColor"/>Play again</button></section></div>}
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
