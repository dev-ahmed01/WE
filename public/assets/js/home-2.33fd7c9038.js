(function(){var f=document.getElementById('eqForm'),box=document.getElementById('eqFm');if(!f)return;
var CFG={leadEndpoint:''};
function bad(el,on){el.classList.toggle('bad',on);el.setAttribute('aria-invalid',on?'true':'false')}
['eqN','eqP'].forEach(function(id){document.getElementById(id).addEventListener('input',function(){bad(this,false)})});
f.addEventListener('submit',function(e){e.preventDefault();var n=document.getElementById('eqN'),p=document.getElementById('eqP');
var okN=n.value.trim().length>1,okP=/^[+]?[0-9\s-]{10,15}$/.test(p.value.trim());bad(n,!okN);bad(p,!okP);if(!okN){n.focus();return}if(!okP){p.focus();return}
var d={name:n.value.trim(),phone:p.value.trim(),teamSize:f.team.value,workspaceType:f.type.value,requirements:f.req.value.trim(),source:'home-enquiry'};
function done(){box.classList.add('done');box.scrollIntoView({block:'nearest',behavior:'smooth'})}
var sb=f.querySelector('button[type=submit]'),lbl=sb.textContent;sb.disabled=true;sb.textContent='Sending\u2026';EmlenLead.submit(d,{intro:'Hello Workspace by Emlen, I would like a callback about a workspace.'}).then(function(res){sb.disabled=false;sb.textContent=lbl;if(res&&res.mode==='whatsapp'){var op=box.querySelector('.ok p');if(op)op.textContent='WhatsApp has opened with your details. Please press Send there so our team receives them.'}done()}).catch(function(){sb.disabled=false;sb.textContent='Could not send. Try again';setTimeout(function(){sb.textContent=lbl},3500)})})})();;
(function(){var t=document.getElementById('lcTr'),bar=document.getElementById('lcBar');if(!t)return;
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,paused=false;
function step(){var c=t.querySelector('.lk');return c?c.getBoundingClientRect().width+parseFloat(getComputedStyle(t).columnGap||16):300}
function upd(){if(!bar)return;var max=t.scrollWidth-t.clientWidth,x=t.scrollLeft,vis=t.clientWidth/t.scrollWidth;bar.style.width=Math.max(12,vis*100)+'%';bar.style.transform='translateX('+(max>0?(x/max)*(100/vis-100):0)+'%)'}
t.addEventListener('scroll',function(){requestAnimationFrame(upd)},{passive:true});window.addEventListener('resize',upd);upd();
t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();t.scrollBy({left:step()})}if(e.key==='ArrowLeft'){e.preventDefault();t.scrollBy({left:-step()})}});
var down=false,sx=0,sl=0,moved=false;
t.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=t.scrollLeft;paused=true});
window.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>4){moved=true;t.classList.add('drag')}if(moved)t.scrollLeft=sl-dx});
window.addEventListener('pointerup',function(){if(!down)return;down=false;if(moved){t.classList.remove('drag');var s=step(),i=Math.round(t.scrollLeft/s);t.scrollTo({left:i*s})}});
t.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
function tick(){if(paused||document.hidden)return;var max=t.scrollWidth-t.clientWidth;if(t.scrollLeft>=max-2)t.scrollTo({left:0});else t.scrollBy({left:step()})}
if(!reduce){setInterval(tick,4200);
 ['mouseenter','focusin','touchstart'].forEach(function(ev){t.parentNode.addEventListener(ev,function(){paused=true},{passive:true})});
 ['mouseleave','focusout','touchend'].forEach(function(ev){t.parentNode.addEventListener(ev,function(){paused=false})});
 new IntersectionObserver(function(es){paused=!es[0].isIntersecting},{threshold:.3}).observe(t)}
})();;