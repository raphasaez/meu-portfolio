// ======= SUPABASE CONFIG =======
const supabaseUrl = "https://odgmhahvodehevdsrqwo.supabase.co";
const supabaseKey = "sb_publishable_eXFAAb6o9q96r7FH57bgJA_Ft3u5_Ib";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  const abaLinks = document.querySelectorAll('.aba-link');
  const abas = document.querySelectorAll('.aba');
  const videos = {
    sobre: document.getElementById('video-sobre'),
    projetos: document.getElementById('video-projetos'),
    contato: document.getElementById('video-contato')
  };

  let projetosCarregados = false;
  let hnCarregado = false;
  let comentariosIniciados = false;

  // ===== Helpers =====
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
      return (u.protocol==='http:'||u.protocol==='https:') ? u.toString() : fallback;
    } catch { return fallback; }
  }

  async function fetchJSON(url, {timeoutMs=8000, ...opts}={}){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try{
      const resp = await fetch(url,{signal:ctrl.signal,...opts});
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally { clearTimeout(t); }
  }

  // ===== Vídeo de fundo =====
  function atualizarVideo(targetId){
    Object.values(videos).forEach(v=>{
      if(!v) return;
      v.style.display='none';
      try{ v.pause(); } catch(e){}
    });
    const vAtivo = videos[targetId];
    if(vAtivo){ vAtivo.style.display='block'; vAtivo.play().catch(()=>{}); }
  }

  // ===== Barras de habilidade =====
  function animarHabilidades(){
    document.querySelectorAll('#sobre .progress-bar').forEach(barra=>{
      if(!barra || barra.dataset.animated==='1') return;
      const valor = Math.max(0,Math.min(100,parseInt(barra.dataset.target)||0));
      barra.dataset.animated='1';
      let width=0;
      barra.style.width='0%';
      const anim=setInterval(()=>{
        if(width>=valor) clearInterval(anim);
        else barra.style.width=(++width)+'%';
      },12);
    });
  }

  // ===== SPA =====
  function mostrarAba(targetId){
    abas.forEach(aba=>{
      if(!aba) return;
      aba.style.display=(aba.id===targetId)?'block':'none';
      if(aba.id===targetId){ aba.style.opacity='1'; aba.style.visibility='visible'; }
    });
    abaLinks.forEach(link=>{
      if(!link) return;
      link.classList.toggle('active', link.dataset.target===targetId);
    });

    if(targetId==='sobre'){ animarHabilidades(); if(!hnCarregado) carregarNoticiasHN(); }
    if(targetId==='projetos'){ carregarProjetos(); }
    if(targetId==='contato'){ iniciarComentarios(); }
    atualizarVideo(targetId);
  }

  abaLinks.forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      const tgt = link.dataset.target;
      if(tgt) mostrarAba(tgt);
    });
  });

  mostrarAba('sobre');

  // ===== GitHub =====
  async function carregarProjetos(){
    if(projetosCarregados) return;
    projetosCarregados=true;
    const lista=document.getElementById("lista-projetos");
    if(!lista) return;
    lista.innerHTML='<p style="color:#f39c12;">Carregando projetos...</p>';

    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:0.12});

    try{
      const data = await fetchJSON(`https://api.github.com/users/raphasaez/repos?sort=updated`,{timeoutMs:9000});
      if(!Array.isArray(data)) throw new Error('Resposta inesperada');
      lista.innerHTML='';
      data.forEach(repo=>{
        const wrapper=document.createElement('div');
        wrapper.className='col-md-4';
        const inner=document.createElement('div');
        inner.className='card h-100 shadow-sm';
        inner.innerHTML = `
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${escapeHtml(repo?.name||'Sem nome')}</h5>
            <p class="card-text">${escapeHtml(repo?.description||'Sem descrição')}</p>
            <a href="${safeHref(repo?.html_url||'','https://github.com')}" target="_blank" rel="noopener noreferrer" class="btn btn-success mt-auto">Ver no GitHub</a>
          </div>`;
        wrapper.appendChild(inner);
        lista.appendChild(wrapper);
        observer.observe(inner);
      });
    }catch(err){
      console.error('GitHub API:',err);
      lista.innerHTML='<p style="color:#f39c12;">Erro ao carregar projetos.</p>';
    }
  }

  // ===== Comentários Contato =====
  function iniciarComentarios(){
    if(comentariosIniciados) return;
    comentariosIniciados = true;

    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');

    async function carregarComentarios(){
      if(!commentsList) return;
      try{
        const {data,error} = await supabase.from('comments').select('*').order('created_at',{ascending:false});
        if(error) throw error;
        commentsList.innerHTML='';
        data.forEach(c=>{
          const div=document.createElement('div');
          div.className='comment mb-3';
          div.innerHTML=`
            <strong>${escapeHtml(c.name)}</strong><br>
            <p>${escapeHtml(c.comment)}</p>
            <small>${new Date(c.created_at).toLocaleString()}</small>
            <hr>`;
          commentsList.appendChild(div);
        });
      }catch(err){
        console.error('Erro ao carregar comentários:',err);
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
          const {error} = await supabase.from('comments').insert([{name,comment}]);
          if(error) throw error;
          commentForm.reset();
          carregarComentarios();
        }catch(err){
          console.error('Erro ao enviar comentário:',err);
          alert('Erro ao enviar comentário.');
        }
      });
    }

    carregarComentarios();
  }

  // ===== Hacker News / Curiosidades =====
  async function carregarNoticiasHN(){
    hnCarregado = true;
    const hnList = document.getElementById('hn-list');
    const hnLoading = document.getElementById('hn-loading');
    if(!hnList) return;

    try{
      const topStories = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty');
      const top10 = topStories.slice(0,10);
      hnList.innerHTML='';
      for(const id of top10){
        try{
          const story = await fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const li = document.createElement('li');
          li.innerHTML = `<a href="${story.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(story.title)}</a>`;
          hnList.appendChild(li);
        }catch(e){console.error(e);}
      }
    }catch(e){console.error(e);}
    if(hnLoading) hnLoading.style.display='none';
  }

  document.getElementById('hn-toggle')?.addEventListener('click',()=>{
    const container=document.getElementById('hn-container');
    container.classList.toggle('collapsed');
  });

  document.getElementById('curiosidade-toggle')?.addEventListener('click',()=>{
    const container=document.getElementById('curiosidade-container');
    container.classList.toggle('collapsed');
  });

  async function carregarCuriosidade(){
    const txt=document.getElementById('curiosidade-text');
    try{
      const data = await fetchJSON('https://curiosidades-api.onrender.com/ti');
      if(txt) txt.textContent = data?.curiosidade || 'Não foi possível carregar curiosidade';
    }catch(e){ if(txt) txt.textContent='Erro ao carregar curiosidade'; }
  }

  document.getElementById('proxima-curiosidade')?.addEventListener('click', carregarCuriosidade);

  carregarCuriosidade();
});
