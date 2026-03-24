/**
 * Portuguese (Brazil) translations
 */

module.exports = {
    meta: {
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        code: 'pt-BR'
    },

    // Context Menu
    contextMenu: {
        cut: 'Cortar',
        copy: 'Copiar',
        paste: 'Colar',
        undo: 'Desfazer',
        redo: 'Refazer',
        selectAll: 'Selecionar Tudo',
        bold: 'Negrito',
        italic: 'Itálico',
        strikethrough: 'Tachado',
        insert: 'Inserir',
        insertLink: 'Inserir Link',
        insertImage: 'Inserir Imagem',
        insertTable: 'Inserir Tabela',
        codeBlock: 'Bloco de Código'
    },

    // Menu Bar
    menu: {
        file: 'Arquivo',
        edit: 'Editar',
        view: 'Visualizar',
        format: 'Formatar',
        help: 'Ajuda',
        newFile: 'Novo Arquivo',
        open: 'Abrir',
        openFolder: 'Abrir Pasta',
        openRecent: 'Abrir Recente',
        save: 'Salvar',
        saveAs: 'Salvar Como',
        saveAll: 'Salvar Todos',
        export: 'Exportar',
        exportHTML: 'Exportar como HTML',
        exportPDF: 'Exportar como PDF',
        close: 'Fechar',
        closeFolder: 'Fechar Pasta',
        exit: 'Sair'
    },

    // Editor
    editor: {
        untitled: 'Sem Título',
        modified: 'Modificado',
        lineNumber: 'Linha {line}',
        columnNumber: 'Coluna {column}'
    },

    // Search
    search: {
        find: 'Buscar',
        replace: 'Substituir',
        findPlaceholder: 'Buscar...',
        replacePlaceholder: 'Substituir...',
        replaceAll: 'Substituir Todos',
        matchCase: 'Diferenciar Maiúsculas',
        wholeWord: 'Palavra Inteira',
        useRegex: 'Usar Regex',
        noResults: 'Sem resultados',
        resultsCount: '{current} de {total}',
        previous: 'Anterior',
        next: 'Próximo'
    },

    // Tabs
    tabs: {
        closeTab: 'Fechar aba',
        closeOthers: 'Fechar Outras',
        closeAll: 'Fechar Todas',
        closeSaved: 'Fechar Salvas'
    },

    // Dialogs
    dialogs: {
        unsavedChanges: 'Alterações Não Salvas',
        unsavedMessage: 'Deseja salvar as alterações em "{filename}"?',
        save: 'Salvar',
        dontSave: 'Não Salvar',
        cancel: 'Cancelar',
        ok: 'OK',
        yes: 'Sim',
        no: 'Não',
        close: 'Fechar'
    },

    // Statistics / Status Bar
    statistics: {
        words: 'Palavras',
        characters: 'Caracteres',
        readingTime: 'Tempo de leitura',
        minutes: '{count} min'
    },

    // Settings
    settings: {
        title: 'Configurações',
        general: 'Geral',
        editor: 'Editor',
        appearance: 'Aparência',
        language: 'Idioma',
        theme: 'Tema',
        fontSize: 'Tamanho da Fonte',
        lineNumbers: 'Mostrar Números de Linha',
        wordWrap: 'Quebra de Linha',
        autoSave: 'Salvamento Automático',
        autoSaveInterval: 'Intervalo de Salvamento',
        aiAutocomplete: {
            title: 'Autocomplete com IA',
            configure: 'Configurar Autocomplete',
            enabled: 'Habilitar Autocomplete com IA',
            enabledDescription: 'Sugere continuação do texto enquanto você escreve usando IA',
            debounce: 'Atraso (ms)',
            debounceDescription: 'Tempo de espera após parar de digitar antes de solicitar sugestão',
            minChars: 'Caracteres mínimos',
            minCharsDescription: 'Quantidade mínima de texto antes de ativar o autocomplete',
            tabHint: 'Aceitar sugestão',
            escHint: 'Dispensar sugestão',
            notice: 'Nota',
            noticeText: 'O autocomplete usa a mesma configuração de IA do painel de chat (OpenAI ou servidor local).',
            failedToSave: 'Falha ao salvar configurações'
        }
    },

    // Templates
    templates: {
        title: 'Modelos',
        insert: 'Inserir Modelo',
        create: 'Criar Modelo',
        edit: 'Editar Modelo',
        delete: 'Excluir',
        name: 'Nome do Modelo',
        namePlaceholder: 'Meu Modelo',
        content: 'Conteúdo do Modelo',
        contentPlaceholder: 'Digite o conteúdo do modelo. Use {{placeholder}} para marcadores.',
        category: 'Categoria',
        categoryPlaceholder: 'personalizado',
        description: 'Descrição',
        descriptionPlaceholder: 'Descrição do modelo',
        noTemplates: 'Nenhum modelo encontrado',
        noDescription: 'Sem descrição',
        all: 'Todos',
        saveTemplate: 'Salvar Modelo',
        insertMode: 'Modo Inserir',
        replaceMode: 'Modo Substituir',
        createdSuccessfully: 'Modelo criado com sucesso!',
        failedToCreate: 'Falha ao criar modelo',
        failedToDelete: 'Falha ao excluir modelo',
        nameAndContentRequired: 'Nome e conteúdo são obrigatórios'
    },

    // Theme Selector
    themeSelector: {
        title: 'Selecionar Tema',
        close: 'Fechar seletor de tema'
    },

    // Notifications
    notifications: {
        fileSaved: 'Arquivo salvo com sucesso',
        fileSaveFailed: 'Falha ao salvar arquivo',
        exportSuccess: 'Exportação concluída com sucesso',
        exportFailed: 'Falha na exportação',
        copySuccess: 'Copiado para a área de transferência',
        error: 'Ocorreu um erro',
        // File operations
        failedToOpenFile: 'Falha ao abrir arquivo',
        failedToCreateFile: 'Falha ao criar novo arquivo',
        failedToSaveFiles: 'Falha ao salvar arquivos',
        failedToLoadFile: 'Falha ao carregar arquivo',
        noModifiedFiles: 'Nenhum arquivo modificado para salvar.',
        successfullySavedFiles: '{count} arquivo(s) salvo(s) com sucesso.',
        savedWithErrors: '{count} arquivo(s) salvo(s).\n\nErros:\n{errors}',
        // Export
        successfullyExportedHTML: 'Exportado para HTML com sucesso',
        successfullyExportedPDF: 'Exportado para PDF com sucesso',
        failedToExportHTML: 'Falha ao exportar para HTML',
        failedToExportPDF: 'Falha ao exportar para PDF',
        // Folder operations
        failedToOpenFolder: 'Falha ao abrir pasta',
        failedToCloseFolder: 'Falha ao fechar pasta',
        // Other
        failedToToggleOutline: 'Falha ao alternar painel de estrutura',
        failedToToggleTypewriter: 'Falha ao alternar modo máquina de escrever',
        failedToToggleLineNumbers: 'Falha ao alternar números de linha',
        failedToCreateTab: 'Falha ao criar aba',
        failedToSwitchTab: 'Falha ao trocar de aba',
        failedToCloseTab: 'Falha ao fechar aba',
        failedToInsertTemplate: 'Falha ao inserir modelo',
        failedToInitialize: 'Falha ao inicializar aplicação',
        pleaseDropMarkdown: 'Por favor, solte um arquivo markdown (.md ou .markdown)',
        tryAgain: 'Por favor, tente novamente.',
        failedToSaveSettings: 'Falha ao salvar configurações'
    },

    // Update Notifications
    updates: {
        available: 'Atualização Disponível',
        newVersion: 'Uma nova versão ({version}) está disponível!',
        downloading: 'Baixando Atualização',
        downloadProgress: 'Baixando... {percent}%',
        ready: 'Atualização Pronta',
        readyMessage: 'Atualização baixada. Reinicie para aplicar.',
        restartNow: 'Reiniciar Agora',
        later: 'Mais Tarde',
        download: 'Baixar',
        dismiss: 'Dispensar',
        error: 'Erro na Atualização',
        errorMessage: 'Falha ao baixar atualização. Tente novamente mais tarde.',
        upToDate: 'Atualizado',
        upToDateMessage: 'Você está usando a versão mais recente.'
    },

    // Focus Mode
    focusMode: {
        enabled: 'Modo foco ativado',
        disabled: 'Modo foco desativado',
        exitHint: 'Pressione <kbd>Esc</kbd> para sair do modo foco'
    },

    // Formatting Toolbar
    formatting: {
        bold: 'Negrito',
        italic: 'Itálico',
        strikethrough: 'Tachado',
        heading: 'Título {level}',
        bulletList: 'Lista com Marcadores',
        numberedList: 'Lista Numerada',
        taskList: 'Lista de Tarefas',
        blockquote: 'Citação',
        code: 'Código Inline',
        codeBlock: 'Bloco de Código',
        link: 'Inserir Link',
        image: 'Inserir Imagem',
        table: 'Inserir Tabela',
        horizontalRule: 'Linha Horizontal',
        indent: 'Aumentar Recuo',
        outdent: 'Diminuir Recuo',
        clearFormat: 'Limpar Formatação'
    },

    // File Tree
    fileTree: {
        openFolder: 'Abrir Pasta',
        newFile: 'Novo Arquivo',
        newFolder: 'Nova Pasta',
        rename: 'Renomear',
        delete: 'Excluir',
        refresh: 'Atualizar',
        collapseAll: 'Recolher Tudo',
        noFolder: 'Nenhuma pasta aberta'
    },

    // Outline Panel
    outline: {
        title: 'Estrutura',
        noHeadings: 'Nenhum título encontrado'
    },

    // Global Search
    globalSearch: {
        title: 'Pesquisar em Arquivos',
        placeholder: 'Pesquisar...',
        noResults: 'Nenhum resultado encontrado',
        searching: 'Pesquisando...',
        searchError: 'Erro na pesquisa',
        enterSearchTerm: 'Digite um termo de pesquisa',
        resultsInFiles: '{matches} resultado(s) em {files} arquivo(s)',
        results: '{count} resultado(s)'
    },

    // About
    about: {
        title: 'Sobre o MD Editor Pro',
        version: 'Versão {version}',
        description: 'Um editor de markdown moderno'
    },

    // Common Actions
    actions: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        create: 'Criar',
        close: 'Fechar',
        apply: 'Aplicar',
        reset: 'Redefinir',
        confirm: 'Confirmar',
        done: 'Concluído',
        test: 'Testar',
        refresh: 'Atualizar',
        loading: 'Carregando...'
    },

    // Activity Bar
    activityBar: {
        explorer: 'Explorador',
        search: 'Pesquisar',
        outline: 'Estrutura',
        templates: 'Modelos',
        snippets: 'Snippets',
        settings: 'Configurações',
        aiAssistant: 'Assistente IA',
        closeSidebar: 'Fechar Barra Lateral'
    },

    // Keyboard Shortcuts
    shortcuts: {
        title: 'Atalhos de Teclado',
        searchPlaceholder: 'Pesquisar atalhos...',
        resetAll: 'Redefinir Todos para Padrão',
        reset: 'Redefinir',
        pressKeys: 'Pressione as teclas...',
        reassign: 'Reatribuir',
        conflictMessage: 'O atalho "{shortcut}" já está atribuído a "{action}".\n\nDeseja reatribuí-lo?',
        resetAllConfirm: 'Tem certeza de que deseja redefinir todos os atalhos de teclado para os valores padrão?'
    },

    // Auto-Save Settings
    autoSaveSettings: {
        title: 'Configurações de Salvamento Automático',
        enable: 'Ativar Salvamento Automático',
        enableDescription: 'Salvar automaticamente seu documento após um período de inatividade',
        delay: 'Intervalo de Salvamento',
        delayDescription: 'Tempo de espera após parar de digitar antes de salvar automaticamente (1-60 segundos)',
        seconds: 'segundos',
        info: 'O salvamento automático só funciona quando um arquivo foi salvo pelo menos uma vez. Novos documentos não salvos devem ser salvos manualmente primeiro.',
        invalidDelay: 'Intervalo inválido. Digite um número entre 1 e 60.'
    },

    // Image Paste Settings
    imagePasteSettings: {
        title: 'Configurações de Colagem de Imagem',
        enable: 'Ativar colagem automática de imagem',
        enableDescription: 'Quando ativado, colar imagens da área de transferência (Ctrl+V) salvará automaticamente na pasta de assets e inserirá links markdown.',
        assetsFolder: 'Caminho da Pasta de Assets:',
        assetsFolderDescription: 'Caminho relativo ao arquivo markdown onde as imagens serão salvas. A pasta será criada automaticamente se não existir.',
        failedToSave: 'Falha ao salvar configurações'
    },

    // Advanced Markdown Settings
    advancedMarkdown: {
        title: 'Recursos Avançados de Markdown',
        description: 'Ative ou desative recursos avançados de markdown. As alterações entram em vigor imediatamente.',
        mermaid: 'Diagramas Mermaid',
        mermaidDescription: 'Renderizar diagramas usando sintaxe Mermaid em blocos de código',
        katex: 'Fórmulas Matemáticas (KaTeX)',
        katexDescription: 'Renderizar expressões matemáticas LaTeX usando delimitadores $',
        callouts: 'Blocos de Destaque',
        calloutsDescription: 'Exibir blocos de destaque estilizados para notas, avisos e dicas'
    },

    // Snippets
    snippets: {
        title: 'Snippets',
        trigger: 'Gatilho',
        description: 'Descrição',
        content: 'Conteúdo',
        builtIn: 'Integrado',
        custom: 'Personalizado',
        create: 'Criar Snippet',
        edit: 'Editar Snippet',
        delete: 'Excluir Snippet',
        noSnippets: 'Nenhum snippet encontrado',
        triggerPlaceholder: 'ex: code',
        descriptionPlaceholder: 'Descrição do snippet',
        contentPlaceholder: 'Conteúdo do snippet com {{placeholders}}'
    },

    // Preview
    preview: {
        error: 'Erro na Visualização',
        unknownError: 'Ocorreu um erro desconhecido'
    },

    // Auto-Save Status
    autoSaveStatus: {
        saving: 'Salvando...',
        savingTitle: 'Salvando documento automaticamente',
        saved: 'Salvo',
        savedTitle: 'Documento salvo com sucesso',
        error: 'Erro ao Salvar',
        errorTitle: 'Falha ao salvar documento'
    },

    // Code Block Dialog
    codeBlock: {
        selectLanguage: 'Selecionar Linguagem',
        insert: 'Inserir'
    },

    // AI Chat
    aiChat: {
        title: 'Assistente IA',
        placeholder: 'Pergunte algo...',
        send: 'Enviar',
        clear: 'Limpar chat',
        settings: 'Configurações',
        thinking: 'Pensando...',
        welcome: 'Olá! Sou seu assistente de escrita com IA.',
        welcomeHint: 'Pergunte qualquer coisa sobre seu documento, ou peça ajuda com escrita, formatação ou ideias. Você também pode pedir para editar ou gerar conteúdo diretamente!',
        error: 'Ocorreu um erro. Tente novamente.',
        apiKeyMissing: 'Configure sua chave de API nas configurações.',
        copy: 'Copiar',
        copied: 'Copiado!',
        // Content generation
        contentGenerated: 'Conteúdo gerado',
        applyToEditor: 'Aplicar no editor',
        apply: 'Aplicar',
        applied: 'Aplicado!',
        dismiss: 'Dispensar',
        contentApplied: 'Conteúdo aplicado no editor',
        applyReplace: 'Substituir documento',
        applyInsert: 'Inserir no cursor',
        applyAppend: 'Adicionar ao final',
        applySelection: 'Substituir seleção'
    },

    // AI Settings
    aiSettings: {
        title: 'Configurações de IA',
        provider: 'Provedor',
        providerOpenAI: 'OpenAI',
        providerLocal: 'Servidor Local (LM Studio, Ollama, etc.)',
        openaiApiKey: 'Chave de API OpenAI',
        openaiApiKeyHint: 'Sua chave de API é armazenada localmente e nunca compartilhada.',
        model: 'Modelo',
        serverUrl: 'URL do Servidor',
        apiKeyOptional: 'Chave de API (opcional)',
        apiKeyOptionalHint: 'Necessária se seu servidor tiver autenticação habilitada.',
        testingConnection: 'Testando conexão...',
        connectedSuccessfully: 'Conectado com sucesso!',
        connectionFailed: 'Falha na conexão',
        defaultModel: 'Modelo Padrão',
        defaultModelFromServer: 'Modelo Padrão (do servidor)',
        refreshModels: 'Atualizar Modelos',
        gpt4oMini: 'GPT-4o Mini (Rápido e Acessível)',
        gpt4o: 'GPT-4o (Mais Capaz)',
        gpt4Turbo: 'GPT-4 Turbo',
        gpt35Turbo: 'GPT-3.5 Turbo (Legado)'
    },

    // Panels
    panels: {
        templateComingSoon: 'Painel de modelos em breve...',
        snippetComingSoon: 'Painel de snippets em breve...'
    },

    // Typewriter Scrolling
    typewriter: {
        enabled: 'Rolagem máquina de escrever ativada',
        disabled: 'Rolagem máquina de escrever desativada'
    },

    // AI Edit Commands
    aiEdit: {
        title: 'Edição IA',
        textTransformed: 'Texto transformado com sucesso',
        failedToTransform: 'Falha ao transformar texto',
        processing: 'Processando...',
        // Commands
        rewrite: 'Reescrever',
        rewriteHint: 'Melhorar clareza',
        fixGrammar: 'Corrigir Gramática',
        fixGrammarHint: 'Corrigir erros',
        summarize: 'Resumir',
        summarizeHint: 'Tornar mais curto',
        expand: 'Expandir',
        expandHint: 'Adicionar detalhes',
        makeFormal: 'Tornar Formal',
        makeFormalHint: 'Tom profissional',
        makeCasual: 'Tornar Casual',
        makeCasualHint: 'Tom amigável',
        translate: 'Traduzir',
        translateHint: 'Para outro idioma',
        custom: 'Personalizado...',
        customHint: 'Sua instrução',
        // Dialogs
        translateTo: 'Traduzir para',
        customInstruction: 'Instrução Personalizada',
        customPlaceholder: 'Digite sua instrução para a IA...',
        cancel: 'Cancelar',
        apply: 'Aplicar'
    }
};
