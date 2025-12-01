# MD Editor Pro - Feature Roadmap

Este documento rastreia funcionalidades implementadas, em desenvolvimento e planejadas para o MD Editor Pro.

---

## ✅ Funcionalidades Implementadas

### 📝 Editor Core
- [x] Editor CodeMirror 6 com suporte completo a markdown
- [x] Syntax highlighting para blocos de código
- [x] Undo/Redo
- [x] Numeração de linhas (toggle via menu View)
- [x] Drag-and-drop de arquivos markdown
- [x] **Múltiplos Cursores**
  - Ctrl+Click (Cmd+Click no macOS) para adicionar cursores
  - Ctrl+D (Cmd+D) para selecionar próxima ocorrência
  - Alt+Drag para seleção em coluna
  - Escape para limpar cursores extras

### 🔍 Busca e Navegação
- [x] Busca e substituição (Find & Replace) no documento atual
- [x] **Busca Global** - Pesquisar em todos os arquivos do workspace
  - Painel lateral com resultados organizados por arquivo
  - Opções: case sensitive, palavra inteira, regex
  - Navegação rápida (clique abre arquivo e vai para linha)
  - Atalho: Ctrl+Shift+F (Cmd+Shift+F no macOS)
- [x] **Outline Panel** - Índice automático de Headers (H1-H6)
  - Estrutura hierárquica navegável
  - Destaque da seção ativa
  - Expansão/colapso de seções
  - Navegação por teclado completa
  - Atalho: Ctrl+Shift+O (Cmd+Shift+O no macOS)

### ✏️ Formatação e Edição
- [x] Formatação rápida (Bold, Italic, Code, Strikethrough, Links, Listas)
- [x] Barra de ferramentas de formatação completa
- [x] Inserção rápida de elementos (headings, listas, tabelas, imagens, links)
- [x] Sistema de snippets com triggers customizáveis
- [x] Gerenciador de snippets (built-in e custom)
- [x] Sistema de templates (built-in e customizáveis)
- [x] Placeholders em templates com navegação automática
- [x] Categorização de templates
- [x] Histórico de uso de templates e snippets

### 👁️ Preview e Visualização
- [x] Preview em tempo real
- [x] Suporte a CommonMark e GitHub Flavored Markdown (GFM)
- [x] Suporte a tabelas, strikethrough, task lists
- [x] Syntax highlighting para código no preview
- [x] Sincronização de scroll entre editor e preview
- [x] Modos de visualização (Editor, Preview, Split)
- [x] **Typewriter Scrolling** - Linha ativa centralizada verticalmente
  - Centralização automática durante digitação
  - Suspensão temporária ao rolar manualmente
  - Atalho: Ctrl+Shift+T (Cmd+Shift+T no macOS)

### 🎨 Markdown Avançado
- [x] Diagramas Mermaid (flowcharts, sequence, class, state, ER, Gantt, pie, git graphs)
- [x] Fórmulas matemáticas com KaTeX (inline e display)
- [x] Callout blocks (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
- [x] Configuração individual de features avançadas
- [x] Suporte a linguagem Mermaid no editor (syntax highlighting)

### 📂 Gestão de Arquivos e Projetos
- [x] Sistema de abas (tabs) com múltiplos documentos
- [x] Persistência de sessão (restaura abas ao reabrir)
- [x] Navegação entre abas (Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+W para fechar)
- [x] Indicador de modificações não salvas
- [x] Confirmação ao fechar abas modificadas
- [x] Aviso ao fechar janela com alterações não salvas
- [x] **File Tree Sidebar** - Navegação de arquivos
  - Abertura de pasta como workspace
  - Expansão/colapso de pastas com carregamento lazy
  - Filtro automático de arquivos markdown (.md, .markdown)
  - Integração com sistema de abas
  - Indicadores visuais (arquivo ativo, arquivos modificados)
  - Persistência de estado (visibilidade, pastas expandidas)
  - Toggle: Ctrl+Shift+B ou menu View
- [x] **Activity Bar (VS Code Style)** - Barra lateral unificada
  - Explorer (File Tree) - Ctrl+Shift+E
  - Search (Busca Global) - Ctrl+Shift+F
  - Outline (Estrutura do Documento) - Ctrl+Shift+O
  - Templates (em desenvolvimento)
  - Snippets (em desenvolvimento)
  - Settings (em desenvolvimento)

### 🖼️ Gestão de Imagens
- [x] **Image Paste** - Colar imagens do clipboard
  - Detecção automática de imagens no clipboard
  - Salvamento automático na pasta `./assets` (configurável)
  - Inserção de link markdown relativo
  - Configurável via menu Settings > Image Paste Settings
  - Opções: habilitar/desabilitar, customizar pasta de destino

### 📤 Exportação
- [x] Exportar para HTML (com features avançadas preservadas)
- [x] Exportar para PDF (com features avançadas preservadas)

### 🎨 Temas e Interface
- [x] **Sistema de Temas Expandido** - 7 temas profissionais
  - Light - Tema claro padrão
  - Dark - Tema escuro moderno
  - Solarized Light/Dark - Paleta cientificamente balanceada
  - Dracula - Tema escuro vibrante e popular
  - Monokai - Tema clássico de editores
  - Nord - Paleta ártica minimalista
- [x] **Theme Selector** - Interface visual para seleção de temas
  - Preview de cada tema antes de aplicar
  - Organização por categorias
  - Atalho: Ctrl+K Ctrl+T (Cmd+K Cmd+T no macOS)
- [x] Alternância rápida entre light/dark (Ctrl+T)
- [x] Ciclo entre todos os temas disponíveis
- [x] Modo foco (distraction-free) com F11
- [x] Estatísticas de documento (palavras, caracteres, linhas, tempo de leitura)
- [x] Painel de estatísticas expansível/retrátil
- [x] Menu de aplicação completo (File, Insert, Edit, View, Tools, Help)
- [x] Menu About com informações da aplicação e versões

### ⚙️ Produtividade e Configuração
- [x] Auto-save configurável (com delay ajustável)
- [x] Interface de configuração de auto-save
- [x] Atalhos de teclado configuráveis
- [x] Interface de edição de keyboard shortcuts (visualizar, editar, resetar)
- [x] Persistência de configurações (electron-store)
- [x] Salvamento de estado de abas (conteúdo, posição do cursor, scroll)
- [x] Salvamento de preferências de tema e view mode
- [x] Salvamento de snippets e atalhos customizados

### ♿ Acessibilidade
- [x] ARIA labels para estrutura de árvore do Outline Panel
- [x] Navegação por teclado completa no Outline Panel
- [x] Anúncios para leitores de tela ao alternar modos
- [x] Suporte a navegação por teclado em todos os componentes principais

### 💻 Plataformas
- [x] Windows (NSIS installer + portable)
- [x] macOS (DMG + ZIP para Intel e Apple Silicon)
- [x] Linux (AppImage, DEB, RPM)
- [x] Associação de arquivos .md e .markdown

---

## 🚧 Próximos Passos (Alta Prioridade)

### Gestão de Conteúdo
- [ ] **Conversão Inteligente ao Colar** - Converter HTML (de sites) para Markdown automaticamente ao colar

---

## 💡 Roadmap Futuro

### Gestão de Conhecimento (PKM)
- [ ] **Wiki-Links** - Links internos rápidos usando sintaxe `[[Nome do Arquivo]]` com autocomplete
- [ ] **Backlinks** - Visualizar quais arquivos linkam para o documento atual
- [ ] **Suporte a Frontmatter (YAML)** - Renderização visual de metadados no topo do arquivo (tags, data, status)

### Inteligência Artificial (BYOK - Bring Your Own Key)
- [ ] **Assistente de Escrita** - Integração com OpenAI/Anthropic (usuário fornece a chave) para resumir, expandir ou corrigir texto
- [ ] **Gerador de Títulos** - Sugestão de nomes de arquivo baseados no conteúdo

### Exportação Avançada
- [ ] **Exportar para DOCX** - Integração com Pandoc para compatibilidade com Word
- [ ] **Exportar para Apresentação** - Converter markdown para slides (Reveal.js)
- [ ] **Copy as Rich Text/HTML** - Copiar conteúdo renderizado para colar em e-mail/Gdocs

### Interface e Customização
- [ ] Minimap lateral para navegação rápida
- [ ] Code folding (dobramento de seções/código)
- [ ] Layouts salvos

### Integração
- [ ] **Git Básico** - Indicadores visuais na sidebar (arquivos modificados/novos) - *Sem UI de commit complexa*
- [ ] Publicação direta (WordPress, Medium, Dev.to)
