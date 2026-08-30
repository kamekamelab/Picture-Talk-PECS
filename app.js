const DEFAULT_CARDS=[
{id:"juice",label:"ジュース",speech:"ジュース",emoji:"🥤",category:"のみもの",image:null},
{id:"tea",label:"おちゃ",speech:"おちゃ",emoji:"🍵",category:"のみもの",image:null},
{id:"water",label:"みず",speech:"みず",emoji:"💧",category:"のみもの",image:null},
{id:"milk",label:"ぎゅうにゅう",speech:"ぎゅうにゅう",emoji:"🥛",category:"のみもの",image:null},
{id:"apple",label:"りんご",speech:"りんご",emoji:"🍎",category:"たべもの",image:null},
{id:"banana",label:"バナナ",speech:"バナナ",emoji:"🍌",category:"たべもの",image:null},
{id:"cookie",label:"おかし",speech:"おかし",emoji:"🍪",category:"たべもの",image:null},
{id:"rice",label:"ごはん",speech:"ごはん",emoji:"🍚",category:"たべもの",image:null},
{id:"music",label:"おんがく",speech:"おんがく",emoji:"🎵",category:"かつどう",image:null},
{id:"outside",label:"そと",speech:"そと",emoji:"🌳",category:"かつどう",image:null},
{id:"break",label:"やすむ",speech:"やすむ",emoji:"🛋️",category:"かつどう",image:null},
{id:"toilet",label:"トイレ",speech:"トイレ",emoji:"🚻",category:"かつどう",image:null}
];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let cards=load("ptp_cards",DEFAULT_CARDS).map(c=>({...c,image:c.image||null}));
let phase=Number(load("ptp_phase",1)),count=Number(load("ptp_count",4)),speechOn=load("ptp_speech",true),singleCardId=load("ptp_single","juice"),category=load("ptp_category","のみもの");
let selected=null,strip=[],exchangeReady=false,stats=load("ptp_stats",{independent:0,assist:0,sent:0});
let editorImage=null;

function categories(){return [...new Set(cards.map(c=>(c.category||"その他").trim()).filter(Boolean))]}
function phaseName(){if(phase===1)return "Phase 1：1枚を交換する";if(phase===2)return "Phase 2：自分から相手へ届ける";if(phase===3)return "Phase 3：複数から選んで交換する";return "Phase 4：Sentence Stripで文を作る"}
function instruction(){if(phase===1)return "カードを とって、相手に わたそう";if(phase===2)return "カードを とって、相手のところまで とどけよう";if(phase===3)return "ほしいカードを えらんで、交換するところへ おこう";return "「ほしいです」とカードを Sentence Strip に ならべよう"}
function cardById(id){return cards.find(c=>c.id===id)}
function ensureState(){if(!cardById(singleCardId))singleCardId=cards[0]?.id||"";const cats=categories();if(!cats.includes(category))category=cats[0]||"その他";save("ptp_single",singleCardId);save("ptp_category",category)}
function visibleCards(){ensureState();if(phase<=2)return cards.filter(c=>c.id===singleCardId);return cards.filter(c=>(c.category||"その他")===category).slice(0,count)}
function mediaHtml(c,cls=""){return c.image?"<img class='"+cls+"' src='"+c.image+"' alt=''>":"<div class='"+(cls?cls+" ":"")+"media-emoji'>"+(c.emoji||"🖼️")+"</div>"}
function resetExchange(){selected=null;strip=[];exchangeReady=false}
function render(){
 ensureState();$("#phaseLabel").textContent=phaseName();$("#instruction").textContent=instruction();$("#stripArea").classList.toggle("hidden",phase!==4);
 const cats=categories();$("#categoryTabs").innerHTML=phase>=3?cats.map(c=>"<button class='tab "+(c===category?"active":"")+"' data-cat='"+escapeAttr(c)+"'>"+escapeHtml(c)+"</button>").join(""):"";
 $$(".tab").forEach(b=>b.onclick=()=>{category=b.dataset.cat;save("ptp_category",category);resetExchange();render()});
 const usedIds=new Set(strip.filter(x=>x.type==="item").map(x=>x.id));
 $("#cards").innerHTML=visibleCards().map(c=>"<button class='card "+(usedIds.has(c.id)?"used":"")+"' draggable='true' data-id='"+c.id+"'>"+mediaHtml(c,"card-image")+"<div class='label'>"+escapeHtml(c.label)+"</div></button>").join("");
 $$(".card").forEach(bindCard);renderStrip();renderExchange();fillTeacher();
}
function bindCard(el){el.onclick=()=>placeCard(el.dataset.id);el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",el.dataset.id);el.classList.add("dragging")});el.addEventListener("dragend",()=>el.classList.remove("dragging"))}
function placeCard(id){const c=cardById(id);if(!c)return;if(phase===4){if(strip.some(x=>x.type==="item"))return;strip=[{type:"prefix",label:"ほしいです",speech:"ほしいです",emoji:"💬",image:null},{type:"item",...c}];exchangeReady=false}else{selected=c;exchangeReady=true}render()}
function stripCardHtml(x){return "<div class='strip-card'>"+mediaHtml(x)+(escapeHtml(x.label))+"</div>"}
function renderStrip(){if(phase!==4)return;$("#sentenceStrip").innerHTML=strip.length?strip.map(stripCardHtml).join(""):"<span style='color:#8b93a1;font-weight:900'>ここに ことばを ならべよう</span>"}
function exchangeCardHtml(c){return "<div class='exchange-card'>"+mediaHtml(c)+"<span>"+escapeHtml(c.label)+"</span></div>"}
function renderExchange(){const zone=$("#exchangeZone");if(phase===4){if(strip.length===2){exchangeReady=true;zone.classList.add("ready");zone.innerHTML="<div class='exchange-card'>Sentence Strip が できたよ</div>"}else{exchangeReady=false;zone.classList.remove("ready");zone.innerHTML="<span>Sentence Strip を つくろう</span>"}}else if(selected){zone.classList.add("ready");zone.innerHTML=exchangeCardHtml(selected)}else{zone.classList.remove("ready");zone.innerHTML="<span>ここに カードを おこう</span>"}$("#giveBtn").disabled=!exchangeReady}
$("#exchangeZone").addEventListener("dragover",e=>e.preventDefault());$("#exchangeZone").addEventListener("drop",e=>{e.preventDefault();placeCard(e.dataTransfer.getData("text/plain"))});
function phrase(){if(phase===4&&strip.length===2)return strip[1].speech+"が ほしいです";return selected?selected.speech:""}
function visual(){if(phase===4&&strip.length===2)return "<div class='sentence-strip'>"+strip.map(stripCardHtml).join("")+"</div>";if(selected)return exchangeCardHtml(selected);return ""}
function speak(text){if(!speechOn||!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;speechSynthesis.speak(u)}
function give(){if(!exchangeReady)return;$("#partnerVisual").innerHTML=visual();$("#partnerText").textContent=phrase();$("#partnerModal").classList.remove("hidden");speak(phrase())}
function received(){stats.sent++;save("ptp_stats",stats);$("#partnerModal").classList.add("hidden");$("#recordModal").classList.remove("hidden")}
function record(kind){stats[kind]++;save("ptp_stats",stats);$("#recordModal").classList.add("hidden");showSuccess()}
function showSuccess(){$("#successText").textContent="相手に つたえることが できました";$("#successModal").classList.remove("hidden");fillTeacher()}
function again(){resetExchange();$("#successModal").classList.add("hidden");render()}

function fillTeacher(){
 ensureState();$("#phaseSelect").value=String(phase);$("#cardCount").value=String(count);$("#speechToggle").checked=speechOn;
 $("#singleCardSelect").innerHTML=cards.map(c=>"<option value='"+c.id+"'>"+escapeHtml(c.label)+"</option>").join("");$("#singleCardSelect").value=singleCardId;
 $("#independentCount").textContent=stats.independent;$("#assistCount").textContent=stats.assist;$("#sentCount").textContent=stats.sent;
 $("#categorySuggestions").innerHTML=categories().map(c=>"<option value='"+escapeAttr(c)+"'></option>").join("");
 renderEditorList();
}
function renderEditorList(){
 $("#cardEditorList").innerHTML=cards.length?cards.map(c=>"<div class='editor-row'><div class='editor-thumb'>"+(c.image?"<img src='"+c.image+"' alt=''>":escapeHtml(c.emoji||"🖼️"))+"</div><div class='editor-meta'><b>"+escapeHtml(c.label)+"</b><span>"+escapeHtml(c.category||"その他")+" ／ 読み上げ："+escapeHtml(c.speech||c.label)+"</span></div><button class='edit-card-btn' data-edit='"+c.id+"'>編集</button></div>").join(""):"<p>カードがありません。</p>";
 $$("[data-edit]").forEach(b=>b.onclick=()=>openCardEditor(b.dataset.edit));
}
function openCardEditor(id){
 const c=id?cardById(id):null;$("#editingCardId").value=c?.id||"";$("#cardEditorTitle").textContent=c?"カードを編集":"新しいカード";
 $("#cardLabelInput").value=c?.label||"";$("#cardSpeechInput").value=c?.speech||"";$("#cardEmojiInput").value=c?.emoji||"🖼️";$("#cardCategoryInput").value=c?.category||category||"その他";editorImage=c?.image||null;
 $("#deleteCardBtn").classList.toggle("hidden",!c);renderImagePreview();$("#cardEditorModal").classList.remove("hidden");
}
function renderImagePreview(){$("#imagePreview").innerHTML=editorImage?"<img src='"+editorImage+"' alt='プレビュー'>":"画像なし"}
async function resizeImage(file){
 const data=await fileToDataURL(file),img=await loadImage(data),max=800,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
 const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);
 return cv.toDataURL("image/jpeg",0.82);
}
function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function newId(){return "card_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}
function saveCardEdit(){
 const label=$("#cardLabelInput").value.trim(),speech=$("#cardSpeechInput").value.trim()||label,emoji=$("#cardEmojiInput").value.trim()||"🖼️",cat=$("#cardCategoryInput").value.trim()||"その他";if(!label){alert("表示する文字を入力してください");return}
 const id=$("#editingCardId").value;if(id){const i=cards.findIndex(c=>c.id===id);if(i>=0)cards[i]={...cards[i],label,speech,emoji,category:cat,image:editorImage}}else cards.push({id:newId(),label,speech,emoji,category:cat,image:editorImage});
 try{save("ptp_cards",cards)}catch(e){alert("画像の保存容量が足りません。画像を外すか、別の小さい画像を試してください。");return}
 $("#cardEditorModal").classList.add("hidden");resetExchange();render();
}
function deleteCard(){
 const id=$("#editingCardId").value;if(!id)return;if(!confirm("このカードを削除しますか？"))return;cards=cards.filter(c=>c.id!==id);try{save("ptp_cards",cards)}catch{}
 $("#cardEditorModal").classList.add("hidden");ensureState();resetExchange();render();
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function escapeAttr(v=""){return escapeHtml(v)}

$("#giveBtn").onclick=give;$("#receivedBtn").onclick=received;$("#cancelPartnerBtn").onclick=()=>$("#partnerModal").classList.add("hidden");$$("[data-record]").forEach(b=>b.onclick=()=>record(b.dataset.record));$("#skipRecordBtn").onclick=()=>{$("#recordModal").classList.add("hidden");showSuccess()};$("#againBtn").onclick=again;
$("#teacherBtn").onclick=()=>{$("#teacherModal").classList.remove("hidden");fillTeacher()};$("#closeTeacherBtn").onclick=()=>$("#teacherModal").classList.add("hidden");
$("#phaseSelect").onchange=e=>{phase=Number(e.target.value);save("ptp_phase",phase);resetExchange();render()};$("#cardCount").onchange=e=>{count=Number(e.target.value);save("ptp_count",count);resetExchange();render()};$("#singleCardSelect").onchange=e=>{singleCardId=e.target.value;save("ptp_single",singleCardId);resetExchange();render()};$("#speechToggle").onchange=e=>{speechOn=e.target.checked;save("ptp_speech",speechOn)};$("#resetStatsBtn").onclick=()=>{stats={independent:0,assist:0,sent:0};save("ptp_stats",stats);fillTeacher()};
$("#newCardBtn").onclick=()=>openCardEditor(null);$("#cancelCardEditBtn").onclick=()=>$("#cardEditorModal").classList.add("hidden");$("#saveCardBtn").onclick=saveCardEdit;$("#deleteCardBtn").onclick=deleteCard;$("#removeImageBtn").onclick=()=>{editorImage=null;renderImagePreview()};
$("#imageInput").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{editorImage=await resizeImage(file);renderImagePreview()}catch{alert("画像を読み込めませんでした。")}e.target.value=""};
render();