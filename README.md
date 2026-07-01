# Brawl Adapt 3D — Fase 5 · Personagens caracterizados + barra de vida

Versão atualizada do protótipo com a base da Fase 4 mantida e uma primeira camada de direção visual aplicada aos 4 brawlers já conceituados: João, Luan, Thomas e Djonga.

## O que entrou nesta versão

- João, Luan, Thomas e Djonga agora têm modelos 3D mais caracterizados no jogo.
- João recebeu cabelo escuro bagunçado, óculos, barba leve, jaqueta vinho com mangas claras, hoodie branco, calça escura e rosa azul.
- Luan recebeu visual mais atlético, roupa preta, barba/mustache, corrente, detalhe vermelho e espada de energia.
- Thomas recebeu cabelo claro/franja, camisa azul-marinho, earring, visual furtivo e lâminas azuladas.
- Djonga recebeu visual de lutador, torso de combate, shorts de luta, luvas/wraps vermelho e azul e identidade de combo fighter.
- Barra de vida acima de todos os personagens, incluindo jogador local e remotos.
- A barra de vida diminui conforme o HP do personagem cai.
- A barra muda de cor quando a vida está baixa e fica vermelha quando o personagem cai.
- Name tag continua mostrando nome, brawler e HP numérico.
- Os concept sheets gerados foram incluídos na pasta `assets/concepts/` para referência visual.

## Mantido da Fase 4

- Multiplayer online por PIN usando Supabase Realtime.
- Seleção de brawler antes de entrar/criar sala.
- Dano entre jogadores no modelo peer-authoritative.
- Vida, queda/nocaute e respawn simples sincronizados pela rede.
- Caixas quebradas/danificadas sincronizadas entre jogadores conectados.
- Ataque básico e Super específicos por brawler.

## Brawlers implementados no gameplay

- João: rosa azul de média distância; Super de correntes em área.
- Luan: espada em cone; Super de avanço giratório.
- Djonga: combo de 3 socos; Super de salto com impacto.
- Thomas: lâminas em leque; Super de invisibilidade temporária.
- Gui: orbe mágico com fragmentos; Super de controle visual.
- Lorenzo: rajada larga de 9 estilhaços; Super de torreta de cura.
- Ministro: dardo longo; Super de frasco em área.

## Ressalvas

Os modelos ainda são construídos com geometrias simples do Three.js, sem arquivos 3D externos. A intenção desta etapa é deixar os personagens reconhecíveis e com identidade própria dentro do protótipo, não criar modelos finais de produção.

Gui, Lorenzo e Ministro ainda seguem com a caracterização anterior/genericamente temática. Eles podem receber o mesmo tratamento quando os concepts deles forem definidos.

Esta versão ainda não é um servidor autoritativo. O PvP funciona no modelo peer-authoritative: cada cliente calcula se o próprio jogador foi atingido pelos ataques recebidos pela rede.

## Como rodar

Abra `index.html` no navegador ou publique a pasta inteira no GitHub Pages.

A versão compilada está em:

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
  brawlers.js       catálogo dos brawlers e stats
  brawlerMesh.js    modelos visuais e caracterização dos personagens
  attackEffects.js  ataques em cone, área, dash, salto, corrente e torreta
  main.js           cena, HUD, seleção, sala, ataques, name tags e barras de vida
  player.js         jogador local e atributos por brawler
  remotePlayer.js   jogador remoto com brawler sincronizado
  network.js        Supabase Realtime com Presence + Broadcast
assets/concepts/    concept sheets dos 4 personagens caracterizados
```
