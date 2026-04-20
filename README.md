# Backend — análise (NestJS)

API **NestJS** que expõe serviços para o projeto de análise de dados: leitura e processamento de planilhas (por exemplo **XLSX**), integração com configuração via `@nestjs/config`, pronta para consumo pelo frontend correspondente.

## Requisitos

- Node.js (LTS recomendado)
- npm ou yarn

## Como executar

Na raiz do projeto:

```bash
npm install
npm run dev
```

O servidor HTTP sobe em modo desenvolvimento com recarregamento (watch). A porta padrão do Nest costuma ser **3000**; confira o log do terminal ou `src/main.ts` se houver outra configuração.

Outros scripts úteis: `npm run build`, `npm run start:prod`, testes com `npm run test`.
