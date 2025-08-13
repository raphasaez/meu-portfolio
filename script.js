document.getElementById('btn-interacao').addEventListener('click', () => {
    const curiosidades = [
        "Você sabia que 'Pentest' vem de 'Penetration Testing'?",
        "O uso de Accessibility Service pode ser explorado para automação avançada.",
        "Segurança é sobre minimizar riscos e aprender com falhas éticas."
    ];
    const index = Math.floor(Math.random() * curiosidades.length);
    document.getElementById('interacao-text').innerText = curiosidades[index];
});
