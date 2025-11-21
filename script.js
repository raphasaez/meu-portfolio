// script.js (SPA + Comentários Supabase)
document.addEventListener('DOMContentLoaded', () => {

  // =================== SPA ===================
  const abaLinks = document.querySelectorAll('.aba-link');
  const abas = document.querySelectorAll('.aba');
  const videos = {
    sobre: document.getElementById('video-sobre'),
    projetos: document.getElementById('video-projetos'),
    contato: document.getElementById('video-contato')
  };

  let projetosCarregados = false;
  let hnCarregado = false;

  // Helpers
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
      if(u.protocol==='http:'||u.protocol==='https:') return u.toString();
      return fallback;
    } catch { return fallback; }
  }

  async function fetchJSON(url, { timeoutMs=8000, ...opts }={}) {
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { signal: ctrl.signal, ...opts });
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally { clearTimeout(t); }
  }

  // Vídeo de fundo
  function atualizarVideo(targetId){
    Object.values(videos).forEach(v=>{
      if(!v) return;
      v.style.display='none';
      try{ v.pause(); } catch(e){}
    });
    const vAtivo = videos[targetId];
    if(vAtivo){ vAtivo.style.display='block'; vAtivo.play().catch(()=>{}); }
  }

  // Barras de habilidade
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

  // Troca de abas
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

  // Carregar projetos GitHub
  async function carregarProjetos(){
    if(projetosCarregados) return;
    projetosCarregados=true;

    const githubUser="raphasaez";
    const lista=document.getElementById("lista-projetos");
    if(!lista) return;

    lista.innerHTML='<p style="color:#f39c12;">Carregando projetos...</p>';

    try {
      const data = await fetchJSON(`https://api.github.com/users/${githubUser}/repos?sort=updated`, { timeoutMs: 9000 });
      if(!Array.isArray(data)) throw new Error('Resposta inesperada');

      lista.innerHTML='';
      data.forEach(repo=>{
        const wrapper=document.createElement('div');
        wrapper.className='col-md-4';
        const inner=document.createElement('div');
        inner.className='card h-100 shadow-sm';
        const title = escapeHtml(repo?.name || 'Sem nome');
        const desc  = escapeHtml(repo?.description || 'Sem descrição');
        const href  = safeHref(repo?.html_url || '', 'https://github.com');

        inner.innerHTML = `
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${title}</h5>
            <p class="card-text">${desc}</p>
            <a href="${href}" target="_blank" rel="noopener noreferrer" class="btn btn-success mt-auto">Ver no GitHub</a>
          </div>
        `;

        wrapper.appendChild(inner);
        lista.appendChild(wrapper);
      });
    } catch(err){
      console.error('GitHub API:', err);
      lista.innerHTML='<p style="color:#f39c12;">Erro ao carregar projetos.</p>';
    }
  }

  // ================ Supabase Comments =================
  const supabaseUrl = "https://odgmhahvodehevdsrqwo.supabase.co";
  const supabaseKey = "sb_publishable_eXFAAb6o9q96r7FH57bgJA_Ft3u5_Ib";
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);

  const form = document.getElementById("commentForm");
  const commentsDiv = document.getElementById("commentsList");

  async function enviarComentario(name, comment){
    const { error } = await supabase.from("comments").insert([{ name, comment }]);
    if(error){
      console.error(error);
      alert("Erro ao enviar comentário.");
    } else {
      alert("Comentário enviado!");
      carregarComentarios();
    }
  }

  async function carregarComentarios(){
    const { data, error } = await supabase.from("comments").select("*").order("created_at",{ascending:false});
    if(error) return console.error(error);
    commentsDiv.innerHTML='';
    data.forEach(c=>{
      commentsDiv.innerHTML += `
        <div class="comment">
          <strong>${escapeHtml(c.name)}</strong><br>
          <p>${escapeHtml(c.comment)}</p>
          <small>${new Date(c.created_at).toLocaleString()}</small>
          <hr>
        </div>
      `;
    });
  }

  if(form){
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const name = document.getElementById("name").value;
      const comment = document.getElementById("comment").value;
      enviarComentario(name, comment);
      form.reset();
    });
  }

  carregarComentarios();

});
