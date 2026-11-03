import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Materia } from '../types';
import { DIAS, DIAS_LONGO } from '../types';
import { gerarGrades } from '../scheduler';
import { exportarPDF } from '../pdf';
import { Grade } from './Grade';
import { Icon } from './Icon';

interface Props {
  materias: Materia[];
  fixadas: Record<string, string>;
  onFixar: (materiaId: string, turmaId: string | null) => void;
  onIrKanban: () => void;
}

const fmtJanela = (min: number) => (min === 0 ? 'Sem janelas' : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')} de janela`);

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
        <div className="estado-icone"><Icon name="grid" size={28} /></div>
        <h2>Nenhuma matéria em “Quero cursar”</h2>
        <p>Arraste pra coluna <b>Quero cursar</b> as matérias que você pretende fazer no próximo semestre e volte aqui.</p>
        <button className="btn primario" onClick={onIrKanban}><Icon name="board" /> Ir para o quadro</button>
      </div>
    );
  }

  const baixar = async () => {
    if (!gradeRef.current) return;
    setBaixando(true);
    try { await exportarPDF(gradeRef.current); } finally { setBaixando(false); }
  };

  const diasUsados = new Set(opcao?.escolhas.flatMap((e) => e.turma.slots.map((s) => s.dia)) ?? []);

  return (
    <div className="montador">
      <aside className="painel">
        <div className="painel-topo">
          <h3>Matérias escolhidas</h3>
          <span className="pill">{queridas.length}</span>
        </div>
        <p className="dica">Fixe uma turma pra travar ela em todas as opções.</p>
        <ul className="lista-fixar">
          {queridas.map((m) => {
            const fixa = !!fixadas[m.id];
            const fora = opcao?.fora.some((f) => f.id === m.id);
            return (
              <li key={m.id} className={`${fixa ? 'fixa' : ''} ${fora ? 'fora' : ''}`} style={{ '--cor': m.cor } as CSSProperties}>
                <div className="fixar-nome">
                  <i />
                  <span>{m.nome}</span>
                  {fixa && <span className="tag-fixa"><Icon name="pin" size={12} /></span>}
                  {fora && <span className="tag-fora">fora</span>}
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
            <div className="estado-icone"><Icon name="alert" size={28} /></div>
            <h2>Nenhuma combinação possível</h2>
            <p>Confira se as matérias têm turmas com horários válidos, ou solte alguma turma fixada.</p>
          </div>
        ) : (
          <>
            <div className="barra-opcoes">
              <div className="navegador">
                <button className="btn-icone grande" onClick={() => setIdx(i - 1)} disabled={i === 0} aria-label="Opção anterior"><Icon name="left" /></button>
                <div className="opcao-num">
                  <small>Opção</small>
                  <strong>{i + 1}<span>/{opcoes.length}{opcoes.length >= 300 ? '+' : ''}</span></strong>
                </div>
                <button className="btn-icone grande" onClick={() => setIdx(i + 1)} disabled={i >= opcoes.length - 1} aria-label="Próxima opção"><Icon name="right" /></button>
              </div>

              <div className="metricas">
                <div className="dias-usados" aria-label={`${opcao.dias} dias com aula`}>
                  {DIAS.map((d, di) => <span key={d} title={`${DIAS_LONGO[di]}: ${diasUsados.has(di) ? 'com aula' : 'livre'}`} className={diasUsados.has(di) ? 'on' : ''}>{d[0]}</span>)}
                </div>
                <span className="chip"><Icon name="calendar" size={13} />{opcao.dias} {opcao.dias === 1 ? 'dia' : 'dias'}</span>
                <span className={`chip ${opcao.janelas === 0 ? 'bom' : ''}`}><Icon name="coffee" size={13} />{fmtJanela(opcao.janelas)}</span>
                {i === 0 && opcoes.length > 1 && <span className="chip destaque">★ Melhor opção</span>}
              </div>

              <button className="btn primario" onClick={baixar} disabled={baixando}>
                <Icon name="download" /> {baixando ? 'Gerando…' : 'Baixar PDF'}
              </button>
            </div>

            {opcao.fora.length > 0 && (
              <div className="alerta">
                <Icon name="alert" />
                <span>Não dá pra encaixar tudo. Ficaram de fora por choque de horário: <b>{opcao.fora.map((m) => m.nome).join(', ')}</b></span>
              </div>
            )}

            <Grade ref={gradeRef} escolhas={opcao.escolhas} titulo="Minha grade"
              subtitulo={`${opcao.dias} ${opcao.dias === 1 ? 'dia' : 'dias'} na faculdade · ${fmtJanela(opcao.janelas).toLowerCase()}`} />
            <p className="dica-teclado">Use <kbd>←</kbd> <kbd>→</kbd> para navegar entre as opções</p>
          </>
        )}
      </section>
    </div>
  );
}
