const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const mobileMenu=matchMedia('(max-width:760px)'),navigation=$('.header nav'),menuToggle=$('.menu-toggle');
function setMenu(open){menuToggle.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);navigation.inert=mobileMenu.matches&&!open;if(mobileMenu.matches)navigation.setAttribute('aria-hidden',String(!open));else navigation.removeAttribute('aria-hidden')}
menuToggle.addEventListener('click',()=>setMenu(menuToggle.getAttribute('aria-expanded')!=='true'));
$$('.header nav a').forEach((a,i)=>{a.style.setProperty('--nav-order',i);a.addEventListener('click',()=>setMenu(false))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){setMenu(false);menuToggle.focus()}});
mobileMenu.addEventListener('change',()=>setMenu(false));setMenu(false);
// Hold the composition until the five-second sequence and its assets are ready.
const preloader=$('.preloader'),shell=$('.page-shell');shell.inert=true;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const loaderStarted=performance.now();
function setLoadingPhase(phase){preloader.dataset.phase=phase;preloader.dataset[phase+'At']=String(Math.round(performance.now()-loaderStarted))}
const contentImages=$$('img');contentImages.forEach(img=>{img.loading='eager'});
const imageUrls=new Set();
['.brand-symbol','.hero-court','.coach-visual','.final-court','.ball-secondary'].forEach(selector=>{const el=$(selector);if(!el)return;for(const match of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g))imageUrls.add(match[1])});
const assetReadiness=Promise.all(contentImages.map(img=>img.decode().catch(()=>undefined)).concat([...imageUrls].map(src=>{const img=new Image();img.src=src;return img.decode().catch(()=>undefined)}),document.fonts.ready));
const siteReady=(async()=>{await pause(1000);setLoadingPhase('loading');await Promise.all([pause(3000),assetReadiness]);setLoadingPhase('complete');await pause(1000);await new Promise(requestAnimationFrame);document.documentElement.classList.remove('site-loading');document.documentElement.classList.add('site-ready');shell.inert=false;setLoadingPhase('done');preloader.classList.add('done')})();
siteReady.then(()=>{if(reduce.matches)return;document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});$$('.reveal').forEach((el,i)=>{el.style.transitionDelay=(el.closest('.program-grid,.price-grid,.values')?i%3*70:0)+'ms';observer.observe(el)})});
const hero=$('.hero'),motionLayers=$$('.hero [data-depth]');let targetX=0,targetY=0,currentX=0,currentY=0,parallaxFrame=0;
function renderParallax(){currentX+=(targetX-currentX)*.055;currentY+=(targetY-currentY)*.055;motionLayers.forEach(el=>{const depth=Number(el.dataset.depth);el.style.translate=(currentX*depth)+'px '+(currentY*depth)+'px'});if(Math.abs(targetX-currentX)+Math.abs(targetY-currentY)>.004)parallaxFrame=requestAnimationFrame(renderParallax);else parallaxFrame=0}
hero.addEventListener('pointermove',e=>{if(reduce.matches||!matchMedia('(min-width: 761px) and (pointer: fine)').matches)return;const r=hero.getBoundingClientRect();targetX=(e.clientX-r.left)/r.width-.5;targetY=(e.clientY-r.top)/r.height-.5;if(!parallaxFrame)parallaxFrame=requestAnimationFrame(renderParallax)});
function resetParallax(){targetX=targetY=currentX=currentY=0;cancelAnimationFrame(parallaxFrame);parallaxFrame=0;motionLayers.forEach(el=>el.style.translate='0 0')}
hero.addEventListener('pointerleave',resetParallax);window.addEventListener('resize',resetParallax);reduce.addEventListener('change',resetParallax);
const prices={adult:{trial:'900',group:'7 200',personal:'3 500'},kid:{trial:'600',group:'5 600',personal:'2 800'}};
const priceAnimations=new Map(),moneyFormatter=new Intl.NumberFormat('ru-RU'),formatMoney=n=>moneyFormatter.format(n);
function writeAmount(el,n){let value=el.querySelector('.amount-number');if(!value){el.replaceChildren();value=document.createElement('span');value.className='amount-number';const rub=document.createElement('span');rub.className='amount-currency';rub.textContent=' ₽';el.append(value,rub)}value.textContent=formatMoney(n);el.dataset.current=String(n)}
function animatePrice(el,target){const prior=priceAnimations.get(el);if(prior)cancelAnimationFrame(prior.frame);const from=Number(el.dataset.current||el.textContent.replace(/[^0-9]/g,''));el.setAttribute('aria-label',formatMoney(target)+' рублей');if(reduce.matches||from===target){writeAmount(el,target);priceAnimations.delete(el);return}const state={target,current:from,frame:0};priceAnimations.set(el,state);const started=performance.now(),duration=850+Math.min(400,Math.abs(target-from)/4),direction=Math.sign(target-from);function step(now){if(priceAnimations.get(el)!==state)return;const progress=Math.max(0,Math.min(1,(now-started)/duration)),eased=1-Math.pow(1-progress,2);const next=progress===1?target:from+direction*Math.floor(Math.abs(target-from)*eased);/* Integer steps remain exactly one ruble; each paint samples this continuous count. */const pending=Math.abs(next-state.current),increment=Math.sign(next-state.current);for(let ruble=0;ruble<pending;ruble++){state.current+=increment;writeAmount(el,state.current)}if(progress<1)state.frame=requestAnimationFrame(step);else{priceAnimations.delete(el);if(!priceAnimations.size)$('#price-panel').removeAttribute('aria-busy')}}state.frame=requestAnimationFrame(step)}
function selectPrice(tab){const kid=tab.dataset.price==='kid';$$('[data-price]').forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1});$('#price-panel').setAttribute('aria-labelledby',tab.id);$('#price-panel').setAttribute('aria-busy','true');$$('[data-amount]').forEach(el=>animatePrice(el,Number(prices[tab.dataset.price][el.dataset.amount].replace(/ /g,''))));if(!priceAnimations.size)$('#price-panel').removeAttribute('aria-busy');$('.featured [data-book]').dataset.program=kid?'Дети · группа':'Взрослые · группа'}
$$('[data-price]').forEach((tab,i)=>{tab.addEventListener('click',()=>selectPrice(tab));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=$$('[data-price]');const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:tabs[1-i];selectPrice(next);next.focus()}})});
const dialog=$('.booking-dialog'),form=$('#booking-form');let lastTrigger=null,planText='';
$$('[data-book]').forEach(button=>button.addEventListener('click',()=>{lastTrigger=button;$('#booking-form-view').hidden=false;$('#booking-result').hidden=true;form.elements.program.value=button.dataset.program||'Пробная тренировка';dialog.showModal();document.body.style.overflow='hidden'}));
$('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{document.body.style.overflow='';lastTrigger?.focus()});
form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),name=String(data.get('name')).trim();if(!name){form.elements.name.setCustomValidity('Введи своё имя');form.elements.name.reportValidity();return}form.elements.name.setCustomValidity('');const program=String(data.get('program')),time=String(data.get('time'));$('#result-greeting').textContent=`${name}, вот твой план первой тренировки`;$('#result-format').textContent=program;$('#result-time').textContent='Удобное время: '+time.toLowerCase();$('#booking-form-view').hidden=true;$('#booking-result').hidden=false;planText=`SET POINT · твой первый сет\n\nИмя: ${name}\nФормат: ${program}\nУдобное время: ${time}\nДлительность: 60 минут\n\nПлан занятия:\n1) Знакомство с тренером\n2) Разминка\n3) Хват и первые удары\n4) Небольшой розыгрыш\n\nВозьми удобную спортивную одежду, кроссовки с немаркой подошвой и воду\nРакетка и мячи включены\nВремя занятия согласуй с тренером отдельно\n`;$('#download-plan').focus()});
form.elements.name.addEventListener('input',()=>form.elements.name.setCustomValidity(''));
$('#download-plan').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([planText],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='set-point-first-set.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('#reset-plan').addEventListener('click',()=>{$('#booking-form-view').hidden=false;$('#booking-result').hidden=true;form.elements.program.focus()});

// Animate native disclosures while preserving summary keyboard behaviour.
const faqStates=new Map();
$$('.faq details').forEach(details=>{
 const summary=details.querySelector('summary'),answer=details.querySelector('.faq-answer');
 const state={expanded:details.open,animation:null};faqStates.set(details,state);summary.setAttribute('aria-expanded',String(state.expanded));
 summary.addEventListener('click',event=>{
  event.preventDefault();const height=details.open?answer.getBoundingClientRect().height:0;const opacity=details.open?Number(getComputedStyle(answer).opacity):0;
  if(state.animation){state.animation.onfinish=null;state.animation.cancel();state.animation=null}
  state.expanded=!state.expanded;summary.setAttribute('aria-expanded',String(state.expanded));
  if(reduce.matches){details.open=state.expanded;return}
  details.open=true;const expandedHeight=answer.scrollHeight;
  const animation=answer.animate([{height:height+'px',opacity},{height:(state.expanded?expandedHeight:0)+'px',opacity:state.expanded?1:0}],{duration:260,easing:'cubic-bezier(.22,.68,.25,1)',fill:'both'});state.animation=animation;
  animation.onfinish=()=>{if(state.animation!==animation)return;details.open=state.expanded;animation.cancel();state.animation=null};
 });
});
reduce.addEventListener('change',()=>{faqStates.forEach((state,details)=>{if(state.animation){state.animation.onfinish=null;state.animation.cancel();state.animation=null}details.open=state.expanded});if(reduce.matches){document.documentElement.classList.remove('js-motion');$$('.reveal').forEach(el=>el.classList.add('visible'))}});


// Original illustrations move once on entry, with the same outward ball paths as hover.
const cardSizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>entry.target.style.setProperty('--stack-height',entry.target.offsetHeight+'px')));
$$('.program-card').forEach((card,index)=>{card.style.setProperty('--stack-index',index);cardSizeObserver.observe(card)});
const entryAnimations=new Set();
const illustrationObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;illustrationObserver.unobserve(entry.target);if(reduce.matches)return;entry.target.classList.add('scroll-arrival');entry.target.addEventListener('animationend',()=>entry.target.classList.remove('scroll-arrival'),{once:true})}),{threshold:.28});
siteReady.then(()=>illustrationObserver.observe($('.coach-card')));
const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;countObserver.unobserve(entry.target);const el=entry.target,target=Number(el.dataset.count),suffix=el.dataset.suffix||'';if(reduce.matches){el.textContent=target+suffix;return}const state={el,target,suffix,frame:0};entryAnimations.add(state);const start=performance.now();function frame(now){const progress=Math.max(0,Math.min(1,(now-start)/1250));el.textContent=Math.floor(target*(1-Math.pow(1-progress,3)))+suffix;if(progress<1&&!reduce.matches)state.frame=requestAnimationFrame(frame);else{el.textContent=target+suffix;entryAnimations.delete(state)}}state.frame=requestAnimationFrame(frame)}),{threshold:.65});
siteReady.then(()=>$$('[data-count]').forEach(el=>countObserver.observe(el)));
let racketAnimation=null;$('.side-racket').addEventListener('click',()=>{if(reduce.matches)return;racketAnimation?.cancel();racketAnimation=$('.side-racket').animate([{translate:'0 0'},{translate:'0 -10px',offset:.42},{translate:'0 0'}],{duration:560,easing:'cubic-bezier(.22,.7,.2,1)'})});
reduce.addEventListener('change',()=>{if(!reduce.matches)return;priceAnimations.forEach((state,el)=>{cancelAnimationFrame(state.frame);writeAmount(el,state.target)});priceAnimations.clear();$('#price-panel').removeAttribute('aria-busy');entryAnimations.forEach(state=>{cancelAnimationFrame(state.frame);state.el.textContent=state.target+state.suffix});entryAnimations.clear();racketAnimation?.cancel();$('.coach-card').classList.remove('scroll-arrival')});
