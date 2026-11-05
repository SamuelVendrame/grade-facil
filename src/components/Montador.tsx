import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Materia } from '../types';
import { DIAS, DIAS_LONGO } from '../types';
import { gerarGrades } from '../scheduler';
import { exportarPDF } from '../pdf';
import { Grade } from './Grade';

interface Props {
  materias: Materia[];
  fixadas: Record<string, string>;
  onFixar: (materiaId: string, turmaId: string | null) => void;
  onIrKanban: () => void;
}

const fmtJanela = (min: number) => (min === 0 ? 'sem janelas' : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')} de janela`);

export function Montador({ materias, fixadas, onFixar, onIrKanban }: Props) {
  const queridas = useMemo(() => materias.filter((m) => m.status === 'quero'), [materias]);
  const opcoes = useMemo(() => gerarGrades(queridas, fixadas), [queridas, fixadas]);
  const [idx, setIdx] = useState(0);
  const [baixando, setBaixando] = useState(false);
  const gradeRef = useRef<HTMLDivElement>(null);

  const i = Math.min(idx, Math.max(0, opcoes.length - 1));
  const opcao = opcoes[i];

  // ← → navegam entre as opções
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea')) return;
      if (e.key === 'ArrowLeft') setIdx((v) => Math.max(0, Math.min(v, opcoes.length - 1) - 1));
      if (e.key === 'ArrowRight') setIdx((v) => Math.min(opcoes.length - 1, v + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opcoes.length]);

  if (queridas.length === 0) {
    return (
      <div className="estado-vazio">
        <h2>Nada em “Quero cursar” ainda.</h2>
        <p>Arraste para essa coluna as matérias que você pretende fazer no próximo semestre e volte aqui.</p>
        <button className="btn" onClick={onIrKanban}>← Voltar ao quadro</button>
      </div>
    );
  }

  const baixar = async () => {
    if (!gradeRef.current) return;
    setBaixando(true);
    try { await exportarPDF(gradeRef.current); } finally { setBaixando(false); }
  };

  const diasUsados = new Set(opcao?.escolhas.flatMap((e) => e.turma.slots.map((s) => s.dia)) ?? []);
  const total = `${String(opcoes.length).padStart(2, '0')}${opcoes.length >= 300 ? '+' : ''}`;

  return (
    <div className="montador">
      <aside className="painel">
        <h3 className="rotulo">Matérias escolhidas <span>{String(queridas.length).padStart(2, '0')}</span></h3>
        <p className="dica">Fixe uma turma para travá-la em todas as opções.</p>
        <ul className="lista-fixar">
          {queridas.map((m) => {
            const fixa = !!fixadas[m.id];
            const fora = opcao?.fora.some((f) => f.id === m.id);
            return (
              <li key={m.id} className={`${fixa ? 'fixa' : ''} ${fora ? 'fora' : ''}`} style={{ '--cor': m.cor } as CSSProperties}>
                <div className="fixar-nome">
                  <i />
                  <span>{m.nome}</span>
                  {fixa && <em>fixada</em>}
                  {fora && <em className="fora-tag">fora</em>}
                </div>
                <select value={fixadas[m.id] ?? ''} onChange={(e) => onFixar(m.id, e.target.value || null)}
                  disabled={m.turmas.length === 0} aria-label={`Turma de ${m.nome}`}>
                  <option value="">{m.turmas.length ? 'Qualquer turma' : 'Sem turmas cadastradas'}</option>
                  {m.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}{t.professor ? ` · ${t.professor}` : ''}</option>)}
                </select>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="resultado">
        {!opcao ? (
          <div className="estado-vazio">
            <h2>Nenhuma combinação possível.</h2>
            <p>Confira se as matérias têm turmas com horários válidos, ou solte alguma turma fixada.</p>
          </div>
        ) : (
          <>
            <div className="barra-opcoes">
              <div className="navegador">
                <button className="btn-seta" onClick={() => setIdx(i - 1)} disabled={i === 0} aria-label="Opção anterior">←</button>
                <div className="opcao-num">
                  <span className="rotulo">Opção</span>
                  <strong>{String(i + 1).padStart(2, '0')}<span> / {total}</span></strong>
                </div>
                <button className="btn-seta" onClick={() => setIdx(i + 1)} disabled={i >= opcoes.length - 1} aria-label="Próxima opção">→</button>
              </div>

              <dl className="metricas">
                <div>
                  <dt className="rotulo">Dias</dt>
                  <dd className="dias-usados" aria-label={`${opcao.dias} dias com aula`}>
                    {DIAS.map((d, di) => (
                      <span key={d} title={`${DIAS_LONGO[di]}: ${diasUsados.has(di) ? 'com aula' : 'livre'}`}
                        className={diasUsados.has(di) ? 'on' : ''}>{d.slice(0, 3)}</span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="rotulo">Janelas</dt>
                  <dd>{fmtJanela(opcao.janelas)}</dd>
                </div>
                <div>
                  <dt className="rotulo">Créditos</dt>
                  <dd>{opcao.creditos}</dd>
                </div>
                {i === 0 && opcoes.length > 1 && <span className="selo">melhor opção</span>}
              </dl>

              <button className="btn primario" onClick={baixar} disabled={baixando}>
                {baixando ? 'Gerando…' : 'Baixar PDF'}
              </button>
            </div>

            {opcao.fora.length > 0 && (
              <div className="alerta">
                <b>Não cabe tudo.</b> Ficaram de fora por choque de horário: {opcao.fora.map((m) => m.nome).join(', ')}.
              </div>
            )}

            <Grade ref={gradeRef} escolhas={opcao.escolhas} titulo="Minha grade"
              subtitulo={`${opcao.dias} ${opcao.dias === 1 ? 'dia' : 'dias'} na faculdade · ${fmtJanela(opcao.janelas)}`} />
            <p className="dica-teclado">Use <kbd>←</kbd> <kbd>→</kbd> para navegar entre as opções.</p>
          </>
        )}
      </section>
    </div>
  );
}
