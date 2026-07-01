# Brawl Adapt 3D — Fase 3 · Brawlers

Versão atualizada do protótipo com seleção de brawlers antes de entrar na sala e ataques/Supers jogáveis contra o cenário.

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

## Brawlers implementados

- João: rosa azul de média distância; Super de correntes em área.
- Luan: espada em cone; Super de avanço giratório.
- Djonga: combo de 3 socos; Super de salto com impacto.
- Thomas: lâminas em leque; Super de invisibilidade temporária.
- Gui: orbe mágico com fragmentos; Super de mão/orbe grande de controle visual.
- Lorenzo: rajada larga de 9 estilhaços; Super de torreta de cura.
- Ministro: dardo longo; Super de frasco em área.

## Ressalvas mantidas

Esta versão ainda não implementa combate PvP autoritativo. Os ataques já existem e causam dano no cenário local, mas dano entre jogadores, cura em aliados, puxão real do Gui, prisão real do João e estado global das caixas ainda são a próxima etapa.

As caixas continuam simuladas localmente. Se um jogador quebra uma caixa, o outro jogador ainda não vê essa caixa quebrada. Essa ressalva foi mantida de propósito para resolver junto com a sincronização de combate.

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
