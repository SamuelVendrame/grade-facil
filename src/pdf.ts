export async function exportarPDF(el: HTMLElement, nomeArquivo = 'minha-grade.pdf') {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  el.classList.add('exportando');
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margem = 10;
    const escala = Math.min((pw - margem * 2) / canvas.width, (ph - margem * 2) / canvas.height);
    const w = canvas.width * escala;
    const h = canvas.height * escala;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pw - w) / 2, margem, w, h);
    pdf.save(nomeArquivo);
  } finally {
    el.classList.remove('exportando');
  }
}
