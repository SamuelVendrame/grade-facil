<div align="center">

# Grade Fácil

**Organize as matérias do curso num kanban e gere automaticamente todas as grades horárias possíveis, sem choque de horário.**

[![Deploy](https://github.com/SamuelVendrame/grade-facil/actions/workflows/deploy.yml/badge.svg)](https://github.com/SamuelVendrame/grade-facil/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/testes-Vitest-6e9f18?logo=vitest&logoColor=white)
[![Licença MIT](https://img.shields.io/badge/licença-MIT-blue)](LICENSE)

**[Abrir o app →](https://samuelvendrame.github.io/grade-facil/)**

<img src="docs/demo.gif" alt="Demonstração: arrastando uma matéria no kanban e gerando as grades" width="860" />

</div>

## O problema

Toda época de matrícula é a mesma coisa: várias matérias, cada uma com duas ou três turmas em horários diferentes, e você tentando montar na mão, numa planilha, uma combinação sem choque que, se possível, não te faça ir pra faculdade todo dia.

O **Grade Fácil** resolve isso. Você cadastra as turmas uma vez e ele testa **todas as combinações** por você, ranqueando as melhores.

## Funcionalidades

| | |
|---|---|
| **Kanban do curso** | Arraste as matérias entre *Pendentes*, *Quero cursar*, *Cursando* e *Concluídas*, com o progresso do curso em créditos. |
| **Montador automático** | Gera todas as combinações de turmas sem conflito a partir do que está em *Quero cursar*. |
| **Ranking das opções** | As opções vêm ordenadas por **menos dias na faculdade** e **menos janelas** entre aulas. |
| **Fixar turma** | Quer muito a turma de um professor? Trave ela e veja só as opções compatíveis. |
| **Encaixe parcial** | Se não couber tudo, mostra as combinações com o **máximo de matérias** e avisa quais ficaram de fora. |
| **Exportar PDF** | Baixe a grade em A4 paisagem, pronta pra imprimir ou mandar no grupo da turma. |
| **Importar e exportar JSON** | Compartilhe o cadastro das turmas com os colegas. |
| **Sem login e sem servidor** | Tudo fica no `localStorage` do seu navegador. |

E mais: tema claro e escuro automático, layout responsivo, drag-and-drop com mouse, toque e teclado, e navegação entre opções com <kbd>←</kbd> <kbd>→</kbd>.

<p align="center">
  <img src="docs/quadro.png" alt="Quadro de matérias" width="49%" />
  <img src="docs/grade.png" alt="Grade gerada" width="49%" />
</p>

## Como funciona o montador

O núcleo fica em [`src/scheduler.ts`](src/scheduler.ts): um **backtracking com poda**.

```
para cada matéria (as com menos turmas primeiro):
    para cada turma que não choca com as já escolhidas:
        escolhe a turma → desce para a próxima matéria
    também tenta pular a matéria   ← permite o encaixe parcial
```

- **Conflito:** duas aulas chocam quando são no mesmo dia e `inicioA < fimB && inicioB < fimA`.
- **Poda:** um ramo é descartado quando não consegue mais igualar o melhor número de matérias já encaixadas.
- **Ranking:** cada combinação é pontuada pelos dias usados e pelos minutos de janela (intervalos de até 20 min não contam).
- **Segurança:** há limites de resultados e de passos, então o navegador nunca trava.

O algoritmo é coberto por testes em [`src/scheduler.test.ts`](src/scheduler.test.ts), que rodam no CI antes de cada deploy.

## Stack

- **[React 19](https://react.dev) + TypeScript + [Vite](https://vite.dev)**
- **[dnd-kit](https://dndkit.com)**: drag-and-drop acessível
- **[jsPDF](https://github.com/parallax/jsPDF) + [html-to-image](https://github.com/bubkoo/html-to-image)**: geração do PDF, carregados sob demanda
- **[Vitest](https://vitest.dev)**: testes unitários
- **CSS puro** com design tokens e `color-mix()`, sem framework de UI
- **GitHub Actions**: lint, testes, build e deploy no GitHub Pages a cada push

## Rodando localmente

```bash
git clone https://github.com/SamuelVendrame/grade-facil.git
cd grade-facil
npm install
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | roda os testes do algoritmo |
| `npm run lint` | ESLint |
| `npm run build` | build de produção em `dist/` |

## Estrutura

```
src/
├── App.tsx               # estado global, abas, import/export
├── scheduler.ts          # algoritmo de geração das grades
├── scheduler.test.ts     # testes do algoritmo
├── pdf.ts                # exportação para PDF
├── storage.ts            # localStorage + JSON
├── sample.ts             # dados de exemplo
├── types.ts
└── components/
    ├── Kanban.tsx        # quadro com drag-and-drop
    ├── MateriaModal.tsx  # cadastro de matéria, turmas e horários
    ├── Montador.tsx      # tela de opções de grade
    ├── Grade.tsx         # grade semanal visual
    └── Icon.tsx          # ícones SVG
```

## Próximos passos

- [ ] Pré-requisitos entre matérias
- [ ] Compartilhar o planejamento por link
- [ ] Exportar a grade para o Google Calendar (`.ics`)
- [ ] Preferências no ranking (ex.: "sem aula na sexta")

## Licença

[MIT](LICENSE). Feito por [Samuel Vendrame](https://github.com/SamuelVendrame).
