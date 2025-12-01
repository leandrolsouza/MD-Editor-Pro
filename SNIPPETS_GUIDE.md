# Guia de Snippets - MD Editor Pro

## O que são Snippets?

Snippets são atalhos de texto que permitem inserir rapidamente estruturas markdown comuns. Digite o gatilho (trigger) e pressione **Tab** para expandir o snippet.

## Snippets Integrados

### 1. Bloco de Código - `code`
**Gatilho:** Digite `code` e pressione Tab

**Resultado:**
```
```{{language}}
{{code}}
```
```

**Como usar:**
1. Digite `code` no editor
2. Pressione Tab
3. O texto será substituído pelo template de bloco de código
4. O cursor será posicionado em `{{language}}`
5. Digite a linguagem (ex: javascript, python)
6. Pressione Tab novamente para ir para `{{code}}`
7. Digite seu código

---

### 2. Tabela - `table`
**Gatilho:** Digite `table` e pressione Tab

**Resultado:**
```
| {{header1}} | {{header2}} | {{header3}} |
|------------|------------|------------|
| {{cell1}}   | {{cell2}}   | {{cell3}}   |
```

**Como usar:**
1. Digite `table` e pressione Tab
2. Navegue pelos placeholders com Tab
3. Preencha os cabeçalhos e células

---

### 3. Link - `link`
**Gatilho:** Digite `link` e pressione Tab

**Resultado:**
```
[{{text}}]({{url}})
```

**Como usar:**
1. Digite `link` e pressione Tab
2. Digite o texto do link
3. Pressione Tab
4. Digite a URL

---

### 4. Imagem - `img`
**Gatilho:** Digite `img` e pressione Tab

**Resultado:**
```
![{{alt}}]({{url}})
```

**Como usar:**
1. Digite `img` e pressione Tab
2. Digite o texto alternativo
3. Pressione Tab
4. Digite a URL da imagem

---

### 5. Tarefa - `task`
**Gatilho:** Digite `task` e pressione Tab

**Resultado:**
```
- [ ] {{task}}
```

**Como usar:**
1. Digite `task` e pressione Tab
2. Digite a descrição da tarefa

---

### 6. Citação - `quote`
**Gatilho:** Digite `quote` e pressione Tab

**Resultado:**
```
> {{quote}}
```

**Como usar:**
1. Digite `quote` e pressione Tab
2. Digite o texto da citação

---

## Navegação entre Placeholders

Quando um snippet é expandido e contém múltiplos placeholders (como `{{language}}` e `{{code}}`):

- **Tab**: Move para o próximo placeholder
- **Shift+Tab**: Move para o placeholder anterior

Os placeholders são automaticamente selecionados, então você pode simplesmente começar a digitar para substituí-los.

---

## Exemplos Práticos

### Exemplo 1: Criar um bloco de código JavaScript
```
1. Digite: code
2. Pressione: Tab
3. Digite: javascript
4. Pressione: Tab
5. Digite: console.log('Hello World');
```

**Resultado:**
```javascript
console.log('Hello World');
```

### Exemplo 2: Criar uma lista de tarefas
```
1. Digite: task
2. Pressione: Tab
3. Digite: Implementar SnippetManager
4. Enter (nova linha)
5. Digite: task
6. Pressione: Tab
7. Digite: Testar snippets
```

**Resultado:**
- [ ] Implementar SnippetManager
- [ ] Testar snippets

### Exemplo 3: Inserir um link
```
1. Digite: link
2. Pressione: Tab
3. Digite: GitHub
4. Pressione: Tab
5. Digite: https://github.com
```

**Resultado:**
[GitHub](https://github.com)

---

## Snippets Personalizados (Futuro)

A funcionalidade de criar snippets personalizados está implementada no código, mas a interface de usuário ainda não foi criada. Em breve você poderá:

- Criar seus próprios snippets
- Definir gatilhos personalizados
- Salvar snippets para uso futuro
- Gerenciar snippets personalizados

---

## Dicas

1. **Gatilhos devem ser palavras completas**: Os snippets só expandem quando o gatilho é uma palavra completa (não funciona no meio de uma palavra)

2. **Tab é a tecla mágica**: Sempre use Tab para expandir snippets e navegar entre placeholders

3. **Escape para cancelar**: Se você expandir um snippet por engano, pressione Ctrl+Z para desfazer

4. **Funciona em qualquer lugar**: Você pode usar snippets em qualquer parte do documento

---

## Teste Agora!

Experimente digitar os seguintes gatilhos seguidos de Tab:

- `code`
- `table`
- `link`
- `img`
- `task`
- `quote`

Divirta-se escrevendo markdown mais rápido! 🚀
