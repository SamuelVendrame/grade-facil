import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { Materia, Slot, Status, Turma } from '../types';
import { CORES, DIAS_LONGO, STATUS_LABEL, STATUS_ORDER, uid } from '../types';
import { slotValido } from '../scheduler';
import { Icon } from './Icon';

interface Props {
  inicial: Materia;
  nova: boolean;
  onSalvar: (m: Materia) => void;
  onExcluir: (id: string) => void;
  onFechar: () => void;
}

export function MateriaModal({ inicial, nova, onSalvar, onExcluir, onFechar }: Props) {
  const [m, setM] = useState<Materia>(inicial);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  const setTurma = (id: string, patch: Partial<Turma>) =>
    setM((p) => ({ ...p, turmas: p.turmas.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const setSlot = (t: Turma, i: number, patch: Partial<Slot>) =>
    setTurma(t.id, { slots: t.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const addTurma = () =>
    setM((p) => ({
      ...p,
      turmas: [...p.turmas, {
        id: uid(),
        nome: `T${String(p.turmas.length + 1).padStart(2, '0')}`,
        slots: [{ dia: 0, inicio: '19:00', fim: '20:40' }],
      }],
    }));

  const invalido = !m.nome.trim() || m.turmas.some((t) => t.slots.some((s) => !slotValido(s)));

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalido) onSalvar({ ...m, nome: m.nome.trim(), codigo: m.codigo?.trim() || undefined });
        }}
      >
        <header className="modal-topo">
          <div className="modal-titulo">
            <span className="modal-cor" style={{ background: m.cor }} />
            <h2>{nova ? 'Nova matéria' : 'Editar matéria'}</h2>
          </div>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><Icon name="x" size={18} /></button>
        </header>

        <div className="campos">
          <label className="campo-largo">
            Nome
            <input autoFocus value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} placeholder="Ex.: Estruturas de Dados" />
          </label>
          <label>
            Código
            <input value={m.codigo ?? ''} onChange={(e) => setM({ ...m, codigo: e.target.value })} placeholder="ED201" />
          </label>
          <label>
            Créditos
            <input type="number" min={0} max={30} value={m.creditos}
              onChange={(e) => setM({ ...m, creditos: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>
            Status
            <select value={m.status} onChange={(e) => setM({ ...m, status: e.target.value as Status })}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
        </div>

        <div className="cores-rotulo">Cor</div>
        <div className="cores" role="radiogroup" aria-label="Cor">
          {CORES.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={m.cor === c} aria-label={c}
              className={`cor ${m.cor === c ? 'sel' : ''}`} style={{ background: c }}
              onClick={() => setM({ ...m, cor: c })} />
          ))}
        </div>

        <div className="turmas">
          <div className="turmas-topo">
            <h3>Turmas <span className="contagem">{m.turmas.length}</span></h3>
            <button type="button" className="btn" onClick={addTurma}>+ Turma</button>
          </div>
          {m.turmas.length === 0 && <p className="vazio">Adicione as turmas com os horários pra matéria entrar na grade.</p>}
          {m.turmas.map((t) => (
            <div className="turma" key={t.id} style={{ '--cor': m.cor } as CSSProperties}>
              <div className="turma-linha">
                <input className="turma-nome" value={t.nome} onChange={(e) => setTurma(t.id, { nome: e.target.value })} aria-label="Nome da turma" />
                <input value={t.professor ?? ''} placeholder="Professor (opcional)" onChange={(e) => setTurma(t.id, { professor: e.target.value })} aria-label="Professor" />
                <button type="button" className="btn-icone" aria-label="Remover turma"
                  onClick={() => setM({ ...m, turmas: m.turmas.filter((x) => x.id !== t.id) })}><Icon name="trash" /></button>
              </div>
              {t.slots.map((s, i) => (
                <div className={`slot ${slotValido(s) ? '' : 'erro'}`} key={i}>
                  <select value={s.dia} onChange={(e) => setSlot(t, i, { dia: Number(e.target.value) })} aria-label="Dia">
                    {DIAS_LONGO.map((d, j) => <option key={d} value={j}>{d}</option>)}
                  </select>
                  <input type="time" value={s.inicio} onChange={(e) => setSlot(t, i, { inicio: e.target.value })} aria-label="Início" />
                  <span className="seta">→</span>
                  <input type="time" value={s.fim} onChange={(e) => setSlot(t, i, { fim: e.target.value })} aria-label="Fim" />
                  <button type="button" className="btn-icone" aria-label="Remover horário"
                    onClick={() => setTurma(t.id, { slots: t.slots.filter((_, j) => j !== i) })}><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn-link"
                onClick={() => setTurma(t.id, { slots: [...t.slots, { ...(t.slots[t.slots.length - 1] ?? { dia: 0, inicio: '19:00', fim: '20:40' }) }] })}>
                + horário
              </button>
            </div>
          ))}
        </div>

        <footer className="modal-rodape">
          {!nova && (
            <button type="button" className="btn perigo"
              onClick={() => confirm(`Excluir "${m.nome}"?`) && onExcluir(m.id)}>Excluir</button>
          )}
          <span className="espaco" />
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn primario" disabled={invalido}>Salvar</button>
        </footer>
      </form>
    </div>
  );
}
