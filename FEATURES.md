# Ideias de Features - MD Editor Pro

Este documento serve como um registro de ideias, sugestões de funcionalidades e roadmap para o MD Editor Pro.

## ✅ Implementadas

### Editor
- [x] Editor CodeMirror 6 com suporte completo a markdown
- [x] Syntax highlighting para blocos de código
- [x] Undo/Redo
- [x] Busca e substituição (Find & Replace)
- [x] Formatação rápida (Bold, Italic, Code, Strikethrough, Links, Listas, etc.)
- [x] Barra de ferramentas de formatação completa
- [x] Sistema de snippets com triggers customizáveis
- [x] Sincronização de scroll entre editor e preview
- [x] Suporte a linguagem Mermaid no editor (syntax highlighting)

### Preview
- [x] Preview em tempo real
- [x] Suporte a CommonMark e GitHub Flavored Markdown (GFM)
- [x] Suporte a tabelas, strikethrough, task lists
- [x] Syntax highlighting para código no preview

### Markdown Avançado
- [x] Diagramas Mermaid (flowcharts, sequence, class, state, ER, Gantt, pie, git graphs)
- [x] Fórmulas matemáticas com KaTeX (inline e display)
- [x] Callout blocks (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
- [x] Configuração individual de features avançadas

### Organização
- [x] Sistema de abas (tabs) com múltiplos documentos
- [x] Persistência de sessão (restaura abas ao reabrir)
- [x] Navegação entre abas (Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+W para fechar)
- [x] Indicador de modificações não salvas
- [x] Confirmação ao fechar abas modificadas
- [x] Aviso ao fechar janela com alterações não salvas

### Exportação
- [x] Exportar para HTML (com features avançadas preservadas)
- [x] Exportar para PDF (com features avançadas preservadas)

### Temas e Interface
- [x] Tema claro e escuro
- [x] Alternância rápida de tema
- [x] Modo foco (distraction-free) com F11
- [x] Modos de visualização (Editor, Preview, Split)
- [x] Estatísticas de documento (contagem de palavras, caracteres, linhas, tempo de leitura)
- [x] Painel de estatísticas expansível/retrátil
- [x] Menu de aplicação completo (File, Insert, Edit, View, Tools, Help)

### Produtividade
- [x] Auto-save configurável (com delay ajustável)
- [x] Interface de configuração de auto-save (ativar/desativar, ajustar delay)
- [x] Sistema de templates (built-in e customizáveis)
- [x] Placeholders em templates com navegação automática
- [x] Gerenciador de snippets customizáveis (built-in e custom)
- [x] Atalhos de teclado configuráveis
- [x] Interface de edição de keyboard shortcuts (visualizar, editar, resetar)
- [x] Drag-and-drop de arquivos markdown
- [x] Inserção rápida de elementos (headings, listas, tabelas, imagens, links)
- [x] Categorização de templates
- [x] Histórico de uso de templates e snippets

### Armazenamento
- [x] Persistência de configurações (electron-store)
- [x] Salvamento de estado de abas (conteúdo, posição do cursor, scroll)
- [x] Salvamento de preferências de tema e view mode
- [x] Histórico de uso de templates
- [x] Salvamento de snippets customizados
- [x] Salvamento de atalhos de teclado customizados

### Plataformas
- [x] Windows (NSIS installer + portable)
- [x] macOS (DMG + ZIP para Intel e Apple Silicon)
- [x] Linux (AppImage, DEB, RPM)
- [x] Associação de arquivos .md e .markdown

### Informações do App
- [x] Menu About com informações da aplicação e versões

---

## 🚀 Próximos Passos (Alta Prioridade)
*Features essenciais para evoluir de "editor de texto" para "gerenciador de projetos".*

### Gestão de Projetos & Arquivos
- [ ] **Sidebar (File Tree):** Navegação de arquivos e pastas (abrir pasta como projeto)
- [ ] **Gerenciamento de Imagens (Paste):** Interceptar Ctrl+V de imagens, salvar automaticamente na pasta `./assets` e inserir o link Markdown
- [ ] **Busca Global:** Pesquisar texto em todos os arquivos da pasta aberta
- [ ] **Conversão Inteligente ao Colar:** Converter HTML (ex: de sites) para Markdown automaticamente ao colar

### Usabilidade do Editor
- [ ] **Outline/Table of Contents:** Índice flutuante gerado automaticamente a partir dos Headers (H1-H6)
- [ ] **Typewriter Scrolling:** Opção para manter a linha do cursor sempre centralizada verticalmente
- [ ] **Múltiplos Cursores:** Suporte nativo do CodeMirror para edição em várias linhas

---

## 🧠 Em Consideração (Roadmap Futuro)

### Gestão de Conhecimento (PKM)
- [ ] **Wiki-Links:** Suporte a links internos rápidos usando sintaxe `[[Nome do Arquivo]]` com autocomplete
- [ ] **Backlinks:** Visualizar quais arquivos linkam para o documento atual
- [ ] **Suporte a Frontmatter (YAML):** Renderização visual de metadados no topo do arquivo (tags, data, status)

### Inteligência Artificial (BYOK - Bring Your Own Key)
- [ ] **Assistente de Escrita:** Integração com OpenAI/Anthropic (usuário fornece a chave) para resumir, expandir ou corrigir texto
- [ ] **Gerador de Títulos:** Sugestão de nomes de arquivo baseados no conteúdo

### Exportação Avançada
- [ ] **Exportar para DOCX:** Integração com Pandoc para compatibilidade com Word
- [ ] **Exportar para Apresentação:** Converter markdown para slides (Reveal.js)
- [ ] **Copy as Rich Text/HTML:** Copiar conteúdo renderizado para colar em e-mail/Gdocs

### Interface & Customização
- [ ] Minimap lateral para navegação rápida
- [ ] Code folding (dobramento de seções/código)
- [ ] Temas customizáveis (CSS do usuário)
- [ ] Layouts salvos

### Integração
- [ ] **Git Básico:** Indicadores visuais na sidebar (arquivos modificados/novos) - *Sem UI de commit complexa*
- [ ] Publicação direta (WordPress, Medium, Dev.to)
