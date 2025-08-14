document.addEventListener('DOMContentLoaded', () => {
  // --- Seletores ---
  const abaLinks = document.querySelectorAll('.aba-link');
  const abas = document.querySelectorAll('.aba');
  const videos = {
    sobre: document.getElementById('video-sobre'),
    projetos: document.getElementById('video-projetos'),
    contato: document.getElementById('video-contato')
  };

  let projetosCarregados = false;
  let hnCarregado = false;

  // Atualiza vídeo
  function atualizarVideo(targetId) {
    Object.values(videos).forEach(v => {
      if (!v) return;
      v.style.display = 'none';
      try { v.pause(); } catch(e){}
    });
    const vAtivo = videos[targetId];
    if (vAtivo) { vAtivo.style.display='block'; vAtivo.play().catch(()=>{}); }
  }

  // Anima habilidades
  function animarHabilidades() {
    const barras = document.querySelectorAll('#sobre .progress-bar');
    barras.forEach(barra => {
      if (barra.dataset.animated==='1') return;
      const valor = parseInt(barra.dataset.target)||0;
      barra.dataset.animated='1';
      let width = 0;
      barra.style.width='0%';
      const anim = setInterval(()=>{
        if (width>=valor) clearInterval(anim);
        else barra.style.width=(++width)+'%';
      },12);
    });
  }

  // Mostrar aba
  function mostrarAba(targetId) {
    abas.forEach(aba=>{
      aba.style.display=(aba.id===targetId)?'block':'none';
      if(aba.id===targetId){ aba.style.opacity='1'; aba.style.visibility='visible'; }
    });
    abaLinks.forEach(link=>link.classList.toggle('active', link.dataset.target===targetId));
    if(targetId==='sobre'){ animarHabilidades(); if(!hnCarregado) carregarNoticiasHN(); }
    if(targetId==='projetos'){ carregarProjetos(); }
    atualizarVideo(targetId);
  }

  abaLinks.forEach(link=>{
    link.addEventListener('click', e=>{ e.preventDefault(); mostrarAba(link.dataset.target); });
  });

  mostrarAba('sobre');

  // GitHub projetos
  async function carregarProjetos() {
    if(projetosCarregados) return;
    projetosCarregados=true;
    const githubUser="raphasaez";
    const lista=document.getElementById("lista-projetos");
    if(!lista) return;
    lista.innerHTML='<p style="color:#f39c12;">Carregando projetos...</p>';

    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('fade-in'); observer.unobserve(entry.target);}
      });
    },{threshold:0.12});

    try{
      const resp=await fetch(`https://api.github.com/users/${githubUser}/repos?sort=updated`);
      const data=await resp.json();
      lista.innerHTML='';
      data.forEach(repo=>{
        const wrapper=document.createElement('div');
        wrapper.className='col-md-4';
        const inner=document.createElement('div');
        inner.className='card h-100 shadow-sm';
        inner.innerHTML=`<div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHtml(repo.name||'Sem nome')}</h5>
          <p class="card-text">${escapeHtml(repo.description||'Sem descrição')}</p>
          <a href="${repo.html_url}" target="_blank" class="btn btn-success mt-auto">Ver no GitHub</a>
        </div>`;
        wrapper.appendChild(inner);
        lista.appendChild(wrapper);
        observer.observe(inner);
      });
    }catch(err){ lista.innerHTML='<p style="color:#f39c12;">Erro ao carregar projetos.</p>'; console.error(err); }
  }

  // Hacker News widget
  const hnToggle=document.getElementById('hn-toggle');
  const hnContainer=document.getElementById('hn-container');
  const hnList=document.getElementById('hn-list');
  const hnLoading=document.getElementById('hn-loading');

  if(hnToggle && hnContainer){
    hnToggle.addEventListener('click', ()=>{
      const isCollapsed=hnContainer.classList.toggle('collapsed');
      hnContainer.setAttribute('aria-hidden', isCollapsed?'true':'false');
      if(!isCollapsed && !hnCarregado) carregarNoticiasHN();
    });
  }

  async function carregarNoticiasHN(){
    if(hnCarregado || !hnList || !hnLoading) return;
    hnLoading.style.display='block';
    hnList.innerHTML='';
    try{
      const ids=await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r=>r.json());
      const primeiras=Array.isArray(ids)?ids.slice(0,8):[];
      const noticias=await Promise.all(primeiras.map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json()).catch(()=>null)));
      hnList.innerHTML='';
      noticias.forEach(n=>{
        if(!n) return;
        const li=document.createElement('li');
        const url=n.url?n.url:`https://news.ycombinator.com/item?id=${n.id}`;
        li.innerHTML=`<a href="${url}" target="_blank">${escapeHtml(n.title||'Sem título')}</a><div class="meta">👍 ${n.score||0} | 🗨️ ${n.descendants||0}</div>`;
        hnList.appendChild(li);
      });
      hnLoading.style.display='none';
      hnCarregado=true;
      if(hnContainer.classList.contains('collapsed')){
        hnContainer.classList.remove('collapsed'); hnContainer.setAttribute('aria-hidden','false');
      }
    }catch(err){ console.error(err); hnList.innerHTML='<li style="color:#f39c12;">Erro ao carregar notícias.</li>'; hnLoading.style.display='none'; }
  }

  // Escape HTML
  function escapeHtml(str){ return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

// Widget Curiosidades TI
const curiosidadeContainer = document.getElementById('curiosidade-container');
const curiosidadeToggle = document.getElementById('curiosidade-toggle');
const curiosidadeText = document.getElementById('curiosidade-text');
const proximaCuriosidade = document.getElementById('proxima-curiosidade');

curiosidadeToggle.addEventListener('click', () => {
  curiosidadeContainer.classList.toggle('collapsed');
});

// Função para carregar curiosidade via API
async function carregarCuriosidade() {
  try {
    const resp = await fetch('https://curiosidades-api.onrender.com/curiosidade');
    const data = await resp.json();
    curiosidadeText.style.opacity = 0;
    setTimeout(() => {
      curiosidadeText.innerText = data.curiosidade;
      curiosidadeText.style.opacity = 1;
    }, 200);
  } catch (err) {
    curiosidadeText.innerText = "Erro ao carregar curiosidade.";
    console.error(err);
  }
}

// Clique no botão "Próxima"
proximaCuriosidade.addEventListener('click', carregarCuriosidade);

// Carrega primeira curiosidade ao abrir a página
carregarCuriosidade();

}); // DOMContentLoaded
