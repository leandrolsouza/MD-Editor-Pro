# Documentação dos Cálculos — Simulador MCMV 2026

Documento técnico descrevendo todas as regras de negócio, fórmulas e constantes utilizadas no motor de cálculo do simulador de financiamento habitacional Minha Casa Minha Vida (MCMV) 2026.

Referência: regras da Caixa Econômica Federal, Conselho Curador do FGTS e legislação vigente.

---

## 1. Enquadramento em Faixas de Renda

O programa MCMV possui dois eixos de enquadramento independentes:
- Enquadramento por **renda bruta familiar mensal**
- Enquadramento por **valor do imóvel**

O enquadramento resultante é sempre o **MAIOR** (mais restritivo) dos dois. Exemplo: se o cliente é Faixa 2 pela renda, mas o valor do imóvel se enquadra na Faixa 3, o resultado é Faixa 3 — e a taxa de juros aplicada será a da Faixa 3.

### 1.1 Tabela de Subfaixas (por renda)

| Subfaixa       | Grupo | Renda mínima (R$) | Renda máxima (R$) |
|----------------|-------|-------------------:|-------------------:|
| G1_A           | G1    |              0,01  |          2.160,00  |
| G1_B           | G1    |          2.160,01  |          2.850,00  |
| G1_B_SUPERIOR  | G1    |          2.850,01  |          3.200,00  |
| G2_A           | G2    |          3.200,01  |          3.500,00  |
| G2_B           | G2    |          3.500,01  |          4.000,00  |
| G2_C           | G2    |          4.000,01  |          5.000,00  |
| G3             | G3    |          5.000,01  |          9.600,00  |
| G4             | G4    |          9.600,01  |         13.000,00  |

Renda máxima do programa: **R$ 13.000,00**.

### 1.2 Tabela de Enquadramento por Valor do Imóvel

| Grupo | Valor máximo do imóvel (R$) |
|-------|----------------------------:|
| G1    |                  190.000    |
| G2    |                  264.000    |
| G3    |                  400.000    |
| G4    |                  600.000    |

### 1.3 Lógica de Enquadramento Resultante

```
1. grupoRenda  = enquadrar pela renda bruta (tabela 1.1)
2. grupoValor  = enquadrar pelo valor do imóvel (tabela 1.2)
3. grupoResultante = max(grupoRenda, grupoValor)
```

Exemplo prático:
- Renda R$ 3.500 → G2_B (Grupo G2)
- Imóvel R$ 350.000 → Grupo G3 (> 264k, ≤ 400k)
- Resultado: **G3** → taxa de juros do G3

Se a renda não se enquadra em nenhuma subfaixa, a simulação retorna alerta `nao_enquadrado`.

---

## 2. Taxas de Juros

As taxas de juros anuais variam conforme três fatores:
- **Subfaixa** do comprador
- **Condição de cotista FGTS** (mínimo 3 anos de contribuição)
- **Região geográfica** do imóvel

### 2.1 Regiões de Taxa

As 5 regiões geográficas são agrupadas em 2 regiões de taxa:

| Região geográfica | Região de taxa              |
|--------------------|-----------------------------|
| Norte              | NORTE_NORDESTE              |
| Nordeste           | NORTE_NORDESTE              |
| Sudeste            | SUL_SUDESTE_CENTRO_OESTE    |
| Sul                | SUL_SUDESTE_CENTRO_OESTE    |
| Centro-Oeste       | SUL_SUDESTE_CENTRO_OESTE    |

### 2.2 Tabela de Taxas (% ao ano)

| Subfaixa       | N/NE Cotista | N/NE Não Cotista | S/SE/CO Cotista | S/SE/CO Não Cotista |
|----------------|:------------:|:----------------:|:---------------:|:-------------------:|
| G1_A           |    4,00      |      4,50        |      4,25       |        4,75         |
| G1_B           |    4,25      |      4,75        |      4,50       |        5,00         |
| G1_B_SUPERIOR  |    4,50      |      5,00        |      4,75       |        5,25         |
| G2_A           |    4,75      |      5,25        |      5,25       |        5,50         |
| G2_B           |    5,50      |      6,00        |      5,50       |        6,00         |
| G2_C           |    6,50      |      7,00        |      6,50       |        7,00         |
| G3             |    7,66      |      8,16        |      7,66       |        8,16         |
| G4             |   10,00      |     10,00        |     10,00       |       10,00         |

### 2.3 Conversão de Taxa Anual para Mensal

A taxa mensal equivalente é calculada por juros compostos:

```
taxaMensal = (1 + taxaAnual / 100) ^ (1/12) - 1
```

Exemplo: 8,16% a.a. → (1,0816)^(1/12) - 1 ≈ 0,006554 (0,6554% a.m.)

### 2.4 Taxa Efetiva pelo Duplo Enquadramento

A taxa de juros é determinada pela subfaixa efetiva, que resulta do duplo enquadramento:

- Se o grupo resultante (renda × valor) é maior que o grupo de renda, a taxa aplicada é a da subfaixa mínima do grupo resultante
- Exemplo: renda G2_B + valor G3 → taxa do G3 (cotista/não cotista conforme região)

Arquivo: `src/logic/taxaJuros.ts` → `obterTaxaJuros()`

---

## 3. Subsídio (Desconto Complemento)

O subsídio reduz o valor a ser financiado. É calculado por uma curva quadrática ajustada por índice IBGE regional.

### 3.1 Elegibilidade

- Somente grupos G1 e G2 têm direito a subsídio (pelo grupo resultante do duplo enquadramento)
- Se o grupo resultante é G3 ou G4 (mesmo que a renda seja G1/G2), **sem subsídio**
- Renda bruta > R$ 4.700: **sem subsídio** (retorna 0)

### 3.2 Fórmula Completa

```
1. rendaAjustada = clamp(rendaBruta, 1750, 3700)
   → min(max(rendaBruta, 1750), 3700)

2. descontoBase = a × rendaAjustada² + b × rendaAjustada
   onde: a = 0,0126496 ; b = -49,33

3. descontoBase = clamp(descontoBase, 1900, 50000)

4. indiceIBGE = tabela por UF (ver seção 3.3)

5. dcMaximo = 65.000 (região Norte) ou 55.000 (demais regiões)

6. subsidioFinal = min(descontoBase × (1 + indiceIBGE / 100), dcMaximo)

7. subsidioFinal = max(subsidioFinal, 1500) (mínimo por cliente)

8. subsidioFinal = min(subsidioFinal, valorImovel)
   subsidioFinal = max(subsidioFinal, 0)
```

O subsídio máximo é **R$ 65.000** na região Norte e **R$ 55.000** nas demais regiões.

### 3.3 Índice Despesa-Renda IBGE por UF (%)

| UF | Índice | UF | Índice | UF | Índice | UF | Índice |
|----|-------:|----|-------:|----|-------:|----|-------:|
| DF |   7,2  | RJ |  -1,8  | SP |   2,1  | ES |  -5,1  |
| MG |  -5,7  | PR |  -5,1  | SC |   4,6  | RS |  -1,1  |
| MS |  -3,5  | MT |  -0,1  | GO |  -0,7  | RO | -10,0  |
| AC |   3,4  | AM |   0,6  | RR |  -4,8  | PA |   5,5  |
| AP |  10,0  | TO |  -3,2  | MA |   0,7  | PI |  -8,1  |
| CE |  -7,9  | RN |   0,6  | PB |  -6,8  | PE |  -5,3  |
| AL |  -8,1  | SE |  -6,2  | BA |  -5,0  |    |        |

### 3.4 Exemplo Numérico

Renda R$ 2.000, UF = AP (índice 10,0%), região Norte, grupo resultante G1:

```
rendaAjustada = clamp(2000, 1750, 3700) = 2000
descontoBase  = 0,0126496 × 2000² + (-49,33) × 2000
              = 0,0126496 × 4.000.000 - 98.660
              = 50.598,40 - 98.660 = -48.061,60
descontoBase  = clamp(-48.061,60, 1900, 50000) = 1.900
subsidio      = min(1900 × 1,10, 65000) = 2.090
subsidio      = max(2.090, 1500) = 2.090,00
```

Renda R$ 1.750 (mínima), UF = AP, região Norte, grupo resultante G1:

```
rendaAjustada = 1750
descontoBase  = 0,0126496 × 1750² + (-49,33) × 1750
              = 0,0126496 × 3.062.500 - 86.327,50
              = 38.737,00 - 86.327,50 = -47.590,50
descontoBase  = clamp(-47.590,50, 1900, 50000) = 1.900
subsidio      = min(1900 × 1,10, 65000) = 2.090
subsidio      = max(2.090, 1500) = 2.090,00
```

Arquivo: `src/logic/subsidio.ts` → `calcularSubsidio()`

---

## 4. Limite de Valor do Imóvel por Município

Cada município possui limites de valor de imóvel que variam conforme o grupo de faixa e o recorte urbano (A1, A2, B1, B2).

### 4.1 Regra de Seleção do Limite

| Grupo    | Condição                  | Limite utilizado          |
|----------|---------------------------|---------------------------|
| G1 ou G2 | renda ≤ R$ 5.000          | `limiteFaixaG1G2`         |
| G1 ou G2 | renda > R$ 5.000          | `limiteFaixaAcima5000`    |
| G3       | —                         | `limiteFaixaG3` (R$ 400.000) |
| G4       | —                         | `limiteFaixaG4` (R$ 600.000) |

### 4.2 Limites por Recorte Urbano (G1/G2)

| Recorte | Exemplos de cidades                          | Limite G1/G2 (R$) |
|---------|----------------------------------------------|-----------------:|
| A1      | São Paulo, Rio de Janeiro, Brasília           |        275.000   |
| A1      | Belo Horizonte, Salvador, Curitiba, Goiânia   |        270.000   |
| A2      | Campinas, Guarulhos, Natal, Campo Grande      |        265.000   |
| B1      | Contagem, Sorocaba, Londrina, Teresina        |        250.000   |
| B2      | Uberlândia, Anápolis, Canoas                  |        240.000   |

Se o valor do imóvel excede o limite do município, a simulação gera alerta `limite_imovel`.

Arquivo: `src/logic/municipios.ts` → `obterLimiteImovel()`

---

## 5. Ajuste de Prazo por Idade

O prazo do financiamento é limitado para que a idade do comprador ao final do contrato não exceda **80 anos e 6 meses**.

### 5.1 Fórmula

```
idadeEmAnos = (dataReferencia - dataNascimento) / (365,25 dias)

Se idadeEmAnos + (prazoMeses / 12) > 80,5:
    anosDisponiveis = 80,5 - idadeEmAnos
    prazoAjustado = floor(anosDisponiveis × 12)
```

### 5.2 Limites de Prazo

- Prazo mínimo: **120 meses** (10 anos)
- Prazo máximo: **420 meses** (35 anos)

Arquivo: `src/logic/idadePrazo.ts` → `ajustarPrazo()`

---

## 6. Valor Financiado e LTV

### 6.1 Cálculo do Valor Financiado

```
valorSemLTV = valorImovel - valorEntrada - subsidio
valorLTV    = valorImovel × 0,80
valorFinanciado = min(valorSemLTV, valorLTV)
```

O LTV (Loan-to-Value) máximo é **80%** do valor do imóvel.

Se `valorSemLTV > valorLTV`, a simulação gera alerta `ltv_limitado`.
Se `valorFinanciado <= 0`, gera alerta `sem_financiamento`.

---

## 7. Seguros Obrigatórios

Dois seguros são cobrados mensalmente sobre o saldo devedor.

### 7.1 Seguro MIP (Morte e Invalidez Permanente)

A alíquota varia conforme a faixa etária do comprador:

| Idade (anos) | Alíquota (%) |
|:------------:|:------------:|
|   18 – 25    |   0,00930    |
|   26 – 30    |   0,00960    |
|   31 – 35    |   0,01160    |
|   36 – 40    |   0,01540    |
|   41 – 45    |   0,02520    |
|   46 – 50    |   0,03860    |
|   51 – 55    |   0,06760    |
|   56 – 60    |   0,15330    |
|   61 – 65    |   0,27310    |
|   66 – 70    |   0,32590    |
|   71 – 75    |   0,48940    |
|   76 – 80    |   0,53120    |

```
seguroMIP = saldoDevedor × (aliquotaMIP / 100)
```

### 7.2 Seguro DFI (Danos Físicos ao Imóvel)

Alíquota fixa: **0,00710%**

```
seguroDFI = saldoDevedor × (0,00710 / 100)
```

Arquivo: `src/logic/seguros.ts`

---

## 8. Taxa Administrativa

| Condição                        | Valor mensal |
|---------------------------------|:------------:|
| Renda ≤ R$ 3.200 (Faixa G1)    |   R$ 0,00    |
| Renda > R$ 3.200 (demais)      |  R$ 25,00    |

---

## 9. Cálculo de Parcelas

O simulador suporta dois sistemas de amortização: SAC e PRICE.

### 9.1 Sistema SAC (Sistema de Amortização Constante)

A amortização é fixa; os juros diminuem a cada mês.

```
amortizacao = valorFinanciado / prazoMeses

Para cada mês k (de 0 a prazoMeses - 1):
    saldoDevedor = valorFinanciado - k × amortizacao
    juros        = saldoDevedor × taxaMensal
    seguroMIP    = saldoDevedor × (aliquotaMIP / 100)
    seguroDFI    = saldoDevedor × (0,00710 / 100)
    parcela      = amortizacao + juros + seguroMIP + seguroDFI + taxaAdministrativa
```

A primeira parcela é a mais alta; a última é a mais baixa.

### 9.2 Sistema PRICE (Tabela Price)

A parcela base (amortização + juros) é fixa ao longo do contrato.

```
fator = (1 + taxaMensal) ^ prazoMeses
parcelaBase = valorFinanciado × (taxaMensal × fator) / (fator - 1)

Para cada mês k (de 0 a prazoMeses - 1):
    juros        = saldoDevedor × taxaMensal
    amortizacao  = parcelaBase - juros
    seguroMIP    = saldoDevedor × (aliquotaMIP / 100)
    seguroDFI    = saldoDevedor × (0,00710 / 100)
    parcela      = parcelaBase + seguroMIP + seguroDFI + taxaAdministrativa
    saldoDevedor = saldoDevedor - amortizacao
```

### 9.3 Composição da Primeira Parcela

A primeira parcela é decomposta em:

| Componente          | Descrição                                    |
|---------------------|----------------------------------------------|
| Amortização         | Redução do saldo devedor                     |
| Juros               | Juros sobre o saldo devedor                  |
| Seguro MIP          | Seguro de morte e invalidez                  |
| Seguro DFI          | Seguro de danos físicos ao imóvel            |
| Taxa administrativa | R$ 0 ou R$ 25 conforme renda                 |
| **Total**           | Soma de todos os componentes                 |

### 9.4 Custo Total

O custo total é a soma de todas as parcelas ao longo do prazo:

```
custoTotal = Σ parcela[k] para k de 0 a prazoMeses - 1
```

Arquivo: `src/logic/parcelas.ts`

---

## 10. Capacidade de Financiamento

Calcula o valor máximo que o comprador pode financiar com base no comprometimento de renda.

### 10.1 Fórmula (baseada em PRICE)

```
parcelaMaxima = rendaBruta × condicionamento

fator = (1 + taxaMensal) ^ prazoMeses

capacidade = parcelaMaxima × (fator - 1) / (taxaMensal × fator)
```

O condicionamento padrão é **30%** (0,30), podendo variar de 1% a 50%.

### 10.2 Comprometimento de Renda

```
comprometimentoRenda = (primeiraParcela / rendaBruta) × 100
```

Se a primeira parcela excede `rendaBruta × condicionamento`, gera alerta `comprometimento_renda`.

Arquivo: `src/logic/capacidade.ts`

---

## 11. Custos Adicionais

### 11.1 Custos de Documentação

```
custosDocumentacao = valorImovel × 0,05 (5%)
```

### 11.2 Recursos Próprios

```
recursosProprios = valorEntrada + custosDocumentacao
```

### 11.3 Custo Total de Aquisição

```
custoTotalAquisicao = custoTotal + recursosProprios
```

---

## 12. Fluxo Completo da Simulação

O motor de cálculo (`executarSimulacao`) executa os passos na seguinte ordem:

```
 1. Enquadrar por RENDA (subfaixa → grupo)
 2. Enquadrar por VALOR DO IMÓVEL (grupo)
 3. Grupo resultante = o MAIOR dos dois
 4. Subfaixa efetiva para taxa de juros
 5. Buscar município pelo código IBGE
 6. Obter limite de imóvel do município (usando grupo resultante)
 7. Verificar se valor do imóvel excede o limite → alerta
 8. Calcular subsídio (elegível somente se grupo resultante é G1 ou G2)
 9. Obter taxa de juros pela subfaixa efetiva
10. Verificar se taxa foi ajustada pelo duplo enquadramento → alerta
11. Ajustar prazo por idade → alerta se ajustado
12. Calcular valor financiado com LTV
13. Verificar LTV → alerta se limitado
14. Verificar se há financiamento necessário
15. Determinar taxa administrativa
16. Calcular idade para seguros
17. Converter taxa anual para mensal
18. Calcular parcelas (SAC ou PRICE) com seguros
19. Calcular capacidade de financiamento
20. Calcular comprometimento de renda → alerta se excede
21. Calcular custos de documentação e recursos próprios
22. Calcular custo total de aquisição
23. Retornar resultado completo com alertas
```

Arquivo: `src/logic/motorCalculo.ts` → `executarSimulacao()`

---

## 13. Alertas

O simulador pode gerar os seguintes alertas:

| Tipo                      | Quando ocorre                                                        |
|---------------------------|----------------------------------------------------------------------|
| `nao_enquadrado`          | Renda fora das faixas do programa (< R$ 0,01 ou > R$ 13.000)        |
| `municipio_nao_encontrado`| Código IBGE não encontrado na base de dados                         |
| `limite_imovel`           | Valor do imóvel excede o limite do município                         |
| `taxa_ajustada`           | Taxa de juros foi elevada por override (imóvel > R$ 400k + renda)   |
| `prazo_ajustado`          | Prazo reduzido para respeitar limite de 80 anos e 6 meses           |
| `ltv_limitado`            | Financiamento limitado a 80% do valor do imóvel                     |
| `sem_financiamento`       | Entrada + subsídio cobrem o valor do imóvel                          |
| `comprometimento_renda`   | Parcela excede o percentual de condicionamento da renda              |

---

## 14. Validação de Entrada

Antes da simulação, os dados de entrada são validados:

| Campo               | Regra                                              |
|---------------------|----------------------------------------------------|
| `regiao`            | Obrigatório, deve ser uma das 5 regiões válidas    |
| `uf`                | Obrigatório, deve ser uma das 27 UFs               |
| `codigoIBGE`        | Obrigatório, deve existir na base de municípios     |
| `rendaBruta`        | Deve ser > 0                                        |
| `valorImovel`       | Deve ser > 0                                        |
| `valorEntrada`      | Deve ser >= 0 e < valorImovel                       |
| `prazoMeses`        | Entre 120 e 420 meses                               |
| `dataNascimento`    | Obrigatório, comprador deve ter >= 18 anos          |
| `sistemaAmortizacao`| Deve ser "SAC" ou "PRICE"                           |
| `condicionamento`   | Entre 0,01 (1%) e 0,50 (50%)                       |
| `areaUtil`          | Se informado, não pode ser negativo                 |

Arquivo: `src/logic/validacao.ts` → `validarEntrada()`

---

## 15. Referências Normativas

- Conselho Curador do FGTS — aprovação de 24/03/2026 (novos limites de renda e imóvel)
- Caixa Econômica Federal — taxas de juros entre 4,00% e 10,00% a.a.
- Lei 14.620/2023 — marco legal do programa MCMV
- Portaria MCID nº 1.248/2023 — regulamentação do programa

  

Documento técnico descrevendo todas as regras de negócio, fórmulas e constantes utilizadas no motor de cálculo do simulador de financiamento habitacional Minha Casa Minha Vida (MCMV) 2026.

  

Referência: regras da Caixa Econômica Federal, Conselho Curador do FGTS e legislação vigente.

  

\---

  

## 1. Enquadramento em Faixas de Renda

  

O programa MCMV possui dois eixos de enquadramento independentes:

\- Enquadramento por \*\*renda bruta familiar mensal\*\*

\- Enquadramento por \*\*valor do imóvel\*\*

  

O enquadramento resultante é sempre o \*\*MAIOR\*\* (mais restritivo) dos dois. Exemplo: se o cliente é Faixa 2 pela renda, mas o valor do imóvel se enquadra na Faixa 3, o resultado é Faixa 3 — e a taxa de juros aplicada será a da Faixa 3.

  

### 1.1 Tabela de Subfaixas (por renda)

  

| Subfaixa       | Grupo | Renda mínima (R$) | Renda máxima (R$) |

|\----------------|\-------|\-------------------:|\-------------------:|

| G1\_A           | G1    |              0,01  |          2.160,00  |

| G1\_B           | G1    |          2.160,01  |          2.850,00  |

| G1\_B\_SUPERIOR  | G1    |          2.850,01  |          3.200,00  |

| G2\_A           | G2    |          3.200,01  |          3.500,00  |

| G2\_B           | G2    |          3.500,01  |          4.000,00  |

| G2\_C           | G2    |          4.000,01  |          5.000,00  |

| G3             | G3    |          5.000,01  |          9.600,00  |

| G4             | G4    |          9.600,01  |         13.000,00  |

  

Renda máxima do programa: \*\*R$ 13.000,00\*\*.

  

### 1.2 Tabela de Enquadramento por Valor do Imóvel

  

| Grupo | Valor máximo do imóvel (R$) |

|\-------|\----------------------------:|

| G1    |                  190.000    |

| G2    |                  264.000    |

| G3    |                  400.000    |

| G4    |                  600.000    |

  

### 1.3 Lógica de Enquadramento Resultante

  

\`\`\`

1\. grupoRenda  = enquadrar pela renda bruta (tabela 1.1)

2\. grupoValor  = enquadrar pelo valor do imóvel (tabela 1.2)

3\. grupoResultante = max(grupoRenda, grupoValor)

\`\`\`

  

Exemplo prático:

\- Renda R$ 3.500 → G2\_B (Grupo G2)

\- Imóvel R$ 350.000 → Grupo G3 (> 264k, ≤ 400k)

\- Resultado: \*\*G3\*\* → taxa de juros do G3

  

Se a renda não se enquadra em nenhuma subfaixa, a simulação retorna alerta \`nao\_enquadrado\`.

  

\---

  

## 2. Taxas de Juros

  

As taxas de juros anuais variam conforme três fatores:

\- \*\*Subfaixa\*\* do comprador

\- \*\*Condição de cotista FGTS\*\* (mínimo 3 anos de contribuição)

\- \*\*Região geográfica\*\* do imóvel

  

### 2.1 Regiões de Taxa

  

As 5 regiões geográficas são agrupadas em 2 regiões de taxa:

  

| Região geográfica | Região de taxa              |

|\--------------------|\-----------------------------|

| Norte              | NORTE\_NORDESTE              |

| Nordeste           | NORTE\_NORDESTE              |

| Sudeste            | SUL\_SUDESTE\_CENTRO\_OESTE    |

| Sul                | SUL\_SUDESTE\_CENTRO\_OESTE    |

| Centro-Oeste       | SUL\_SUDESTE\_CENTRO\_OESTE    |

  

### 2.2 Tabela de Taxas (% ao ano)

  

| Subfaixa       | N/NE Cotista | N/NE Não Cotista | S/SE/CO Cotista | S/SE/CO Não Cotista |

|\----------------|:------------:|:----------------:|:---------------:|:-------------------:|

| G1\_A           |    4,00      |      4,50        |      4,25       |        4,75         |

| G1\_B           |    4,25      |      4,75        |      4,50       |        5,00         |

| G1\_B\_SUPERIOR  |    4,50      |      5,00        |      4,75       |        5,25         |

| G2\_A           |    4,75      |      5,25        |      5,25       |        5,50         |

| G2\_B           |    5,50      |      6,00        |      5,50       |        6,00         |

| G2\_C           |    6,50      |      7,00        |      6,50       |        7,00         |

| G3             |    7,66      |      8,16        |      7,66       |        8,16         |

| G4             |   10,00      |     10,00        |     10,00       |       10,00         |

  

### 2.3 Conversão de Taxa Anual para Mensal

  

A taxa mensal equivalente é calculada por juros compostos:

  

\`\`\`

taxaMensal = (1 + taxaAnual / 100) ^ (1/12) - 1

\`\`\`

  

Exemplo: 8,16% a.a. → (1,0816)^(1/12) - 1 ≈ 0,006554 (0,6554% a.m.)

  

### 2.4 Taxa Efetiva pelo Duplo Enquadramento

  

A taxa de juros é determinada pela subfaixa efetiva, que resulta do duplo enquadramento:

  

\- Se o grupo resultante (renda × valor) é maior que o grupo de renda, a taxa aplicada é a da subfaixa mínima do grupo resultante

\- Exemplo: renda G2\_B + valor G3 → taxa do G3 (cotista/não cotista conforme região)

  

Arquivo: \`src/logic/taxaJuros.ts\` → \`obterTaxaJuros()\`

  

\---

  

## 3. Subsídio (Desconto Complemento)

  

O subsídio reduz o valor a ser financiado. É calculado por uma curva quadrática ajustada por índice IBGE regional.

  

### 3.1 Elegibilidade

  

\- Somente grupos G1 e G2 têm direito a subsídio (pelo grupo resultante do duplo enquadramento)

\- Se o grupo resultante é G3 ou G4 (mesmo que a renda seja G1/G2), \*\*sem subsídio\*\*

\- Renda bruta > R$ 4.700: \*\*sem subsídio\*\* (retorna 0)

  

### 3.2 Fórmula Completa

  

\`\`\`

1\. rendaAjustada = clamp(rendaBruta, 1750, 3700)

   → min(max(rendaBruta, 1750), 3700)

  

2\. descontoBase = a × rendaAjustada² + b × rendaAjustada

   onde: a = 0,0126496 ; b = -49,33

  

3\. descontoBase = clamp(descontoBase, 1900, 50000)

  

4\. indiceIBGE = tabela por UF (ver seção 3.3)

  

5\. dcMaximo = 65.000 (região Norte) ou 55.000 (demais regiões)

  

6\. subsidioFinal = min(descontoBase × (1 + indiceIBGE / 100), dcMaximo)

  

7\. subsidioFinal = max(subsidioFinal, 1500) (mínimo por cliente)

  

8\. subsidioFinal = min(subsidioFinal, valorImovel)

   subsidioFinal = max(subsidioFinal, 0)

\`\`\`

  

O subsídio máximo é \*\*R$ 65.000\*\* na região Norte e \*\*R$ 55.000\*\* nas demais regiões.

  

### 3.3 Índice Despesa-Renda IBGE por UF (%)

  

| UF | Índice | UF | Índice | UF | Índice | UF | Índice |

|\----|\-------:|\----|\-------:|\----|\-------:|\----|\-------:|

| DF |   7,2  | RJ |  -1,8  | SP |   2,1  | ES |  -5,1  |

| MG |  -5,7  | PR |  -5,1  | SC |   4,6  | RS |  -1,1  |

| MS |  -3,5  | MT |  -0,1  | GO |  -0,7  | RO | -10,0  |

| AC |   3,4  | AM |   0,6  | RR |  -4,8  | PA |   5,5  |

| AP |  10,0  | TO |  -3,2  | MA |   0,7  | PI |  -8,1  |

| CE |  -7,9  | RN |   0,6  | PB |  -6,8  | PE |  -5,3  |

| AL |  -8,1  | SE |  -6,2  | BA |  -5,0  |    |        |

  

### 3.4 Exemplo Numérico

  

Renda R$ 2.000, UF = AP (índice 10,0%), região Norte, grupo resultante G1:

  

\`\`\`

rendaAjustada = clamp(2000, 1750, 3700) = 2000

descontoBase  = 0,0126496 × 2000² + (-49,33) × 2000

              = 0,0126496 × 4.000.000 - 98.660

              = 50.598,40 - 98.660 = -48.061,60

descontoBase  = clamp(-48.061,60, 1900, 50000) = 1.900

subsidio      = min(1900 × 1,10, 65000) = 2.090

subsidio      = max(2.090, 1500) = 2.090,00

\`\`\`

  

Renda R$ 1.750 (mínima), UF = AP, região Norte, grupo resultante G1:

  

\`\`\`

rendaAjustada = 1750

descontoBase  = 0,0126496 × 1750² + (-49,33) × 1750

              = 0,0126496 × 3.062.500 - 86.327,50

              = 38.737,00 - 86.327,50 = -47.590,50

descontoBase  = clamp(-47.590,50, 1900, 50000) = 1.900

subsidio      = min(1900 × 1,10, 65000) = 2.090

subsidio      = max(2.090, 1500) = 2.090,00

\`\`\`

  

Arquivo: \`src/logic/subsidio.ts\` → \`calcularSubsidio()\`

  

\---

  

## 4. Limite de Valor do Imóvel por Município

  

Cada município possui limites de valor de imóvel que variam conforme o grupo de faixa e o recorte urbano (A1, A2, B1, B2).

  

### 4.1 Regra de Seleção do Limite

  

| Grupo    | Condição                  | Limite utilizado          |

|\----------|\---------------------------|\---------------------------|

| G1 ou G2 | renda ≤ R$ 5.000          | \`limiteFaixaG1G2\`         |

| G1 ou G2 | renda > R$ 5.000          | \`limiteFaixaAcima5000\`    |

| G3       | —                         | \`limiteFaixaG3\` (R$ 400.000) |

| G4       | —                         | \`limiteFaixaG4\` (R$ 600.000) |

  

### 4.2 Limites por Recorte Urbano (G1/G2)

  

| Recorte | Exemplos de cidades                          | Limite G1/G2 (R$) |

|\---------|\----------------------------------------------|\-----------------:|

| A1      | São Paulo, Rio de Janeiro, Brasília           |        275.000   |

| A1      | Belo Horizonte, Salvador, Curitiba, Goiânia   |        270.000   |

| A2      | Campinas, Guarulhos, Natal, Campo Grande      |        265.000   |

| B1      | Contagem, Sorocaba, Londrina, Teresina        |        250.000   |

| B2      | Uberlândia, Anápolis, Canoas                  |        240.000   |

  

Se o valor do imóvel excede o limite do município, a simulação gera alerta \`limite\_imovel\`.

  

Arquivo: \`src/logic/municipios.ts\` → \`obterLimiteImovel()\`

  

\---

  

## 5. Ajuste de Prazo por Idade

  

O prazo do financiamento é limitado para que a idade do comprador ao final do contrato não exceda \*\*80 anos e 6 meses\*\*.

  

### 5.1 Fórmula

  

\`\`\`

idadeEmAnos = (dataReferencia - dataNascimento) / (365,25 dias)

  

Se idadeEmAnos + (prazoMeses / 12) > 80,5:

    anosDisponiveis = 80,5 - idadeEmAnos

    prazoAjustado = floor(anosDisponiveis × 12)

\`\`\`

  

### 5.2 Limites de Prazo

  

\- Prazo mínimo: \*\*120 meses\*\* (10 anos)

\- Prazo máximo: \*\*420 meses\*\* (35 anos)

  

Arquivo: \`src/logic/idadePrazo.ts\` → \`ajustarPrazo()\`

  

\---

  

## 6. Valor Financiado e LTV

  

### 6.1 Cálculo do Valor Financiado

  

\`\`\`

valorSemLTV = valorImovel - valorEntrada - subsidio

valorLTV    = valorImovel × 0,80

valorFinanciado = min(valorSemLTV, valorLTV)

\`\`\`

  

O LTV (Loan-to-Value) máximo é \*\*80%\*\* do valor do imóvel.

  

Se \`valorSemLTV > valorLTV\`, a simulação gera alerta \`ltv\_limitado\`.

Se \`valorFinanciado <= 0\`, gera alerta \`sem\_financiamento\`.

  

\---

  

## 7. Seguros Obrigatórios

  

Dois seguros são cobrados mensalmente sobre o saldo devedor.

  

### 7.1 Seguro MIP (Morte e Invalidez Permanente)

  

A alíquota varia conforme a faixa etária do comprador:

  

| Idade (anos) | Alíquota (%) |

|:------------:|:------------:|

|   18 – 25    |   0,00930    |

|   26 – 30    |   0,00960    |

|   31 – 35    |   0,01160    |

|   36 – 40    |   0,01540    |

|   41 – 45    |   0,02520    |

|   46 – 50    |   0,03860    |

|   51 – 55    |   0,06760    |

|   56 – 60    |   0,15330    |

|   61 – 65    |   0,27310    |

|   66 – 70    |   0,32590    |

|   71 – 75    |   0,48940    |

|   76 – 80    |   0,53120    |

  

\`\`\`

seguroMIP = saldoDevedor × (aliquotaMIP / 100)

\`\`\`

  

### 7.2 Seguro DFI (Danos Físicos ao Imóvel)

  

Alíquota fixa: \*\*0,00710%\*\*

  

\`\`\`

seguroDFI = saldoDevedor × (0,00710 / 100)

\`\`\`

  

Arquivo: \`src/logic/seguros.ts\`

  

\---

  

## 8. Taxa Administrativa

  

| Condição                        | Valor mensal |

|\---------------------------------|:------------:|

| Renda ≤ R$ 3.200 (Faixa G1)    |   R$ 0,00    |

| Renda > R$ 3.200 (demais)      |  R$ 25,00    |

  

\---

  

## 9. Cálculo de Parcelas

  

O simulador suporta dois sistemas de amortização: SAC e PRICE.

  

### 9.1 Sistema SAC (Sistema de Amortização Constante)

  

A amortização é fixa; os juros diminuem a cada mês.

  

\`\`\`

amortizacao = valorFinanciado / prazoMeses

  

Para cada mês k (de 0 a prazoMeses - 1):

    saldoDevedor = valorFinanciado - k × amortizacao

    juros        = saldoDevedor × taxaMensal

    seguroMIP    = saldoDevedor × (aliquotaMIP / 100)

    seguroDFI    = saldoDevedor × (0,00710 / 100)

    parcela      = amortizacao + juros + seguroMIP + seguroDFI + taxaAdministrativa

\`\`\`

  

A primeira parcela é a mais alta; a última é a mais baixa.

  

### 9.2 Sistema PRICE (Tabela Price)

  

A parcela base (amortização + juros) é fixa ao longo do contrato.

  

\`\`\`

fator = (1 + taxaMensal) ^ prazoMeses

parcelaBase = valorFinanciado × (taxaMensal × fator) / (fator - 1)

  

Para cada mês k (de 0 a prazoMeses - 1):

    juros        = saldoDevedor × taxaMensal

    amortizacao  = parcelaBase - juros

    seguroMIP    = saldoDevedor × (aliquotaMIP / 100)

    seguroDFI    = saldoDevedor × (0,00710 / 100)

    parcela      = parcelaBase + seguroMIP + seguroDFI + taxaAdministrativa

    saldoDevedor = saldoDevedor - amortizacao

\`\`\`

  

### 9.3 Composição da Primeira Parcela

  

A primeira parcela é decomposta em:

  

| Componente          | Descrição                                    |

|\---------------------|\----------------------------------------------|

| Amortização         | Redução do saldo devedor                     |

| Juros               | Juros sobre o saldo devedor                  |

| Seguro MIP          | Seguro de morte e invalidez                  |

| Seguro DFI          | Seguro de danos físicos ao imóvel            |

| Taxa administrativa | R$ 0 ou R$ 25 conforme renda                 |

| \*\*Total\*\*           | Soma de todos os componentes                 |

  

### 9.4 Custo Total

  

O custo total é a soma de todas as parcelas ao longo do prazo:

  

\`\`\`

custoTotal = Σ parcela\[k\] para k de 0 a prazoMeses - 1

\`\`\`

  

Arquivo: \`src/logic/parcelas.ts\`

  

\---

  

## 10. Capacidade de Financiamento

  

Calcula o valor máximo que o comprador pode financiar com base no comprometimento de renda.

  

### 10.1 Fórmula (baseada em PRICE)

  

\`\`\`

parcelaMaxima = rendaBruta × condicionamento

  

fator = (1 + taxaMensal) ^ prazoMeses

  

capacidade = parcelaMaxima × (fator - 1) / (taxaMensal × fator)

\`\`\`

  

O condicionamento padrão é \*\*30%\*\* (0,30), podendo variar de 1% a 50%.

  

### 10.2 Comprometimento de Renda

  

\`\`\`

comprometimentoRenda = (primeiraParcela / rendaBruta) × 100

\`\`\`

  

Se a primeira parcela excede \`rendaBruta × condicionamento\`, gera alerta \`comprometimento\_renda\`.

  

Arquivo: \`src/logic/capacidade.ts\`

  

\---

  

## 11. Custos Adicionais

  

### 11.1 Custos de Documentação

  

\`\`\`

custosDocumentacao = valorImovel × 0,05 (5%)

\`\`\`

  

### 11.2 Recursos Próprios

  

\`\`\`

recursosProprios = valorEntrada + custosDocumentacao

\`\`\`

  

### 11.3 Custo Total de Aquisição

  

\`\`\`

custoTotalAquisicao = custoTotal + recursosProprios

\`\`\`

  

\---

  

## 12. Fluxo Completo da Simulação

  

O motor de cálculo (\`executarSimulacao\`) executa os passos na seguinte ordem:

  

\`\`\`

 1. Enquadrar por RENDA (subfaixa → grupo)

 2. Enquadrar por VALOR DO IMÓVEL (grupo)

 3. Grupo resultante = o MAIOR dos dois

 4. Subfaixa efetiva para taxa de juros

 5. Buscar município pelo código IBGE

 6. Obter limite de imóvel do município (usando grupo resultante)

 7. Verificar se valor do imóvel excede o limite → alerta

 8. Calcular subsídio (elegível somente se grupo resultante é G1 ou G2)

 9. Obter taxa de juros pela subfaixa efetiva

10\. Verificar se taxa foi ajustada pelo duplo enquadramento → alerta

11\. Ajustar prazo por idade → alerta se ajustado

12\. Calcular valor financiado com LTV

13\. Verificar LTV → alerta se limitado

14\. Verificar se há financiamento necessário

15\. Determinar taxa administrativa

16\. Calcular idade para seguros

17\. Converter taxa anual para mensal

18\. Calcular parcelas (SAC ou PRICE) com seguros

19\. Calcular capacidade de financiamento

20\. Calcular comprometimento de renda → alerta se excede

21\. Calcular custos de documentação e recursos próprios

22\. Calcular custo total de aquisição

23\. Retornar resultado completo com alertas

\`\`\`

  

Arquivo: \`src/logic/motorCalculo.ts\` → \`executarSimulacao()\`

  

\---

  

## 13. Alertas

  

O simulador pode gerar os seguintes alertas:

  

| Tipo                      | Quando ocorre                                                        |

|\---------------------------|\----------------------------------------------------------------------|

| \`nao\_enquadrado\`          | Renda fora das faixas do programa (< R$ 0,01 ou > R$ 13.000)        |

| \`municipio\_nao\_encontrado\`| Código IBGE não encontrado na base de dados                         |

| \`limite\_imovel\`           | Valor do imóvel excede o limite do município                         |

| \`taxa\_ajustada\`           | Taxa de juros foi elevada por override (imóvel > R$ 400k + renda)   |

| \`prazo\_ajustado\`          | Prazo reduzido para respeitar limite de 80 anos e 6 meses           |

| \`ltv\_limitado\`            | Financiamento limitado a 80% do valor do imóvel                     |

| \`sem\_financiamento\`       | Entrada + subsídio cobrem o valor do imóvel                          |

| \`comprometimento\_renda\`   | Parcela excede o percentual de condicionamento da renda              |

  

\---

  

## 14. Validação de Entrada

  

Antes da simulação, os dados de entrada são validados:

  

| Campo               | Regra                                              |

|\---------------------|\----------------------------------------------------|

| \`regiao\`            | Obrigatório, deve ser uma das 5 regiões válidas    |

| \`uf\`                | Obrigatório, deve ser uma das 27 UFs               |

| \`codigoIBGE\`        | Obrigatório, deve existir na base de municípios     |

| \`rendaBruta\`        | Deve ser > 0                                        |

| \`valorImovel\`       | Deve ser > 0                                        |

| \`valorEntrada\`      | Deve ser >= 0 e < valorImovel                       |

| \`prazoMeses\`        | Entre 120 e 420 meses                               |

| \`dataNascimento\`    | Obrigatório, comprador deve ter >= 18 anos          |

| \`sistemaAmortizacao\`| Deve ser "SAC" ou "PRICE"                           |

| \`condicionamento\`   | Entre 0,01 (1%) e 0,50 (50%)                       |

| \`areaUtil\`          | Se informado, não pode ser negativo                 |

  

Arquivo: \`src/logic/validacao.ts\` → \`validarEntrada()\`

  

\---

  

## 15. Referências Normativas

  

\- Conselho Curador do FGTS — aprovação de 24/03/2026 (novos limites de renda e imóvel)

\- Caixa Econômica Federal — taxas de juros entre 4,00% e 10,00% a.a.

\- Lei 14.620/2023 — marco legal do programa MCMV

\- Portaria MCID nº 1.248/2023 — regulamentação do programa