
const $ = s => document.querySelector(s);
const app = $("#app");
const Q = window.QUESTIONS || [];
const categories = [...new Set(Q.map(q=>q.category))];

const defaultState = {
  answered:{}, wrong:{}, mastered:{},
  flashKnown:{}, flashReview:{},
  streak:0, lastDay:null,
  theme:localStorage.getItem("juryTheme") || "light"
};
let state = Object.assign(defaultState, JSON.parse(localStorage.getItem("juryState")||"{}"));
let session = {mode:null,list:[],i:0,score:0,answered:false,selected:null,currentOptions:[]};
let quizDifficulty = localStorage.getItem("juryDifficulty") || "hard";

function setDifficulty(level){
  quizDifficulty = level;
  localStorage.setItem("juryDifficulty", level);
  document.querySelectorAll(".difficulty-btn").forEach(b=>b.classList.toggle("active", b.dataset.level===level));
}

function save(){localStorage.setItem("juryState",JSON.stringify(state))}
function setTheme(t){
  state.theme=t; document.documentElement.dataset.theme=t==="dark"?"dark":"";
  localStorage.setItem("juryTheme",t); save();
}
setTheme(state.theme);

function pct(n,d){return d?Math.round(n/d*100):0}
function today(){return new Date().toISOString().slice(0,10)}
function updateStreak(){
  const d=today();
  if(state.lastDay===d) return;
  if(state.lastDay){
    const prev=new Date(state.lastDay), cur=new Date(d);
    const diff=Math.round((cur-prev)/86400000);
    state.streak = diff===1 ? (state.streak||0)+1 : 1;
  } else state.streak=1;
  state.lastDay=d; save();
}
function stats(){
  const done=Object.keys(state.answered||{}).length;
  const mastered=Object.keys(state.mastered||{}).length;
  const wrong=Object.keys(state.wrong||{}).length;
  return {done,mastered,wrong,progress:pct(mastered,Q.length)}
}
function nav(view){
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="home") renderHome();
  if(view==="learn") renderLearn();
  if(view==="cards") renderCardsHome();
  if(view==="review") startReview();
  if(view==="exam") renderExamStart();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>nav(b.dataset.view));
$("#themeBtn").onclick=()=>setTheme(state.theme==="dark"?"light":"dark");

function renderHome(){
  const s=stats();
  app.innerHTML=`
    <section class="hero">
      <div class="hero-grid">
        <div>
          <div class="eyebrow">OBJECTIF · JURY CENTRAL</div>
          <h2>Maîtriser les notions, pas les réciter.</h2>
          <p class="muted">${Q.length} questions couvrant les matières premières, la technique, l’hygiène, les coûts, le matériel et la législation. <span class="version-badge">V6</span></p>
          <div class="actions">
            <button class="btn primary" id="quick">Continuer la révision</button>
            <button class="btn ghost" id="weak">Mes erreurs (${s.wrong})</button>
          </div>
        </div>
        <div class="progress-ring" style="--p:${s.progress}"><span>${s.progress}%</span></div>
      </div>
    </section>
    <div class="stats-row">
      <div class="stat-card"><strong>${s.done}</strong><span class="muted">vues</span></div>
      <div class="stat-card"><strong>${s.mastered}</strong><span class="muted">maîtrisées</span></div>
      <div class="stat-card"><strong>${state.streak||0}</strong><span class="muted">jours</span></div>
    </div>
    <div class="notice">Le contenu est un support de préparation basé sur le livret de septembre 2026. Pour la réglementation, vérifie toujours les sources officielles avant l’examen.</div>
    <div class="section-head"><div><div class="eyebrow">PAR THÈME</div><h2>Faire le tour du programme</h2></div></div>
    <div class="category-grid">
      ${categories.map(c=>{
        const qs=Q.filter(q=>q.category===c);
        const m=qs.filter(q=>state.mastered[q.id]).length;
        return `<div class="category-card" data-cat="${encodeURIComponent(c)}">
          <div class="row"><h3>${c}</h3><span class="pill">${m}/${qs.length}</span></div>
          <div class="mini-bar"><span style="width:${pct(m,qs.length)}%"></span></div>
        </div>`
      }).join("")}
    </div>
    <div class="section-head"><div><div class="eyebrow">DONNÉES</div><h2>Progression</h2></div></div>
    <button class="btn ghost" id="reset">Réinitialiser toute la progression</button>
  `;
  $("#quick").onclick=()=>startQuiz(shuffle(Q).slice(0,20),"Révision mixte");
  $("#weak").onclick=()=>startReview();
  document.querySelectorAll(".category-card").forEach(el=>el.onclick=()=>{
    const c=decodeURIComponent(el.dataset.cat); startQuiz(shuffle(Q.filter(q=>q.category===c)),c)
  });
  $("#reset").onclick=()=>{
    if(confirm("Effacer toute la progression ?")){
      state={...defaultState,theme:state.theme}; save(); renderHome();
    }
  }
}
function renderLearn(){
  app.innerHTML=`
    <div class="section-head"><div><div class="eyebrow">APPRENDRE</div><h2>Choisis un parcours</h2></div></div>

    <div class="difficulty-box">
      <div>
        <strong>Difficulté du QCM</strong>
        <div class="muted difficulty-help">${quizDifficulty==="hard" ? "Pièges proches, valeurs voisines, réponses mélangées." : "Questions originales, réponses mélangées."}</div>
      </div>
      <div class="difficulty-switch">
        <button class="difficulty-btn ${quizDifficulty==="classic"?"active":""}" data-level="classic">Classique</button>
        <button class="difficulty-btn ${quizDifficulty==="hard"?"active":""}" data-level="hard">Difficile</button>
      </div>
    </div>

    <div class="actions">
      <button class="btn primary" id="mix10">10 questions</button>
      <button class="btn secondary" id="mix25">25 questions</button>
    </div>
    <div class="category-grid">
      ${categories.map(c=>{
        const n=Q.filter(q=>q.category===c).length;
        return `<div class="category-card" data-cat="${encodeURIComponent(c)}">
          <div class="row"><h3>${c}</h3><span class="pill">${n} q.</span></div>
          <p class="muted">Réviser ce thème uniquement.</p>
        </div>`
      }).join("")}
    </div>`;
  document.querySelectorAll(".difficulty-btn").forEach(b=>b.onclick=()=>{
    setDifficulty(b.dataset.level);
    renderLearn();
  });
  $("#mix10").onclick=()=>startQuiz(shuffle(Q).slice(0,10),"Révision mixte");
  $("#mix25").onclick=()=>startQuiz(shuffle(Q).slice(0,25),"Révision mixte");
  document.querySelectorAll(".category-card").forEach(el=>el.onclick=()=>{
    const c=decodeURIComponent(el.dataset.cat); startQuiz(shuffle(Q.filter(q=>q.category===c)),c)
  });
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function startQuiz(list,label,mode="learn"){
  updateStreak();
  session={mode,label,list,i:0,score:0,answered:false,selected:null,currentOptions:[],difficulty:quizDifficulty};
  renderQuestion();
}
function getQuestionOptions(q){
  const correctText=q.options[q.answer];
  const source=(session.difficulty==="hard" && q.hardOptions && q.hardOptions.length===4)
    ? q.hardOptions
    : q.options;

  // The correct answer is identified by text, then all four choices are shuffled
  // every time the question appears. A/B/C/D therefore carry no clue.
  return shuffle(source.map(text=>({text, correct:text===correctText})));
}

function renderQuestion(){
  if(session.i>=session.list.length){return renderResult()}
  const q=session.list[session.i];
  const letter=["A","B","C","D"];
  session.currentOptions=getQuestionOptions(q);

  app.innerHTML=`
    <div class="quiz-card">
      <div class="quiz-meta">
        <span>${session.label}</span>
        <span>${session.i+1} / ${session.list.length}</span>
      </div>
      <div class="quiz-difficulty-tag">${session.difficulty==="hard"?"Difficile":"Classique"} · réponses mélangées</div>
      <div class="mini-bar"><span style="width:${pct(session.i,session.list.length)}%"></span></div>
      <div class="question">${q.question}</div>
      <div class="options">
        ${session.currentOptions.map((o,i)=>`<button class="option" data-i="${i}"><span class="letter">${letter[i]}</span><span>${o.text}</span></button>`).join("")}
      </div>
      <div id="feedback"></div>
    </div>`;
  document.querySelectorAll(".option").forEach(b=>b.onclick=()=>answer(q,+b.dataset.i));
}

function answer(q,sel){
  if(session.answered)return;
  session.answered=true; session.selected=sel;
  const ok=session.currentOptions[sel].correct;
  const correctIndex=session.currentOptions.findIndex(o=>o.correct);

  state.answered[q.id]=(state.answered[q.id]||0)+1;
  if(ok){session.score++; state.mastered[q.id]=true; delete state.wrong[q.id]}
  else {state.wrong[q.id]=(state.wrong[q.id]||0)+1; delete state.mastered[q.id]}
  save();

  document.querySelectorAll(".option").forEach((b,i)=>{
    b.disabled=true;
    if(i===correctIndex)b.classList.add("correct");
    else if(i===sel)b.classList.add("wrong");
  });

  $("#feedback").innerHTML=`
    <div class="explanation"><strong>${ok?"✓ Bonne réponse":"✕ À revoir"}</strong><br>${q.explanation}</div>
    <div class="quiz-actions">
      <button class="btn ghost" id="again">À revoir</button>
      <button class="btn primary" id="next">${session.i+1===session.list.length?"Résultat":"Question suivante"}</button>
    </div>`;
  $("#again").onclick=()=>{
    state.wrong[q.id]=(state.wrong[q.id]||0)+1; delete state.mastered[q.id]; save();
    session.list.push(q); session.i++; session.answered=false; renderQuestion();
  };
  $("#next").onclick=()=>{session.i++;session.answered=false;renderQuestion()}
}
function renderResult(){
  const p=pct(session.score,session.list.length);
  app.innerHTML=`
    <div class="quiz-card exam-result">
      <div class="eyebrow">SESSION TERMINÉE</div>
      <div class="score">${p}%</div>
      <h2>${session.score} / ${session.list.length}</h2>
      <p class="muted">${p>=85?"Très solide. Continue surtout les erreurs restantes.":p>=70?"Bon niveau. Revois les questions ratées pour stabiliser.":"Encore du travail : privilégie les thèmes faibles et les cas pratiques."}</p>
      <div class="actions">
        <button class="btn primary" id="home">Retour accueil</button>
        <button class="btn ghost" id="retry">Revoir mes erreurs</button>
      </div>
    </div>`;
  $("#home").onclick=()=>nav("home");
  $("#retry").onclick=()=>startReview();
}
function startReview(){
  const ids=Object.keys(state.wrong||{}).map(Number);
  const list=shuffle(Q.filter(q=>ids.includes(q.id)));
  if(!list.length){
    app.innerHTML=`<div class="empty"><h2>Rien à revoir 🎉</h2><p>Les questions que tu rates apparaîtront ici automatiquement.</p><button class="btn primary" id="learnNow">Faire une révision</button></div>`;
    $("#learnNow").onclick=()=>nav("learn"); return;
  }
  startQuiz(list,"Questions à revoir","review");
}

let cardSession = {list:[], i:0, label:"", flipped:false, known:0, review:0};

function flashStatsFor(list){
  const known = list.filter(q=>state.flashKnown && state.flashKnown[q.id]).length;
  const review = list.filter(q=>state.flashReview && state.flashReview[q.id]).length;
  return {known, review, total:list.length, pct:pct(known,list.length)};
}

function renderCardsHome(){
  const all = flashStatsFor(Q);
  app.innerHTML=`
    <section class="hero">
      <div class="eyebrow">MODE FICHES · SANS QCM</div>
      <h2>Question devant. Réponse derrière.</h2>
      <p class="muted">Touche la fiche pour révéler la bonne réponse et l’explication. Aucun choix de réponse n’est affiché.</p>

      <div class="flash-summary">
        <div><strong>${all.known}</strong><span>connues</span></div>
        <div><strong>${all.review}</strong><span>à revoir</span></div>
        <div><strong>${all.pct}%</strong><span>maîtrisées</span></div>
      </div>

      <div class="actions">
        <button class="btn primary" id="cards20">20 fiches aléatoires</button>
        <button class="btn ghost" id="cardsReview">Revoir mes fiches faibles</button>
      </div>
    </section>

    <div class="section-head">
      <div><div class="eyebrow">CHOISIR UN THÈME</div><h2>Étudier sans réponses visibles</h2></div>
    </div>

    <div class="category-grid">
      ${categories.map(c=>{
        const qs=Q.filter(q=>q.category===c);
        const s=flashStatsFor(qs);
        return `<div class="category-card flash-cat" data-cat="${encodeURIComponent(c)}">
          <div class="row"><h3>${c}</h3><span class="pill">${s.known}/${s.total}</span></div>
          <div class="mini-bar"><span style="width:${s.pct}%"></span></div>
          <p class="muted small-note">${s.review ? `${s.review} à revoir` : "Touchez pour commencer"}</p>
        </div>`
      }).join("")}
    </div>`;

  $("#cards20").onclick=()=>startCards(shuffle(Q).slice(0,20),"Fiches aléatoires");
  $("#cardsReview").onclick=()=>{
    const weak=Q.filter(q=>state.flashReview && state.flashReview[q.id]);
    if(!weak.length){
      app.innerHTML=`<div class="empty"><h2>Aucune fiche faible 🎉</h2><p>Commence une série de fiches et marque celles à revoir.</p><button class="btn primary" id="backCards">Commencer</button></div>`;
      $("#backCards").onclick=()=>startCards(shuffle(Q).slice(0,20),"Fiches aléatoires");
    } else startCards(shuffle(weak),"Fiches à revoir");
  };

  document.querySelectorAll(".flash-cat").forEach(el=>el.onclick=()=>{
    const c=decodeURIComponent(el.dataset.cat);
    startCards(shuffle(Q.filter(q=>q.category===c)),c);
  });
}

function startCards(list,label){
  updateStreak();
  cardSession={list:[...list],i:0,label,flipped:false,known:0,review:0};
  renderFlashcard();
}

function renderFlashcard(){
  if(cardSession.i>=cardSession.list.length) return renderCardsResult();

  const q=cardSession.list[cardSession.i];
  const answer=q.options[q.answer];

  app.innerHTML=`
    <div class="flash-top">
      <button class="back-link" id="exitCards">‹ Fiches</button>
      <span class="pill">${cardSession.i+1} / ${cardSession.list.length}</span>
    </div>

    <div class="mini-bar flash-progress">
      <span style="width:${pct(cardSession.i,cardSession.list.length)}%"></span>
    </div>

    <div class="flash-label">${cardSession.label}</div>

    <button class="flashcard" id="flashcard" aria-label="Toucher pour afficher la réponse">
      <div class="flashcard-inner">
        <section class="flash-face flash-front">
          <div class="flash-kicker">QUESTION</div>
          <div class="flash-question">${q.question}</div>
          <div class="tap-hint">Touchez la fiche pour voir la réponse</div>
        </section>
        <section class="flash-face flash-back">
          <div class="flash-kicker">RÉPONSE</div>
          <div class="flash-answer">${answer}</div>
          <div class="flash-explanation">${q.explanation}</div>
          <div class="tap-hint">Touchez pour revoir la question</div>
        </section>
      </div>
    </button>

    <div class="flash-actions hidden" id="flashActions">
      <button class="flash-grade review-grade" id="markReview">
        <span>↺</span><strong>À revoir</strong>
      </button>
      <button class="flash-grade know-grade" id="markKnown">
        <span>✓</span><strong>Je sais</strong>
      </button>
    </div>

    <button class="reveal-btn" id="revealBtn">Afficher la réponse</button>
  `;

  const card=$("#flashcard");
  const inner=card.querySelector(".flashcard-inner");
  const actions=$("#flashActions");
  const reveal=$("#revealBtn");

  const setFlip=(yes)=>{
    cardSession.flipped=yes;
    inner.classList.toggle("is-flipped",yes);
    actions.classList.toggle("hidden",!yes);
    reveal.classList.toggle("hidden",yes);
  };

  card.onclick=()=>setFlip(!cardSession.flipped);
  reveal.onclick=()=>setFlip(true);
  $("#exitCards").onclick=()=>renderCardsHome();

  $("#markReview").onclick=()=>{
    state.flashReview[q.id]=true;
    delete state.flashKnown[q.id];
    state.wrong[q.id]=(state.wrong[q.id]||0)+1;
    cardSession.review++;
    save();
    nextFlash();
  };

  $("#markKnown").onclick=()=>{
    state.flashKnown[q.id]=true;
    delete state.flashReview[q.id];
    cardSession.known++;
    save();
    nextFlash();
  };
}

function nextFlash(){
  cardSession.i++;
  cardSession.flipped=false;
  renderFlashcard();
}

function renderCardsResult(){
  app.innerHTML=`
    <div class="quiz-card exam-result">
      <div class="eyebrow">SÉRIE DE FICHES TERMINÉE</div>
      <div class="score">${cardSession.known}</div>
      <h2>${cardSession.known} connues · ${cardSession.review} à revoir</h2>
      <p class="muted">Les fiches marquées « À revoir » restent disponibles dans le mode Fiches et alimentent aussi ta liste globale de révision.</p>
      <div class="actions">
        <button class="btn primary" id="cardsHome">Retour aux fiches</button>
        <button class="btn ghost" id="againWeak">Revoir les difficiles</button>
      </div>
    </div>`;
  $("#cardsHome").onclick=()=>renderCardsHome();
  $("#againWeak").onclick=()=>{
    const weak=Q.filter(q=>state.flashReview && state.flashReview[q.id]);
    weak.length ? startCards(shuffle(weak),"Fiches à revoir") : renderCardsHome();
  };
}

function renderExamStart(){
  app.innerHTML=`
    <section class="hero">
      <div class="eyebrow">EXAMEN BLANC</div>
      <h2>30 questions · tous les thèmes</h2>
      <p class="muted">En mode difficile, les mauvaises réponses sont volontairement proches de la bonne et A/B/C/D sont mélangés à chaque passage.</p>
      <div class="difficulty-switch exam-switch">
        <button class="difficulty-btn ${quizDifficulty==="classic"?"active":""}" data-level="classic">Classique</button>
        <button class="difficulty-btn ${quizDifficulty==="hard"?"active":""}" data-level="hard">Difficile</button>
      </div>
      <button class="btn primary" id="startExam">Démarrer l’examen</button>
    </section>
    <div class="notice">Objectif conseillé en mode difficile : atteindre régulièrement 85 % ou plus, puis travailler à voix haute les cas pratiques et questions d’oral.</div>`;
  document.querySelectorAll(".difficulty-btn").forEach(b=>b.onclick=()=>{
    setDifficulty(b.dataset.level);
    renderExamStart();
  });
  $("#startExam").onclick=()=>startQuiz(shuffle(Q).slice(0,30),"Examen blanc","exam");
}
renderHome();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}
