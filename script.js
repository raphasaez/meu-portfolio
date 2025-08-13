// script.js (substitua totalmente o seu atual)

document.addEventListener('DOMContentLoaded', () => {
  // elementos básicos
  const abaLinks = document.querySelectorAll('.aba-link');
  const abas = document.querySelectorAll('.aba');

  const videos = {
    sobre: document.getElementById('video-sobre'),
    projetos: document.getElementById('video-projetos'),
    contato: document.getElementById('video-contato')
  };

  // garante que abas existem
  if (!abas || abas.length === 0) {
    console.error('Nenhuma aba encontrada no DOM.');
    return;
  }

  // mostra/oculta abas com defesa
  function mostrarAba(targetId) {
    try {
      abas.forEach(aba => {
        if (!aba || !aba.id) return;
        aba.style.display = (aba.id === targetId) ? 'block' : 'none';
        // garante visibilidade caso alguma regra CSS tenha setado opacity
        if (aba.id === targetId) {
          aba.style.opacity = '1';
          aba.style.visibility = 'visible';
        }
      });
      abaLinks.forEach(link => link.classList.toggle('active', link.dataset.target === targetId));
      if (targetId === 'sobre') animarHabilidades();
      atualizarVideo(targetId);
      if (targetId === 'projetos') carregarProjetos(); // só aqui
    } catch (err) {
      console.error('Erro em mostrarAba():', err);
    }
  }

  // vídeo de fundo
  function atualizarVideo(targetId) {
    try {
      Object.values(videos).forEach(v => {
        if (!v) return;
        v.style.display = 'none';
        try { v.pause(); } catch(e){}
      });
      const videoAtivo = videos[targetId];
      if (videoAtivo) {
        videoAtivo.style.display = 'block';
        videoAtivo.play().catch(()=>{}); // autoplay pode falhar
      }
    } catch (err) {
      console.error('Erro em atualizarVideo():', err);
    }
  }

  // animação das habilidades (defensiva)
  function animarHabilidades() {
    try {
      const barras = document.querySelectorAll('#sobre .progress-bar');
      barras.forEach(barra => {
        const valor = parseInt(barra.dataset.target) || 0;
        let width = 0;
        barra.style.width = '0%';
        const anim = setInterval(() => {
          if (width >= valor) clearInterval(anim);
          else barra.style.width = ++width + '%';
        }, 12);
      });
    } catch (err) {
      console.error('Erro em animarHabilidades():', err);
    }
  }

  // clique nas abas
  abaLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      if (!target) return;
      mostrarAba(target);
    });
  });

  // inicial: mostra sobre
  mostrarAba('sobre');

  /* ==================================================
     CARREGAR PROJETOS: executa somente ao abrir Projetos
     ================================================== */
  let projetosCarregados = false;

  async function carregarProjetos() {
    // evita recarregar várias vezes
    if (projetosCarregados) return;
    projetosCarregados = true;

    const githubUser = 'raphasaez';
    const lista = document.getElementById('lista-projetos');
    if (!lista) {
      console.warn('Elemento #lista-projetos não encontrado; abortando carregarProjetos.');
      return;
    }

    // limpa e coloca mensagem de carregando
    lista.innerHTML = '<p style="color:#f39c12;">Carregando projetos...</p>';

    // observer local exclusivo para esses cards
    const projectObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          projectObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    try {
      const resp = await fetch(`https://api.github.com/users/${githubUser}/repos?sort=updated`);
      if (!resp.ok) {
        // status 403/404/... -> mostra mensagem e sai
        lista.innerHTML = `<p style="color:#f39c12;">GitHub API erro: ${resp.status} ${resp.statusText}</p>`;
        console.error('GitHub API falhou:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      if (!Array.isArray(data)) {
        lista.innerHTML = `<p style="color:#f39c12;">Resposta inesperada da API</p>`;
        console.error('Resposta não é array:', data);
        return;
      }

      // monta cards
      lista.innerHTML = ''; // limpa mensagem de carregando
      data.forEach(repo => {
        try {
          const wrapper = document.createElement('div');
          wrapper.className = 'col-md-4';
          // cria a div .card explicitamente e observe ela (innerCard)
          const inner = document.createElement('div');
          inner.className = 'card h-100 shadow-sm';
          inner.innerHTML = `
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${escapeHtml(repo.name || 'Sem nome')}</h5>
              <p class="card-text">${escapeHtml(repo.description || 'Sem descrição')}</p>
              <a href="${repo.html_url}" target="_blank" class="btn btn-success mt-auto">Ver no GitHub</a>
            </div>
          `;
          wrapper.appendChild(inner);
          lista.appendChild(wrapper);

          // observer apenas no inner card
          projectObserver.observe(inner);
        } catch (errCard) {
          console.error('Erro ao criar card do repo:', errCard);
        }
      });

    } catch (err) {
      console.error('Erro fetch carregarProjetos():', err);
      lista.innerHTML = '<p style="color:#f39c12;">Não foi possível carregar os projetos (ver console).</p>';
    }
  }

  // pequena função de escape para evitar que campos venham com HTML
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

}); // fim DOMContentLoaded
