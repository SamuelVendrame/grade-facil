import { useEffect, useRef, useState } from 'react';
import type { Materia, Status } from './types';
import { CORES, uid } from './types';
import { carregar, exportarJSON, importarJSON, salvar, type Estado } from './storage';
import { exemplo } from './sample';
import { Kanban } from './components/Kanban';
import { MateriaModal } from './components/MateriaModal';
import { Montador } from './components/Montador';

type Aba = 'quadro' | 'grade';

export default function App() {
  const [estado, setEstado] = useState<Estado>(() => carregar() ?? { materias: exemplo(), fixadas: {} });
  const [aba, setAba] = useState<Aba>('quadro');
  const [editando, setEditando] = useState<{ m: Materia; nova: boolean } | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => salvar(estado), [estado]);

  const { materias, fixadas } = estado;
  const setMaterias = (fn: (ms: Materia[]) => Materia[]) => setEstado((e) => ({ ...e, materias: fn(e.materias) }));

  const concluidas = materias.filter((m) => m.status === 'concluida');
  const credTotal = materias.reduce((s, m) => s + m.creditos, 0);
  const credFeitos = concluidas.reduce((s, m) => s + m.creditos, 0);
  const pct = credTotal ? Math.round((credFeitos / credTotal) * 100) : 0;

  const nova = (status: Status) =>
    setEditando({
      nova: true,
      m: { id: uid(), nome: '', creditos: 4, cor: CORES[materias.length % CORES.length], status, turmas: [] },
    });

  const salvarMateria = (m: Materia) => {
    setMaterias((ms) => (ms.some((x) => x.id === m.id) ? ms.map((x) => (x.id === m.id ? m : x)) : [...ms, m]));
    // remove fixação se a turma fixada foi apagada
    setEstado((e) => {
      const f = { ...e.fixadas };
      if (f[m.id] && !m.turmas.some((t) => t.id === f[m.id])) delete f[m.id];
      return { ...e, fixadas: f };
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
      <header className="topo">
        <div className="marca">
          <span className="logo" aria-hidden>▦</span>
          <div>
            <h1>Grade Fácil</h1>
            <p>Planeje o curso e monte sua grade sem choque de horário</p>
          </div>
        </div>

        <div className="progresso" title={`${credFeitos} de ${credTotal} créditos concluídos`}>
          <div className="progresso-texto">
            <span>{credFeitos}/{credTotal} créditos · {concluidas.length}/{materias.length} matérias</span>
            <b>{pct}%</b>
          </div>
          <div className="progresso-barra"><div style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="acoes">
          <button className="btn" onClick={() => exportarJSON(estado)}>Exportar</button>
          <button className="btn" onClick={() => arquivoRef.current?.click()}>Importar</button>
          <button className="btn" onClick={() => confirm('Apagar tudo e começar do zero?') && setEstado({ materias: [], fixadas: {} })}>
            Limpar
          </button>
          <input ref={arquivoRef} type="file" accept="application/json" hidden
            onChange={(e) => { importar(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </header>

      <nav className="abas" role="tablist">
        <button role="tab" aria-selected={aba === 'quadro'} className={aba === 'quadro' ? 'ativa' : ''} onClick={() => setAba('quadro')}>
          Quadro de matérias
        </button>
        <button role="tab" aria-selected={aba === 'grade'} className={aba === 'grade' ? 'ativa' : ''} onClick={() => setAba('grade')}>
          Montar grade
          <span className="badge">{materias.filter((m) => m.status === 'quero').length}</span>
        </button>
      </nav>

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
        Seus dados ficam só no seu navegador. ·{' '}
        <a href="https://github.com/SamuelVendrame/grade-facil" target="_blank" rel="noreferrer">Código no GitHub</a>
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
