(function(){
const menuBtn=document.getElementById('mobileMenu'),menu=document.getElementById('mobileMenuPanel');menuBtn.addEventListener('click',()=>{let isOpen=menu.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(isOpen));});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));
// Preserve the user's selections when the visitor reaches the final form.
const formArea=document.getElementById('enquiry'),office=document.getElementById('officeSelect'),locationField=document.getElementById('locationSelect'),other=document.getElementById('requirements');
function goForm(){formArea.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
document.querySelectorAll('.choose-office').forEach(btn=>btn.addEventListener('click',()=>{office.value=btn.dataset.office;goForm()}));
document.querySelectorAll('.choose-location').forEach(btn=>btn.addEventListener('click',()=>{locationField.value=btn.dataset.location;goForm()}));
document.getElementById('custom-location-btn').addEventListener('click',()=>{locationField.value='Another location';goForm();setTimeout(()=>other.focus({preventScroll:true}),450)});
// Section 7: first card visible; the second and third lift into position automatically on entrance.

// Automatic cross-fade between actual reviews, keeping reviewer and quote together.
const reviews=[
 {quote:'The best you can ask for in the heart of Jayanagar, near main road, yet very quiet. I thoroughly enjoy coming to office and look forward to meet amazing people especially the staff at Emlen.',name:'Saandeep K Das',company:'Upman Placements Pvt Ltd'},
 {quote:'The space is modern, clean, and well-equipped.',name:'Jnanesh K',company:'Workspace by Emlen customer'},
 {quote:'Excellent workplace in Jayanagar 3rd block',name:'K ANAND Anand',company:'Workspace by Emlen customer'}
];
const reviewHost=document.getElementById('customerReviews'),reviewText=document.getElementById('reviewQuote'),reviewName=document.getElementById('reviewName'),reviewCompany=document.getElementById('reviewCompany'),reviewContent=document.getElementById('reviewContent');
let reviewIndex=0,reviewTimer=null,reviewPaused=false;
function nextReview(){
  if(document.hidden) return;
  reviewContent.classList.add('is-changing');
  window.setTimeout(()=>{
    reviewIndex=(reviewIndex+1)%reviews.length;
    const r=reviews[reviewIndex];reviewText.textContent=r.quote;reviewName.textContent=r.name;reviewCompany.textContent=r.company;
    reviewContent.classList.remove('is-changing');

  },210);
}
reviewTimer=window.setInterval(nextReview,4000);
// Keyboard-accessible FAQ accordions.
document.querySelectorAll('.faq-toggle').forEach(btn=>btn.addEventListener('click',()=>{let item=btn.closest('.faq-item'),open=item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(i=>{i.classList.remove('open');i.querySelector('.faq-toggle').setAttribute('aria-expanded','false')});if(!open){item.classList.add('open');btn.setAttribute('aria-expanded','true')}}));
// Working local preview handoff. No invisible remote collection; WhatsApp is user initiated.
document.getElementById('officeEnquiry').addEventListener('submit',function(e){e.preventDefault();const error=document.getElementById('formError'),name=document.getElementById('fullName').value.trim(),phone=document.getElementById('phone').value.trim(),email=document.getElementById('email').value.trim(),where=locationField.value;error.style.color='';error.textContent='';if(!name){error.textContent='Please enter your name.';document.getElementById('fullName').focus();return}if(phone.replace(/\D/g,'').length<10){error.textContent='Please enter a valid phone number.';document.getElementById('phone').focus();return}if(!where){error.textContent='Please select your preferred location.';locationField.focus();return}if(email&&!document.getElementById('email').checkValidity()){error.textContent='Please check the email address.';document.getElementById('email').focus();return}const fields=['Hello Workspace by Emlen, I would like a callback about a One Person Office.','Name: '+name,'Phone: '+phone,'Email: '+(email||'Not provided'),'Preferred location: '+where,'Office option: '+office.value,'Move-in timeline: '+(document.getElementById('timeline').value||'Not specified')];if(other.value.trim())fields.push('Other requirements: '+other.value.trim());EmlenLead.deliver(fields.join('\n'),{source:'one-person-office',name:name,phone:phone,email:email,location:where,office:office.value,timeline:document.getElementById('timeline').value,requirements:other.value.trim()},null).then(function(r){if(r.mode==='api'){error.style.color='#0a7a3b';error.textContent='Thanks, we have your request. Our team will call you shortly.'}}).catch(function(){error.style.color='';error.textContent='We could not send your request. Please try again or call +91 98149 53954.'});});
})();;
/* Page-specific enhancements: native content remains accessible if JS is disabled. */
(()=>{
 document.getElementById('unlock-offer')?.addEventListener('click',()=>{
   const extra=document.getElementById('requirements');
   const note='Interested in the 1 month rent free offer (subject to selected plans and terms).';
   if(extra && !extra.value.includes(note))extra.value=(extra.value.trim()?extra.value.trim()+'\n':'')+note;
 });
})();;