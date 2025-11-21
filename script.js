// ======== SUPABASE CONFIG ========
const supabaseUrl = "https://odgmhahvodehevdsrqwo.supabase.co";
const supabaseKey = "sb_publishable_eXFAAb6o9q96r7FH57bgJA_Ft3u5_Ib";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {

  // ========= HELPERS =========
  function escapeHtml(str){
    return String(str ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function safeHref(url, fallback){
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
      return fallback;
    } catch {
      return fallback;
    }
  }

  async function fetchJSON(url, { timeoutMs = 8000, ...opts } = {}){
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try{
      const resp = await fetch(url, { signal: ctrl.signal, ...opts });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally { clearTimeout(t); }
  }

  // ========= VÍDEOS =========
  const videos = {
    sobre: document.getElementById('video-sobre'),
    projetos: document.getElementById('video-projetos'),
    contato: document.getElementById('video-contato')
  };
  function atualizarVideo(targetId) {
    Object.values(videos).forEach(v=>{
      if (!v) return;
      v.style.display='none';
      try { v.pause(); } catch {}
    });
    const vAtivo = videos[targetId];
    if(vAtivo){ vAtivo.style.display='block'; vAtivo.play().catch(()=>{}); }
  }

  // ========= ABAS SPA =========
  const abaLinks = document.querySelectorAll('.aba-link');
  const abas = document.querySelectorAll('.aba');
  function mostrarAba(targetId){
    abas.forEach(aba => {
      if (!aba) return;
      aba.style.display = (aba.id===targetId) ? 'block' : 'none';
      if(aba.id===targetId){ aba.style.opacity='1'; aba.style.visibility='visible'; }
    });
    abaLinks.forEach(link => link?.classList.toggle('active', link.dataset.target===targetId));
    atualizarVideo(targetId);
    if(targetId==='sobre') animarHabilidades();
    if(targetId==='projetos') carregarProjetos();
  }
  abaLinks.forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      const tgt = link.dataset.target;
      if(tgt) mostrarAba(tgt);
    });
  });
  mostrarAba('sobre');

  // ========= HABILIDADES =========
  function animarHabilidades(){
    const barras = document.querySelectorAll('#sobre .progress-bar');
    barras.forEach(barra=>{
      if(!barra || barra.dataset.animated==='1') return;
      const valor = Math.max(0, Math.min(100, parseInt(barra.dataset.target)||0));
      barra.dataset.animated='1';
      let width = 0;
      barra.style.width='0%';
      const anim = setInterval(()=>{
        if(width>=valor) clearInterval(anim);
        else barra.style.width=(++width)+'%';
      },12);
    });
  }

  // ========= GITHUB =========
  let projetosCarregados = false;
  async function carregarProjetos(){
    if(projetosCarregados) return;
    projetosCarregados = true;
    const lista = document.getElementById("lista-projetos");
    if(!lista) return;

    lista.innerHTML = '<p style="color:#f39c12;">Carregando projetos...</p>';

    try {
      const data = await fetchJSON(`https://api.github.com/users/raphasaez/repos?sort=updated`, { timeoutMs:9000 });
      if(!Array.isArray(data)) throw new Error('Resposta inesperada');
      lista.innerHTML='';
      data.forEach(repo=>{
        const wrapper=document.createElement('div');
        wrapper.className='col-md-4';
        const inner=document.createElement('div');
        inner.className='card h-100 shadow-sm';
        const title = escapeHtml(repo?.name||'Sem nome');
        const desc = escapeHtml(repo?.description||'Sem descrição');
        const href = safeHref(repo?.html_url||'','https://github.com');

        inner.innerHTML = `<div class="card-body d-flex flex-column">
          <h5 class="card-title">${title}</h5>
          <p class="card-text">${desc}</p>
          <a href="${href}" target="_blank" rel="noopener noreferrer" class="btn btn-success mt-auto">Ver no GitHub</a>
        </div>`;
        wrapper.appendChild(inner);
        lista.appendChild(wrapper);
      });
    } catch(err){
      console.error('GitHub API:', err);
      lista.innerHTML='<p style="color:#f39c12;">Erro ao carregar projetos.</p>';
    }
  }

  // ========= HACKER NEWS =========
  let hnCarregado = false;
  const hnContainer=document.getElementById('hn-container');
  const hnList=document.getElementById('hn-list');
  const hnLoading=document.getElementById('hn-loading');
  const hnToggle=document.getElementById('hn-toggle');

  if(hnToggle && hnContainer){
    hnToggle.addEventListener('click', ()=>{
      const isCollapsed = hnContainer.classList.toggle('collapsed');
      hnContainer.setAttribute('aria-hidden', isCollapsed?'true':'false');
      if(!isCollapsed && !hnCarregado) carregarNoticiasHN();
    });
  }

  async function carregarNoticiasHN(){
    if(hnCarregado || !hnList || !hnLoading) return;
    hnLoading.style.display='block';
    hnList.innerHTML='';
    try {
      const ids = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json',{timeoutMs:9000});
      const primeiras = Array.isArray(ids)?ids.slice(0,8):[];
      const noticias = await Promise.all(primeiras.map(id => 
        fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`,{timeoutMs:9000}).catch(()=>null)
      ));
      hnList.innerHTML='';
      noticias.forEach(n=>{
        if(!n) return;
        const li = document.createElement('li');
        const fallback = `https://news.ycombinator.com/item?id=${encodeURIComponent(n.id)}`;
        const urlSegura = safeHref(n.url||'', fallback);
        const titleSafe = escapeHtml(n.title||'Sem título');
        const score = Number.isFinite(n.score)?n.score:0;
        const comments = Number.isFinite(n.descendants)?n.descendants:0;
        li.innerHTML = `<a href="${urlSegura}" target="_blank" rel="noopener noreferrer">${titleSafe}</a>
          <div class="meta">👍 ${score} | 🗨️ ${comments}</div>`;
        hnList.appendChild(li);
      });
      hnLoading.style.display='none';
      hnCarregado = true;
      if(hnContainer.classList.contains('collapsed')){
        hnContainer.classList.remove('collapsed');
        hnContainer.setAttribute('aria-hidden','false');
      }
    } catch(err){
      console.error('HN:', err);
      hnList.innerHTML='<li style="color:#f39c12;">Erro ao carregar notícias.</li>';
      hnLoading.style.display='none';
    }
  }

  // ========= CURIOSIDADES TI =========
  const curiosidadeContainer = document.getElementById('curiosidade-container');
  const curiosidadeToggle = document.getElementById('curiosidade-toggle');
  const curiosidadeText = document.getElementById('curiosidade-text');
  const proximaCuriosidade = document.getElementById('proxima-curiosidade');

  if(curiosidadeToggle && curiosidadeContainer){
    curiosidadeToggle.addEventListener('click',()=>{
      const isCollapsed = curiosidadeContainer.classList.toggle('collapsed');
      curiosidadeContainer.setAttribute('aria-hidden', isCollapsed?'true':'false');
    });
  }

  async function carregarCuriosidade(){
    if(!curiosidadeText) return;
    try{
      const data = await fetchJSON('https://curiosidades-api.onrender.com/curiosidade',{timeoutMs:7000});
      const texto = typeof data?.curiosidade==='string'?data.curiosidade:'Sem conteúdo.';
      curiosidadeText.style.opacity=0;
      setTimeout(()=>{curiosidadeText.textContent=texto;curiosidadeText.style.opacity=1;},180);
    } catch(err){
      console.error('Curiosidades API:',err);
      curiosidadeText.textContent='Erro ao carregar curiosidade.';
    }
  }
  if(proximaCuriosidade) proximaCuriosidade.addEventListener('click', carregarCuriosidade);
  carregarCuriosidade();

  // ========= COMENTÁRIOS SUPABASE =========
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');

  async function carregarComentarios(){
    if(!commentsList) return;
    try{
      const { data, error } = await supabase.from('comments')
        .select('*')
        .order('created_at',{ascending:false});
      if(error) throw error;
      commentsList.innerHTML='';
      data.forEach(c=>{
        const div=document.createElement('div');
        div.className='comment mb-3';
        div.innerHTML = `<strong>${escapeHtml(c.name)}</strong><br>
          <p>${escapeHtml(c.comment)}</p>
          <small>${new Date(c.created_at).toLocaleString()}</small>
          <hr>`;
        commentsList.appendChild(div);
      });
    } catch(err){
      console.error('Erro ao carregar comentários:', err);
      commentsList.innerHTML='<p style="color:#f39c12;">Erro ao carregar comentários.</p>';
    }
  }

  if(commentForm){
    commentForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const comment = document.getElementById('comment').value.trim();
      if(!name || !comment) return alert('Preencha nome e comentário.');

      try{
        const { error } = await supabase.from('comments').insert([{name, comment}]);
        if(error) throw error;
        commentForm.reset();
        carregarComentarios();
      } catch(err){
        console.error('Erro ao enviar comentário:', err);
        alert('Erro ao enviar comentário.');
      }
    });
  }

  // Carrega comentários ao iniciar
  carregarComentarios();

});
