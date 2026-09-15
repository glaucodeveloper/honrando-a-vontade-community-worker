# Dados e publicação

O fluxo foi desenhado para separar **cadastro** de **publicação**.

## Não é público por padrão

Ao iniciar a entrevista, o perfil nasce como:

```text
incomplete
```

Depois do consentimento:

```text
pending
```

Somente uma aprovação administrativa muda para:

```text
approved
```

## Dados públicos

A API pública retorna apenas:
- nome de exibição;
- cidade, se informada;
- gêneros;
- apresentação;
- resumo de estilo;
- foto.

## Foto

A foto é gravada no repositório público e servida pelo GitHub Pages após o envio.
O bucket pode permanecer privado.

## Conversa

O Worker não grava o histórico geral de chat.
O navegador mantém um histórico curto em `sessionStorage`.

No cadastro, somente as respostas necessárias para compor o perfil são gravadas em D1.

## Consentimento

A publicação exige autorização explícita por texto no estágio final.

Para uma operação real, a organização deve complementar este fluxo com:
- política de privacidade;
- contato para correção/exclusão;
- prazo de retenção;
- regras internas de moderação.
