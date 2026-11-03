import { useEffect, useRef, useState } from 'react';
import type { Materia, Status } from './types';
import { CORES, uid } from './types';
import { carregar, exportarJSON, importarJSON, salvar, type Estado } from './storage';
import { exemplo } from './sample';
import { Kanban } from './components/Kanban';
import { MateriaModal } from './components/MateriaModal';
import { Montador } from './components/Montador';
import { Icon } from './components/Icon';

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

  const porStatus = (st: Status) => materias.filter((m) => m.status === st).reduce((t, m) => t + m.creditos, 0);
  const barras: { st: Status; label: string; cr: number }[] = [
    { st: 'concluida', label: 'Concluídas', cr: credFeitos },
    { st: 'cursando', label: 'Cursando', cr: porStatus('cursando') },
    { st: 'quero', label: 'Próximo semestre', cr: porStatus('quero') },
    { st: 'pendente', label: 'Pendentes', cr: porStatus('pendente') },
  ];
  const nQuero = materias.filter((m) => m.status === 'quero').length;

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-inner">
          <div className="marca">
            <span className="logo" aria-hidden><Icon name="grid" size={20} /></span>
            <h1>Grade<span>Fácil</span></h1>
          </div>
          <div className="acoes">
            <button className="btn fantasma" onClick={() => exportarJSON(estado)} title="Exportar JSON"><Icon name="download" /><span>Exportar</span></button>
            <button className="btn fantasma" onClick={() => arquivoRef.current?.click()} title="Importar JSON"><Icon name="upload" /><span>Importar</span></button>
            <button className="btn fantasma" title="Apagar tudo"
              onClick={() => confirm('Apagar tudo e começar do zero?') && setEstado({ materias: [], fixadas: {} })}>
              <Icon name="reset" /><span>Limpar</span>
            </button>
            <input ref={arquivoRef} type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
      </header>

      <div className="conteudo">
        <section className="hero">
          <div className="hero-texto">
            <h2>Monte sua grade sem choque de horário</h2>
            <p>Organize as matérias do curso no quadro, marque o que quer cursar e deixe o app testar todas as combinações de turmas por você.</p>
          </div>
          <div className="progresso-card">
            <div className="progresso-topo">
              <div>
                <small>Progresso do curso</small>
                <strong>{pct}%</strong>
              </div>
              <span>{credFeitos} de {credTotal} créditos<br />{concluidas.length} de {materias.length} matérias</span>
            </div>
            <div className="barra-empilhada" role="img" aria-label={`${pct}% concluído`}>
              {barras.map((b) => b.cr > 0 && <div key={b.st} className={`st-${b.st}`} style={{ flexGrow: b.cr }} title={`${b.label}: ${b.cr} cr`} />)}
            </div>
            <ul className="barra-legenda">
              {barras.map((b) => <li key={b.st} className={`st-${b.st}`}><i />{b.label} <b>{b.cr}</b></li>)}
            </ul>
          </div>
        </section>

        <nav className="abas" role="tablist">
          <button role="tab" aria-selected={aba === 'quadro'} className={aba === 'quadro' ? 'ativa' : ''} onClick={() => setAba('quadro')}>
            <Icon name="board" /> Quadro de matérias
          </button>
          <button role="tab" aria-selected={aba === 'grade'} className={aba === 'grade' ? 'ativa' : ''} onClick={() => setAba('grade')}>
            <Icon name="calendar" /> Montar grade
            {nQuero > 0 && <span className="badge">{nQuero}</span>}
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
        <span>🔒 Seus dados ficam só no seu navegador.</span>
        <a href="https://github.com/SamuelVendrame/grade-facil" target="_blank" rel="noreferrer"><Icon name="github" size={14} /> Código no GitHub</a>
      </footer>
      </div>

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
