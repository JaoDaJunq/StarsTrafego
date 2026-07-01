# Brawl Adapt 3D — Fase 4 · Sincronização PvP

Versão atualizada do protótipo com seleção de brawlers, ataques/Supers jogáveis e primeira camada de sincronização PvP via Supabase Realtime.

## O que entrou nesta versão

- Catálogo com 7 brawlers: João, Luan, Djonga, Thomas, Gui, Lorenzo e Ministro.
- Tela de seleção de brawler antes de criar/entrar na sala.
- Nome do brawler no HUD e name tag.
- Vida base por brawler no HUD.
- Modelos visuais diferentes reaproveitando a base chibi.
- Ataque básico e Super específicos por brawler.
- Envio do brawler escolhido pela presença do Supabase.
- Disparos e efeitos visuais dos brawlers também aparecem para outros jogadores online.
- Validação simples para evitar brawler repetido na mesma sala.
- Sincronização de caixas quebradas/danificadas entre os jogadores conectados.
- Dano entre jogadores calculado por quem recebe o ataque.
- Vida, queda/nocaute e respawn simples sincronizados pelo estado de rede.
- Corrente do João prende o jogador atingido por um curto período.
- Super do Gui agora puxa o alvo atingido no cliente de quem recebeu o golpe.

## Brawlers implementados

- João: rosa azul de média distância; Super de correntes em área.
- Luan: espada em cone; Super de avanço giratório.
- Djonga: combo de 3 socos; Super de salto com impacto.
- Thomas: lâminas em leque; Super de invisibilidade temporária.
- Gui: orbe mágico com fragmentos; Super de mão/orbe grande de controle visual.
- Lorenzo: rajada larga de 9 estilhaços; Super de torreta de cura.
- Ministro: dardo longo; Super de frasco em área.

## Ressalvas mantidas

Esta versão ainda não é um servidor autoritativo de jogo. O PvP funciona no modelo peer-authoritative: cada cliente calcula se o próprio jogador foi atingido pelos ataques recebidos pela rede. Para protótipo/teste interno isso já permite combate online, mas em uma versão competitiva real o ideal seria mover autoridade de dano, vida, caixas e respawn para um servidor.

A sincronização das caixas agora existe durante a sala, mas ainda não há persistência de estado para quem entra atrasado. Se alguém entrar depois de uma caixa já ter sido quebrada, pode ver a arena inicial até novos eventos de sincronização acontecerem.

Cura em aliados e times ainda não foram modelados. A torreta do Lorenzo cura o próprio jogador local e o estado de vida atualizado é enviado aos demais.

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
  brawlers.js       catálogo dos brawlers
  attackEffects.js  ataques em cone, área, dash, salto, corrente e torreta
  main.js           cena, HUD, seleção, sala, ataques e loop
  player.js         jogador local e atributos por brawler
  remotePlayer.js   jogador remoto com brawler sincronizado
  network.js        Supabase Realtime com Presence + Broadcast
```
