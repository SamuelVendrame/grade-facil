import { useEffect, useRef, useState } from 'react';
import type { Materia, Status } from './types';
import { CORES, STATUS_LABEL, uid } from './types';
import { carregar, exportarJSON, importarJSON, salvar, type Estado } from './storage';
import { exemplo } from './sample';
import { Kanban } from './components/Kanban';
import { MateriaModal } from './components/MateriaModal';
import { Montador } from './components/Montador';

type Aba = 'quadro' | 'grade';

const ORDEM_BARRA: Status[] = ['concluida', 'cursando', 'quero', 'pendente'];

export default function App() {
  const [estado, setEstado] = useState<Estado>(() => carregar() ?? { materias: exemplo(), fixadas: {} });
  const [aba, setAba] = useState<Aba>('quadro');
  const [editando, setEditando] = useState<{ m: Materia; nova: boolean } | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => salvar(estado), [estado]);

  const { materias, fixadas } = estado;
  const setMaterias = (fn: (ms: Materia[]) => Materia[]) => setEstado((e) => ({ ...e, materias: fn(e.materias) }));

  const credPor = (st: Status) => materias.filter((m) => m.status === st).reduce((t, m) => t + m.creditos, 0);
  const credTotal = materias.reduce((s, m) => s + m.creditos, 0);
  const credFeitos = credPor('concluida');
  const pct = credTotal ? Math.round((credFeitos / credTotal) * 100) : 0;
  const nQuero = materias.filter((m) => m.status === 'quero').length;

  const nova = (status: Status) =>
    setEditando({
      nova: true,
      m: { id: uid(), nome: '', creditos: 4, cor: CORES[materias.length % CORES.length], status, turmas: [] },
    });

  const salvarMateria = (m: Materia) => {
    setEstado((e) => {
      const ms = e.materias.some((x) => x.id === m.id) ? e.materias.map((x) => (x.id === m.id ? m : x)) : [...e.materias, m];
      const f = { ...e.fixadas };
      // remove a fixação se a turma fixada foi apagada
      if (f[m.id] && !m.turmas.some((t) => t.id === f[m.id])) delete f[m.id];
      return { materias: ms, fixadas: f };
    });
    setEditando(null);
  };

  const excluir = (id: string) => {
    setEstado((e) => {
      const f = { ...e.fixadas };
      delete f[id];
      return { materias: e.materias.filter((m) => m.id !== id), fixadas: f };
    });
    setEditando(null);
  };

  const importar = async (file?: File) => {
    if (!file) return;
    try {
      setEstado(await importarJSON(file));
    } catch {
      alert('Não consegui ler esse arquivo. Ele foi exportado pelo Grade Fácil?');
    }
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="mast-titulo">
          <h1>Grade Fácil</h1>
          <span>planejador de matrícula</span>
        </div>

        <nav className="abas" role="tablist">
          <button role="tab" aria-selected={aba === 'quadro'} className={aba === 'quadro' ? 'ativa' : ''} onClick={() => setAba('quadro')}>
            <span className="num">01</span> Quadro
          </button>
          <button role="tab" aria-selected={aba === 'grade'} className={aba === 'grade' ? 'ativa' : ''} onClick={() => setAba('grade')}>
            <span className="num">02</span> Grade
            {nQuero > 0 && <span className="contador">{nQuero}</span>}
          </button>
        </nav>

        <div className="mast-acoes">
          <button className="btn-texto" onClick={() => exportarJSON(estado)}>Exportar</button>
          <button className="btn-texto" onClick={() => arquivoRef.current?.click()}>Importar</button>
          <button className="btn-texto" onClick={() => confirm('Apagar tudo e começar do zero?') && setEstado({ materias: [], fixadas: {} })}>
            Limpar
          </button>
          <input ref={arquivoRef} type="file" accept="application/json" hidden
            onChange={(e) => { importar(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </header>

      <section className="status" aria-label="Progresso do curso">
        <div className="status-num">
          <strong>{pct}<small>%</small></strong>
          <span>do curso concluído<br /><b>{credFeitos}</b> de <b>{credTotal}</b> créditos</span>
        </div>
        <div className="status-regua">
          <div className="regua" role="img" aria-label={`${pct}% concluído`}>
            {ORDEM_BARRA.map((st) => {
              const cr = credPor(st);
              return cr > 0 ? <div key={st} className={`seg st-${st}`} style={{ flexGrow: cr }} /> : null;
            })}
          </div>
          <ul className="regua-legenda">
            {ORDEM_BARRA.map((st) => (
              <li key={st} className={`st-${st}`}><i />{STATUS_LABEL[st]} <b>{credPor(st)}</b></li>
            ))}
          </ul>
        </div>
      </section>

      <main>
        {aba === 'quadro' ? (
          <Kanban
            materias={materias}
            onMover={(id, status) => setMaterias((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)))}
            onEditar={(m) => setEditando({ m, nova: false })}
            onNova={nova}
          />
        ) : (
          <Montador
            materias={materias}
            fixadas={fixadas}
            onFixar={(mid, tid) =>
              setEstado((e) => {
                const f = { ...e.fixadas };
                if (tid) f[mid] = tid; else delete f[mid];
                return { ...e, fixadas: f };
              })
            }
            onIrKanban={() => setAba('quadro')}
          />
        )}
      </main>

      <footer className="rodape">
        <span>Os dados ficam salvos só neste navegador.</span>
        <a href="https://github.com/SamuelVendrame/grade-facil" target="_blank" rel="noreferrer">Código-fonte ↗</a>
      </footer>

      {editando && (
        <MateriaModal
          key={editando.m.id}
          inicial={editando.m}
          nova={editando.nova}
          onSalvar={salvarMateria}
          onExcluir={excluir}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
