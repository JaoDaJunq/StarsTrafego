# Brawl Adapt 3D — Fase 2 · Multiplayer com Supabase Realtime

Duas ou mais pessoas entram na mesma sala digitando o mesmo PIN e se veem
mexendo em tempo real na mesma arena. Ainda sem dano entre jogadores — é
sobre validar a sincronização de posição, mira e disparo visual antes de
entrar em combate de verdade.

## Rodar

Abrir o `index.html` no navegador — já vem compilado em `dist/bundle.js`.
Pra jogar em grupo, cada pessoa abre o link do GitHub Pages e usa o mesmo
PIN.

**Subir no GitHub Pages:** sobe tudo (incluindo a pasta `dist/`) na raiz do
repositório e ativa o Pages em Settings → Pages, branch principal, pasta
`/ (root)`.

## Como funciona a sala

- Ao abrir o jogo, você digita seu nome e um PIN de 4 dígitos
- **Criar sala** gera um PIN aleatório e já entra
- **Entrar** usa o PIN que você digitar — combina esse número com quem for
  jogar junto (por WhatsApp, por exemplo)
- Não existe lista de salas: quem digita o mesmo PIN cai automaticamente
  no mesmo canal. Não precisa criar nada antes — o "servidor" da sala é
  só o canal do Supabase Realtime, não fica nada salvo
- Cada jogador vira uma cor diferente (o modelo genérico ainda é o mesmo
  pra todo mundo — os brawlers de verdade entram na fase 4)

## O que sincroniza nessa fase

- Posição, direção do corpo e da mira de cada jogador, ~11 vezes por
  segundo, com suavização (interpolação) pra não ficar travando na tela
  de quem está assistindo
- Disparos (normal e Super) aparecem visualmente pros outros jogadores
- Entrada e saída de jogadores da sala, com contagem ao vivo no HUD

## O que NÃO sincroniza ainda (de propósito)

- **Dano entre jogadores.** Os tiros de um jogador não acertam o outro
  ainda — cada cliente só processa a física do próprio tiro contra o
  cenário
- **Estado das Caixas de Briefing.** Cada jogador simula os obstáculos
  localmente. Se você destruir uma caixa, só você vê ela sumir — os
  outros ainda veem ela inteira até destruírem por conta própria. Isso
  é esperado nessa fase e vai ser resolvido junto com a sincronização de
  combate
- Reconexão automática caso a internet caia no meio da partida

## Testando sozinho vs. testando em grupo

Pra sentir a sincronização sem precisar de outra pessoa, abre o jogo em
duas abas (ou dois navegadores) na sua máquina, entra com o mesmo PIN nas
duas, e anda em uma pra ver a outra se mexer.

## Estrutura de arquivos (o que mudou da fase 1)

```
src/
  network.js        conexão com a sala (Supabase Realtime — Presence + Broadcast)
  brawlerMesh.js       construção do personagem, compartilhada entre local e remoto
  player.js               agora só cuida do jogador local (input, física, tiro)
  remotePlayer.js           jogador remoto — mesh igual, mas guiado por rede + interpolação
  projectile.js               ganhou o modo "ghost" (tiro visual dos outros, sem colisão local)
  main.js                       tela de sala, HUD de sala/contagem, etiquetas de nome flutuantes
```

## Sobre a credencial do Supabase

A URL e a chave pública (anon/publishable key) do projeto estão embutidas
no código-fonte (`src/network.js`). Isso é esperado e seguro pra esse tipo
de chave — ela é feita pra ser pública, não dá acesso a nada sensível por
si só. Como essa fase usa só Realtime (Presence + Broadcast) e nenhuma
tabela do banco, não existe dado nenhum sendo lido ou gravado no Postgres.

## Próximos passos

Fase 3: fechar o elenco do time de tráfego e desenhar o ataque + Super de
cada brawler de verdade. Fase 4: sincronizar dano de verdade entre
jogadores (aí sim as Caixas de Briefing e o combate ficam compartilhados
pra todo mundo).

