var CONFIG={
 leadEndpoint:'',          // POST URL of the existing lead API. Empty = demo mode (simulated success).
 offer:null                // e.g. {title:'...',terms:'...'} once a real offer is configured. Never invent terms.
};
(function(){
var T={solo:'Just me',small:'2 – 5',mid:'6 – 15',large:'15+'},P={privacy:'Privacy',flex:'Flexibility',collab:'Collaboration',hassle:'Zero hassle'},W={now:'This week',month:'This month',explore:'Exploring'};
var SIZE={solo:['Your own space. Your own pace.',"Looks like you're building something independently. Let's find a workspace that gives you room to focus."],
small:['Small team. Big possibilities.','A growing team needs space to collaborate without compromising comfort.'],
mid:['Built for your next stage.',"Your team is growing. Let's find a space that can keep up."],
large:['Room for bigger ambitions.',"Larger teams need more than desks. Let's find a workspace that supports how your people work."]};
var PRI={privacy:['Focus deserves its own space.','Privacy shapes how you work. Tell us about your team and we\'ll narrow things down.'],
flex:['Space that adapts with you.','Flexibility matters. Tell us about your team and we\'ll find something that moves with you.'],
collab:['Better together.','Collaboration is the priority. Tell us about your team and we\'ll look for spaces built for connection.'],
hassle:['Let us handle the workspace.','Less admin, more business. Tell us about your team and we\'ll take it from there.']};
var COMBO={
solo:{privacy:['Focus deserves its own space.','A private workspace could give you the independence and quiet you need to do your best work.'],
 flex:['Work your way.','Independent work changes week to week. A flexible setup keeps you free to adapt.'],
 collab:['Build alongside others.',"Working solo doesn't have to feel solitary. We're looking at spaces with people and energy around you."],
 hassle:['Just show up.','No setup, no admin. A ready-to-use workspace lets you spend your time on the work itself.']},
small:{privacy:['A door that closes.','Small teams do their best work with room for calls and deep focus. We\'re looking at private spaces.'],
 flex:['Start light, stay flexible.',"A small team shouldn't be locked into more than it needs. We're favouring easy, adaptable setups."],
 collab:['Better together.',"For a small team that thrives on collaboration, we're narrowing things down to spaces designed for connection."],
 hassle:['Skip the setup.','Furniture, internet and upkeep handled, so your small team can start working straight away.']},
mid:{privacy:['Privacy, at your scale.','A growing team needs a space of its own, with room for focus and for confidential conversations.'],
 flex:['Space that adapts with you.','Your team needs room to grow without being tied to a rigid setup.'],
 collab:['Room to work together.',"With a team this size, how people share space matters. We're looking at layouts built for collaboration."],
 hassle:['Operations, handled.','Your team is growing. A managed workspace keeps facilities and everyday upkeep off your plate.']},
large:{privacy:['Your own floor plan.',"Larger teams need a space that's truly theirs, with privacy built into how it's laid out."],
 flex:['Grow without the friction.','A bigger team needs space that can change as plans do, without being locked into a rigid setup.'],
 collab:['Space for everyone to connect.',"For a larger team that works together, we're focusing on layouts that bring people closer."],
 hassle:['Let us handle the workspace.','Your team has bigger priorities. A managed workspace could take everyday office operations off your plate.']}};
var WEN={now:['Ready when you are.',"Let's look at what you could move into soon."],month:['Time to choose well.','A little runway means we can match you carefully.'],explore:['No rush.',"Take a look around. We'll help you understand your options."]};
var REC={
 solo:{privacy:['One Person Office','Coworking'],flex:['Coworking','One Person Office'],collab:['Coworking','Private Office'],hassle:['One Person Office','Coworking']},
 small:{privacy:['Private Office','Team Office'],flex:['Coworking','Private Office'],collab:['Private Office','Coworking'],hassle:['Private Office','Team Office']},
 mid:{privacy:['Private Office','Team Office'],flex:['Private Office','Team Office'],collab:['Team Office','Private Office'],hassle:['Team Office','Private Office']},
 large:{privacy:['Team Office','Private Office'],flex:['Team Office','Private Office'],collab:['Team Office','Private Office'],hassle:['Team Office','Private Office']}};
var HEAD={'Coworking':'A flexible space with people around you.','One Person Office':'A private office built around you.','Private Office':'A private office for your team.','Team Office':'A managed office with room for your team.'};
var BASE={'Coworking':'Flexible, social and easy to start','One Person Office':'Quiet, private and ready to use','Private Office':'A closed door for focus and calls','Team Office':'Space and support for a growing team'};
var TIME={now:", with a quick move-in worth exploring.",month:', with time to choose the right space.',explore:", whenever you're ready for a closer look."};

var st={size:null,needs:[],need:null,when:null,rec:null,alt:null,count:0};
var $=function(i){return document.getElementById(i)};
function recompute(){st.need=st.needs[0]||null;st.count=(st.size?1:0)+(st.need?1:0)+(st.when?1:0);
 if(st.size&&st.need){var r=REC[st.size][st.need];st.rec=r[0];st.alt=r[1]}else{st.rec=null;st.alt=null}}
function view(){
 if(st.size&&st.need){var c=COMBO[st.size][st.need];return{k:'c:'+st.size+st.need+(st.when||''),h:c[0],p:c[1]}}
 if(st.size)return{k:'s:'+st.size+(st.when||''),h:SIZE[st.size][0],p:SIZE[st.size][1]};
 if(st.need)return{k:'n:'+st.need+(st.when||''),h:PRI[st.need][0],p:PRI[st.need][1]};
 if(st.when)return{k:'w:'+st.when,h:WEN[st.when][0],p:WEN[st.when][1]};
 return{k:'0',h:'Your ideal workspace starts here.',p:"Tell us a little about your team and we'll help you discover a workspace that fits."}}
var opened=false,sent=false;
function updSteps(){var P=document.querySelector('.pts');if(!P)return;var lis=P.querySelectorAll('li'),ars=P.querySelectorAll('.ar');var on=[st.count>=1,st.count===3,sent];lis.forEach(function(l,i){l.classList.toggle('on',on[i])});ars[0].classList.toggle('on',st.count===3);ars[1].classList.toggle('on',opened||sent)}
var IMG='<img src="/assets/img/img-58b92861.jpg" alt="" data-i="0"><img src="/assets/img/img-2444ee6e.jpg" alt="" data-i="1"><img src="/assets/img/img-cd77883f.jpg" alt="" data-i="2"><img src="/assets/img/img-652d6d19.jpg" alt="" data-i="3">',last='';
function render(){
 recompute();var fin=st.count===3,v=view(),key=fin?'f:'+st.size+st.needs.join('')+st.when:v.k+'|'+st.count;
 if(key===last)return;last=key;var xt='',h,idx=fin?['Coworking','One Person Office','Private Office','Team Office'].indexOf(st.rec):(st.rec?['Coworking','One Person Office','Private Office','Team Office'].indexOf(st.rec):2);
 var th='<div class="th">'+IMG.replace('data-i="'+idx+'"','data-i="'+idx+'" class="on"')+'</div>';
 if(!fin){h=th+'<div class="rz-t sw"><span class="kk">Your starting point</span><h3>'+v.h+'</h3><p>'+v.p+'</p></div>'}
 else{var o=CONFIG.offer,od=o?('<b>'+o.title+'</b> '+o.terms):"<b>A little extra for your next move.</b> Talk to our team to explore available plans and offers.";
  h=th+'<div class="rz-t sw"><span class="kk">Your match</span><h3>'+st.rec+'</h3><p>'+HEAD[st.rec]+'</p></div><button type="button" class="cta sw" id="open">Unlock my offer</button>';xt='<p class="xt sw">'+od+'</p>'}
 $('rm').innerHTML=h;$('xt').innerHTML=xt;updSteps();var b=$('open');if(b)b.addEventListener('click',openM)}
document.querySelectorAll('.qb').forEach(function(q){q.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
 var k=q.dataset.q,on=b.getAttribute('aria-pressed')==='true',v=b.dataset.v;
 if(k==='need'){if(on){b.setAttribute('aria-pressed','false');st.needs=st.needs.filter(function(x){return x!==v})}else{b.setAttribute('aria-pressed','true');st.needs.push(v)}}
 else{q.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});if(on){st[k]=null}else{b.setAttribute('aria-pressed','true');st[k]=v}}
 render()})});
/* modal */
var md=$('md'),opener=null;
function openM(e){opened=true;updSteps();opener=e&&e.currentTarget||document.activeElement;
 $('mchips').innerHTML='<span class="rc">'+st.rec+'</span><span>'+T[st.size]+'</span>'+st.needs.map(function(n){return '<span>'+P[n]+'</span>'}).join('')+'<span>'+W[st.when]+'</span>';
 $('mform').hidden=false;$('mdone').hidden=true;$('merr').textContent='';
 md.classList.add('on');md.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(function(){$('fn').focus()},60)}
function closeM(){md.classList.remove('on');md.setAttribute('aria-hidden','true');document.body.style.overflow='';if(opener&&opener.focus)opener.focus()}
$('mx').addEventListener('click',closeM);
md.addEventListener('mousedown',function(e){if(e.target===md)closeM()});
document.addEventListener('keydown',function(e){if(!md.classList.contains('on'))return;
 if(e.key==='Escape')closeM();
 if(e.key==='Tab'){var f=md.querySelectorAll('button,input'),a=[].filter.call(f,function(x){return !x.closest('[hidden]')&&!x.disabled});
  if(!a.length)return;var fi=a[0],la=a[a.length-1];
  if(e.shiftKey&&document.activeElement===fi){e.preventDefault();la.focus()}else if(!e.shiftKey&&document.activeElement===la){e.preventDefault();fi.focus()}}});
$('mform').addEventListener('submit',function(e){e.preventDefault();
 var n=$('fn'),p=$('fp'),m=$('fe'),err=$('merr'),bad=false;
 [n,p,m].forEach(function(x){x.removeAttribute('aria-invalid')});
 var ph=p.value.replace(/[\s\-()+]/g,'');
 if(n.value.trim().length<2){n.setAttribute('aria-invalid','true');bad=true}
 if(!/^\d{10,13}$/.test(ph)){p.setAttribute('aria-invalid','true');bad=true}
 if(m.value&&!/^\S+@\S+\.\S+$/.test(m.value)){m.setAttribute('aria-invalid','true');bad=true}
 if(bad){err.textContent='Please check the highlighted fields.';return}
 err.textContent='';
 var payload={name:n.value.trim(),phone:p.value.trim(),email:m.value.trim(),source:'home-workspace-matchmaker',answers:{teamSize:T[st.size],priority:st.needs.map(function(n){return P[n]}).join(', '),moveIn:W[st.when]},recommendation:st.rec,alternative:st.alt};
 var btn=$('msub');btn.disabled=true;btn.textContent='Sending…';
 var send=EmlenLead.submit(payload,{intro:'Hello Workspace by Emlen, I would like help finding a workspace.'});
 send.then(function(res){if(res&&res.mode==='whatsapp'){var dm=document.querySelector('#mdone .mp');if(dm)dm.textContent='WhatsApp has opened with your details. Please press Send there so our team receives them.'}$('dname').textContent=payload.name.split(' ')[0];$('mform').hidden=true;$('mdone').hidden=false;sent=true;updSteps();btn.disabled=false;btn.textContent='Send my details';$('dclose').focus()})
 .catch(function(){err.textContent="We couldn't send that just now. Please try again in a moment.";btn.disabled=false;btn.textContent='Send my details'})});
$('dclose').addEventListener('click',closeM);
render();
window.__mm={st:st,CONFIG:CONFIG};
})();;