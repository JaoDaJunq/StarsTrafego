# Brawl Adapt 3D - Fase 6 - Personagens caracterizados

Versao atualizada do prototipo com os 7 brawlers ja caracterizados visualmente no jogo, mantendo a base da Fase 5 com multiplayer, PvP, caixas sincronizadas e barra de vida acima dos personagens.

## O que entrou nesta versao

- Joao, Luan, Thomas, Djonga, Gui, Lorenzo e Ministro com visuais personalizados.
- Gui recebeu visual de controlador arcano: cabelo volumoso, oculos, camisa preta, detalhes roxos/dourados, faixa arcana e orbe magico.
- Lorenzo recebeu visual de suporte: hoodie preto, cabelo claro/franja, AirPods, corrente, rig tecnico, detalhes teal e canhao de suporte.
- Ministro recebeu visual de suporte/controle no estilo Byron: cabelo cacheado, barba leve, jaqueta puffer escura, frascos de elixir, detalhes verdes e arma de dardo/elixir.
- Barra de vida acima de todos os personagens, incluindo jogador local e remotos.
- A barra de vida diminui conforme o HP cai, entra em alerta com vida baixa e fica vermelha quando o personagem cai.
- Concept sheets dos 7 personagens incluidos em `assets/concepts/`.

## Mantido das fases anteriores

- Multiplayer online por PIN usando Supabase Realtime.
- Selecao de brawler antes de entrar/criar sala.
- Dano entre jogadores no modelo peer-authoritative.
- Vida, queda/nocaute e respawn simples sincronizados pela rede.
- Caixas quebradas/danificadas sincronizadas entre jogadores conectados.
- Ataque basico e Super especificos por brawler.

## Brawlers implementados no gameplay

- Joao: rosa azul de media distancia; Super de correntes em area.
- Luan: espada em cone; Super de avanco giratorio.
- Djonga: combo de 3 socos; Super de salto com impacto.
- Thomas: laminas em leque; Super de invisibilidade temporaria.
- Gui: orbe magico com fragmentos; Super de puxao/controle.
- Lorenzo: rajada larga de 9 estilhacos; Super de torreta de cura.
- Ministro: dardo longo; Super de frasco em area.

## Ressalvas

Os modelos ainda sao construidos com geometrias simples do Three.js, sem arquivos 3D externos. A intencao desta etapa e deixar os personagens reconheciveis e com identidade propria dentro do prototipo.

Esta versao ainda nao e um servidor autoritativo. O PvP funciona no modelo peer-authoritative: cada cliente calcula se o proprio jogador foi atingido pelos ataques recebidos pela rede.

## Como rodar

Abra `index.html` no navegador ou publique a pasta inteira no GitHub Pages.

A versao compilada esta em:

```txt
dist/bundle.js
```

## Como editar e recompilar

```bash
npm install
npm run build
```

Estrutura principal:

```txt
src/
  brawlers.js       catalogo dos brawlers e stats
  brawlerMesh.js    modelos visuais e caracterizacao dos personagens
  attackEffects.js  ataques em cone, area, dash, salto, corrente e torreta
  main.js           cena, HUD, selecao, sala, ataques, name tags e barras de vida
  player.js         jogador local e atributos por brawler
  remotePlayer.js   jogador remoto com brawler sincronizado
  network.js        Supabase Realtime com Presence + Broadcast
assets/concepts/    concept sheets dos 7 personagens caracterizados
```

## Fase 8 — Ajustes de gameplay, mapa e mira

- Barra de Super saiu do centro e foi para o canto inferior direito.
- Arena ampliada para 34 x 24, com obstáculos redistribuídos e mais espaço para combate.
- Spawns agora ficam bem separados entre si, priorizando cantos e laterais da arena.
- Recarga e cadência foram retunadas por brawler para reduzir a sensação de espera excessiva entre tiros.
- Super agora é disparada no Q. Espaço ainda funciona como atalho secundário.
- Segurar Shift mostra a área/alcance do ataque básico. Segurar Shift + Q mostra a prévia da Super.
- Lorenzo agora segue melhor a lógica da Pam: rajada de 9 projéteis espalhados, em voleio amplo.
- Thomas agora segue melhor a lógica do Leon: 4 lâminas em cone estreito, com dano mais forte de perto e menor à distância.
- Gui agora segue melhor a lógica do Eugênio/Gene: um orbe principal que, se não acertar nada, se divide em 6 projéteis em cone.
