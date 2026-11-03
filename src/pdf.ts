export async function exportarPDF(el: HTMLElement, nomeArquivo = 'minha-grade.pdf') {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);

  el.classList.add('exportando');
  try {
    // espera o layout de exportação (largura fixa, tema claro) ser aplicado
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const largura = el.scrollWidth;
    const altura = el.scrollHeight;
    const img = await toJpeg(el, { quality: 0.92, pixelRatio: 2, backgroundColor: '#ffffff', width: largura, height: altura });

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margem = 10;
    const escala = Math.min((pw - margem * 2) / largura, (ph - margem * 2) / altura);
    const w = largura * escala;
    const h = altura * escala;
    pdf.addImage(img, 'JPEG', (pw - w) / 2, margem, w, h);
    pdf.save(nomeArquivo);
  } finally {
    el.classList.remove('exportando');
  }
}
