const BASE_CARDS=[
{id:"juice",label:"ジュース",speech:"ジュースが ほしいです",emoji:"🥤"},
{id:"tea",label:"おちゃ",speech:"おちゃが ほしいです",emoji:"🍵"},
{id:"water",label:"みず",speech:"みずが ほしいです",emoji:"💧"},
{id:"milk",label:"ぎゅうにゅう",speech:"ぎゅうにゅうが ほしいです",emoji:"🥛"},
{id:"apple",label:"りんご",speech:"りんごが ほしいです",emoji:"🍎"},
{id:"banana",label:"バナナ",speech:"バナナが ほしいです",emoji:"🍌"},
{id:"music",label:"おんがく",speech:"おんがくを したいです",emoji:"🎵"},
{id:"break",label:"やすむ",speech:"やすみたいです",emoji:"🛋️"}];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let phase=Number(load("ptp_phase",1)),count=Number(load("ptp_count",4)),speechOn=load("ptp_speech",true),selected=null,stats=load("ptp_stats",{independent:0,assist:0,sent:0});
function visibleCards(){if(phase===1||phase===2)return BASE_CARDS.slice(0,1);return BASE_CARDS.slice(0,count)}
function instruction(){if(phase===1)return "カードを1まい えらんで、相手に つたえよう";if(phase===2)return "カードを えらんで、自分から相手に とどけよう";return "ほしいものを えらんで、相手に つたえよう"}
function render(){$$(".phase button").forEach(b=>b.classList.toggle("active",Number(b.dataset.phase)===phase));$("#instruction").textContent=instruction();$("#cards").innerHTML=visibleCards().map(c=>"<button class='card "+(selected?.id===c.id?"selected-card":"")+"' data-id='"+c.id+"'><div class='emoji'>"+c.emoji+"</div><div class='label'>"+c.label+"</div></button>").join("");$$(".card").forEach(b=>b.onclick=()=>choose(b.dataset.id));if(selected){$("#selected").className="selected";$("#selected").innerHTML="<span class='emoji'>"+selected.emoji+"</span><span>"+selected.label+"</span>";$("#sendBtn").disabled=false}else{$("#selected").className="selected empty";$("#selected").textContent="カードを えらんでね";$("#sendBtn").disabled=true}$("#phaseSelect").value=String(phase);$("#cardCount").value=String(count);$("#speechToggle").checked=speechOn;$("#independentCount").textContent=stats.independent;$("#assistCount").textContent=stats.assist;$("#sentCount").textContent=stats.sent}
function choose(id){selected=BASE_CARDS.find(c=>c.id===id)||null;render()}
function speak(text){if(!speechOn||!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;speechSynthesis.speak(u)}
function openPartner(){if(!selected)return;$("#partnerCard").textContent=selected.emoji;$("#partnerText").textContent=selected.speech;$("#partnerModal").classList.remove("hidden");speak(selected.speech)}
function understood(){if(!selected)return;stats.sent++;save("ptp_stats",stats);$("#partnerModal").classList.add("hidden");$("#successText").textContent="「"+selected.label+"」が つたわりました";$("#successModal").classList.remove("hidden");render()}
function again(){selected=null;$("#successModal").classList.add("hidden");render()}
function log(kind){stats[kind]++;save("ptp_stats",stats);render()}
$$(".phase button").forEach(b=>b.onclick=()=>{phase=Number(b.dataset.phase);selected=null;save("ptp_phase",phase);render()});
$("#sendBtn").onclick=openPartner;$("#understoodBtn").onclick=understood;$("#cancelPartnerBtn").onclick=()=>$("#partnerModal").classList.add("hidden");$("#againBtn").onclick=again;$("#helpBtn").onclick=()=>log("assist");$("#independentBtn").onclick=()=>log("independent");$("#teacherBtn").onclick=()=>$("#teacherModal").classList.remove("hidden");$("#closeTeacherBtn").onclick=()=>$("#teacherModal").classList.add("hidden");
$("#phaseSelect").onchange=e=>{phase=Number(e.target.value);selected=null;save("ptp_phase",phase);render()};$("#cardCount").onchange=e=>{count=Number(e.target.value);save("ptp_count",count);render()};$("#speechToggle").onchange=e=>{speechOn=e.target.checked;save("ptp_speech",speechOn)};$("#resetStatsBtn").onclick=()=>{stats={independent:0,assist:0,sent:0};save("ptp_stats",stats);render()};render();