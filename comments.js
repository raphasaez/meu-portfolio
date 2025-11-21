// comments.js
document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');

  // Se os elementos não existem, não faz nada
  if (!commentForm || !commentsList) return;

  // ===== Supabase Config =====
  const supabaseUrl = "https://odgmhahvodehevdsrqwo.supabase.co";
  const supabaseKey = "sb_publishable_eXFAAb6o9q96r7FH57bgJA_Ft3u5_Ib";
  const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

  // Função para escapar HTML (evita XSS)
  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // ===== Carregar comentários =====
  async function carregarComentarios() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      commentsList.innerHTML = '';
      data.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment mb-3';
        div.innerHTML = `
          <strong>${escapeHtml(c.name)}</strong><br>
          <p>${escapeHtml(c.comment)}</p>
          <small>${new Date(c.created_at).toLocaleString()}</small>
          <hr>
        `;
        commentsList.appendChild(div);
      });
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
      commentsList.innerHTML = '<p style="color:#f39c12;">Erro ao carregar comentários.</p>';
    }
  }

  // ===== Enviar comentário =====
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const comment = document.getElementById('comment').value.trim();
    if (!name || !comment) return alert('Preencha nome e comentário.');

    try {
      const { error } = await supabase.from('comments').insert([{ name, comment }]);
      if (error) throw error;
      commentForm.reset();
      carregarComentarios(); // Atualiza lista após envio
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      alert('Erro ao enviar comentário.');
    }
  });

  // Carrega comentários ao abrir a página
  carregarComentarios();
});
