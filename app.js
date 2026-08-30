const CARDS=[
{id:"juice",label:"ジュース",speech:"ジュース",emoji:"🥤",category:"のみもの"},
{id:"tea",label:"おちゃ",speech:"おちゃ",emoji:"🍵",category:"のみもの"},
{id:"water",label:"みず",speech:"みず",emoji:"💧",category:"のみもの"},
{id:"milk",label:"ぎゅうにゅう",speech:"ぎゅうにゅう",emoji:"🥛",category:"のみもの"},
{id:"apple",label:"りんご",speech:"りんご",emoji:"🍎",category:"たべもの"},
{id:"banana",label:"バナナ",speech:"バナナ",emoji:"🍌",category:"たべもの"},
{id:"cookie",label:"おかし",speech:"おかし",emoji:"🍪",category:"たべもの"},
{id:"rice",label:"ごはん",speech:"ごはん",emoji:"🍚",category:"たべもの"},
{id:"music",label:"おんがく",speech:"おんがく",emoji:"🎵",category:"かつどう"},
{id:"outside",label:"そと",speech:"そと",emoji:"🌳",category:"かつどう"},
{id:"break",label:"やすむ",speech:"やすむ",emoji:"🛋️",category:"かつどう"},
{id:"toilet",label:"トイレ",speech:"トイレ",emoji:"🚻",category:"かつどう"}];
const CATS=["のみもの","たべもの","かつどう"];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

let phase=Number(load("ptp_phase",1));
let count=Number(load("ptp_count",4));
let speechOn=load("ptp_speech",true);
let singleCardId=load("ptp_single","juice");
let category=load("ptp_category","のみもの");
let selected=null;
let strip=[];
let exchangeReady=false;
let stats=load("ptp_stats",{independent:0,assist:0,sent:0});

function phaseName(){
 if(phase===1)return "Phase 1：1枚を交換する";
 if(phase===2)return "Phase 2：自分から相手へ届ける";
 if(phase===3)return "Phase 3：複数から選んで交換する";
 return "Phase 4：Sentence Stripで文を作る";
}
function instruction(){
 if(phase===1)return "カードを とって、相手に わたそう";
 if(phase===2)return "カードを とって、相手のところまで とどけよう";
 if(phase===3)return "ほしいカードを えらんで、交換するところへ おこう";
 return "「ほしいです」とカードを Sentence Strip に ならべよう";
}
function visibleCards(){
 if(phase<=2)return CARDS.filter(c=>c.id===singleCardId);
 return CARDS.filter(c=>c.category===category).slice(0,count);
}
function cardById(id){return CARDS.find(c=>c.id===id)}
function resetExchange(){selected=null;strip=[];exchangeReady=false}
function render(){
 $("#phaseLabel").textContent=phaseName();
 $("#instruction").textContent=instruction();
 $("#stripArea").classList.toggle("hidden",phase!==4);
 $("#categoryTabs").innerHTML=phase>=3?CATS.map(c=>"<button class='tab "+(c===category?"active":"")+"' data-cat='"+c+"'>"+c+"</button>").join(""):"";
 $$(".tab").forEach(b=>b.onclick=()=>{category=b.dataset.cat;save("ptp_category",category);resetExchange();render()});
 const usedIds=new Set(strip.filter(x=>x.type==="item").map(x=>x.id));
 $("#cards").innerHTML=visibleCards().map(c=>"<button class='card "+(usedIds.has(c.id)?"used":"")+"' draggable='true' data-id='"+c.id+"'><div class='emoji'>"+c.emoji+"</div><div class='label'>"+c.label+"</div></button>").join("");
 $$(".card").forEach(bindCard);
 renderStrip();
 renderExchange();
 fillTeacher();
}
function bindCard(el){
 el.onclick=()=>placeCard(el.dataset.id);
 el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",el.dataset.id);el.classList.add("dragging")});
 el.addEventListener("dragend",()=>el.classList.remove("dragging"));
}
function placeCard(id){
 const c=cardById(id);if(!c)return;
 if(phase===4){
   if(strip.some(x=>x.type==="item"))return;
   strip=[{type:"prefix",label:"ほしいです",speech:"ほしいです",emoji:"💬"}, {type:"item",...c}];
   exchangeReady=false;
 }else{
   selected=c;exchangeReady=true;
 }
 render();
}
function renderStrip(){
 if(phase!==4)return;
 $("#sentenceStrip").innerHTML=strip.length?strip.map(x=>"<div class='strip-card'><div class='emoji'>"+x.emoji+"</div>"+x.label+"</div>").join(""):"<span style='color:#8b93a1;font-weight:900'>ここに ことばを ならべよう</span>";
}
function renderExchange(){
 const zone=$("#exchangeZone"),hint=$("#exchangeHint");
 if(phase===4){
   if(strip.length===2){
     exchangeReady=true;
     zone.classList.add("ready");
     zone.innerHTML="<div class='exchange-card'>Sentence Strip が できたよ</div>";
   }else{
     exchangeReady=false;zone.classList.remove("ready");zone.innerHTML="<span id='exchangeHint'>Sentence Strip を つくろう</span>";
   }
 }else if(selected){
   zone.classList.add("ready");
   zone.innerHTML="<div class='exchange-card'><span class='emoji'>"+selected.emoji+"</span><span>"+selected.label+"</span></div>";
 }else{
   zone.classList.remove("ready");
   zone.innerHTML="<span id='exchangeHint'>ここに カードを おこう</span>";
 }
 $("#giveBtn").disabled=!exchangeReady;
}
$("#exchangeZone").addEventListener("dragover",e=>e.preventDefault());
$("#exchangeZone").addEventListener("drop",e=>{e.preventDefault();placeCard(e.dataTransfer.getData("text/plain"))});

function phrase(){
 if(phase===4&&strip.length===2)return strip[1].speech+"が ほしいです";
 return selected?selected.speech:"";
}
function visual(){
 if(phase===4&&strip.length===2)return "<div class='sentence-strip'>"+strip.map(x=>"<div class='strip-card'><div class='emoji'>"+x.emoji+"</div>"+x.label+"</div>").join("")+"</div>";
 if(selected)return "<div class='exchange-card'><span class='emoji'>"+selected.emoji+"</span><span>"+selected.label+"</span></div>";
 return "";
}
function speak(text){
 if(!speechOn||!("speechSynthesis" in window))return;
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;speechSynthesis.speak(u);
}
function give(){
 if(!exchangeReady)return;
 $("#partnerVisual").innerHTML=visual();$("#partnerText").textContent=phrase();$("#partnerModal").classList.remove("hidden");speak(phrase());
}
function received(){
 stats.sent++;save("ptp_stats",stats);$("#partnerModal").classList.add("hidden");$("#recordModal").classList.remove("hidden");
}
function record(kind){
 stats[kind]++;save("ptp_stats",stats);$("#recordModal").classList.add("hidden");showSuccess();
}
function showSuccess(){
 $("#successText").textContent="相手に つたえることが できました";$("#successModal").classList.remove("hidden");fillTeacher();
}
function again(){resetExchange();$("#successModal").classList.add("hidden");render()}
function fillTeacher(){
 $("#phaseSelect").value=String(phase);$("#cardCount").value=String(count);$("#speechToggle").checked=speechOn;$("#singleCardSelect").value=singleCardId;
 $("#independentCount").textContent=stats.independent;$("#assistCount").textContent=stats.assist;$("#sentCount").textContent=stats.sent;
}
$("#singleCardSelect").innerHTML=CARDS.map(c=>"<option value='"+c.id+"'>"+c.emoji+" "+c.label+"</option>").join("");
$("#giveBtn").onclick=give;$("#receivedBtn").onclick=received;$("#cancelPartnerBtn").onclick=()=>$("#partnerModal").classList.add("hidden");
$$("[data-record]").forEach(b=>b.onclick=()=>record(b.dataset.record));
$("#skipRecordBtn").onclick=()=>{$("#recordModal").classList.add("hidden");showSuccess()};
$("#againBtn").onclick=again;$("#teacherBtn").onclick=()=>$("#teacherModal").classList.remove("hidden");$("#closeTeacherBtn").onclick=()=>$("#teacherModal").classList.add("hidden");
$("#phaseSelect").onchange=e=>{phase=Number(e.target.value);save("ptp_phase",phase);resetExchange();render()};
$("#cardCount").onchange=e=>{count=Number(e.target.value);save("ptp_count",count);resetExchange();render()};
$("#singleCardSelect").onchange=e=>{singleCardId=e.target.value;save("ptp_single",singleCardId);resetExchange();render()};
$("#speechToggle").onchange=e=>{speechOn=e.target.checked;save("ptp_speech",speechOn)};
$("#resetStatsBtn").onclick=()=>{stats={independent:0,assist:0,sent:0};save("ptp_stats",stats);fillTeacher()};
render();