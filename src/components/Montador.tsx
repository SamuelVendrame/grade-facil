import { useMemo, useRef, useState } from 'react';
import type { Materia } from '../types';
import { gerarGrades } from '../scheduler';
import { exportarPDF } from '../pdf';
import { Grade } from './Grade';

interface Props {
  materias: Materia[];
  fixadas: Record<string, string>;
  onFixar: (materiaId: string, turmaId: string | null) => void;
  onIrKanban: () => void;
}

const horas = (min: number) => (min === 0 ? 'sem janelas' : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')} de janela`);

export function Montador({ materias, fixadas, onFixar, onIrKanban }: Props) {
  const queridas = useMemo(() => materias.filter((m) => m.status === 'quero'), [materias]);
  const opcoes = useMemo(() => gerarGrades(queridas, fixadas), [queridas, fixadas]);
  const [idx, setIdx] = useState(0);
  const [baixando, setBaixando] = useState(false);
  const gradeRef = useRef<HTMLDivElement>(null);

  const i = Math.min(idx, Math.max(0, opcoes.length - 1));
  const opcao = opcoes[i];

  if (queridas.length === 0) {
    return (
      <div className="estado-vazio">
        <h2>Nenhuma matéria em “Quero cursar”</h2>
        <p>Arraste as matérias que você quer fazer no próximo semestre para a coluna <b>Quero cursar</b> e volte aqui.</p>
        <button className="btn primario" onClick={onIrKanban}>Ir para o quadro</button>
      </div>
    );
  }

  const baixar = async () => {
    if (!gradeRef.current) return;
    setBaixando(true);
    try { await exportarPDF(gradeRef.current); } finally { setBaixando(false); }
  };

  return (
    <div className="montador">
      <aside className="painel">
        <h3>Matérias escolhidas</h3>
        <p className="dica">Fixe uma turma pra travar ela em todas as opções.</p>
        <ul className="lista-fixar">
          {queridas.map((m) => (
            <li key={m.id}>
              <i style={{ background: m.cor }} />
              <span className="nome">{m.nome}</span>
              <select value={fixadas[m.id] ?? ''} onChange={(e) => onFixar(m.id, e.target.value || null)}
                disabled={m.turmas.length === 0} aria-label={`Turma de ${m.nome}`}>
                <option value="">{m.turmas.length ? 'Qualquer turma' : 'Sem turmas'}</option>
                {m.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}{t.professor ? ` · ${t.professor}` : ''}</option>)}
              </select>
            </li>
          ))}
        </ul>
      </aside>

      <section className="resultado">
        {!opcao ? (
          <div className="estado-vazio">
            <h2>Nenhuma combinação possível</h2>
            <p>Confira se as matérias têm turmas com horários válidos ou solte alguma turma fixada.</p>
          </div>
        ) : (
          <>
            <div className="barra-opcoes">
              <button className="btn" onClick={() => setIdx(i - 1)} disabled={i === 0} aria-label="Opção anterior">←</button>
              <div className="opcao-info">
                <strong>Opção {i + 1} de {opcoes.length}{opcoes.length >= 300 ? '+' : ''}</strong>
                <span>{opcao.dias} {opcao.dias === 1 ? 'dia' : 'dias'} na facul · {horas(opcao.janelas)} · {opcao.creditos} créditos</span>
              </div>
              <button className="btn" onClick={() => setIdx(i + 1)} disabled={i >= opcoes.length - 1} aria-label="Próxima opção">→</button>
              <span className="espaco" />
              <button className="btn primario" onClick={baixar} disabled={baixando}>
                {baixando ? 'Gerando…' : '⬇ Baixar PDF'}
              </button>
            </div>

            {opcao.fora.length > 0 && (
              <div className="alerta">
                Não dá pra encaixar tudo. Ficaram de fora por choque de horário:{' '}
                <b>{opcao.fora.map((m) => m.nome).join(', ')}</b>
              </div>
            )}

            <Grade ref={gradeRef} escolhas={opcao.escolhas} titulo="Minha grade" />
          </>
        )}
      </section>
    </div>
  );
}
