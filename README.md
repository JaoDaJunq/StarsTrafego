# Brawl Adapt 3D — Protótipo Fase 1

Evolução do protótipo 2D pra um visual de verdade no estilo Brawl Stars:
Three.js, câmera fixa em ângulo, personagem chibi com contorno toon, chão de
grama/areia e obstáculos com a mesma piada interna de tráfego pago.

## Rodar

Só abrir o `index.html` no navegador — o jogo já vem compilado em
`dist/bundle.js`, não precisa instalar nada nem rodar build.

Pra subir no GitHub Pages: sobe **todos** os arquivos e pastas (incluindo a
pasta `dist/`) na raiz do repositório, ativa o GitHub Pages em Settings →
Pages apontando pra branch principal, pasta `/ (root)`.

## Se quiser editar e recompilar

O código-fonte real está em `src/`, em módulos ES (`import`/`export`). O que
roda no navegador é o bundle gerado a partir dele.

```
npm install
node build.js
```

Isso gera `dist/bundle.js` de novo. `node_modules` não vai no zip pra não
pesar — só rodar `npm install` uma vez se for editar o código.

## Controles

Iguais à fase 1 em 2D:

- **WASD** — mover (o corpo acompanha a direção do movimento)
- **Mouse** — mirar (a arma sempre aponta pro ponto do chão sob o cursor,
  independente de pra onde você está andando)
- **Clique** — atirar. 3 tiros no pente, recarrega um por vez
- **Espaço** — Super quando a barra estiver cheia
- **R** — reinicia a arena

## O que mudou da fase 1 (2D) pra essa

- Renderização em Three.js com câmera ortográfica fixa em ângulo (55° de
  elevação), no mesmo espírito da câmera do jogo original — não é top-down
  reto
- Material toon (cel-shading) com contorno preto em todos os personagens e
  obstáculos, feito via técnica de "inverted hull" (uma cópia do mesh,
  ligeiramente maior, com as faces viradas pra dentro)
- Paleta clara e vibrante: chão de grama procedural com textura desenhada
  via canvas, borda de areia/terra ao redor da arena
- Personagem chibi: corpo esférico + visor + arma, com corpo e mira
  rotacionando de forma independente (o mesmo joystick duplo de sempre,
  agora em 3D)
- Sombras reais (luz direcional com shadow map), partículas 3D com física
  simples de gravidade
- Pilares de Report agora têm um "boné" dourado no topo (lembra uma barra
  de gráfico); Caixas de Briefing têm textura de madeira procedural com
  selo de papel; Zonas de Baixo CTR viraram arbustos de verdade (esferas
  agrupadas), com o personagem ficando semitransparente dentro delas

## O que não tem ainda (de propósito)

Mesma lista da fase 1 — isso ainda é só sobre validar o feel do movimento
e da mira, agora com o visual definitivo:

- Multiplayer (fase 2, Supabase Realtime)
- Sistema de sala/lobby
- Os brawlers de verdade baseados no time de tráfego (fase 3)
- Vida, dano no jogador e condição de vitória
- Barra de vida visível nas Caixas de Briefing (tinha na versão 2D, ainda
  não voltou pra essa — fácil de adicionar quando quiser)

## Estrutura de arquivos

```
brawl-adapt-3d/
  index.html          carrega o bundle e monta o HUD/menu
  style.css             HUD e menu — paleta clara, UI "chunky"
  build.js                script de build (esbuild)
  package.json
  dist/
    bundle.js               tudo compilado, é isso que o navegador roda
  src/
    main.js                  cena, câmera, luz, loop do jogo
    constants.js               dimensão da arena, paleta, layout dos obstáculos
    utils.js                    matemática e colisão (círculo x retângulo em XZ)
    toon.js                      material toon + contorno + textura de brilho
    textures.js                    texturas procedurais (grama, terra, madeira)
    player.js                       personagem: mesh, movimento, mira, tiro
    projectile.js                    projéteis e colisão
    particles.js                      sistema de partículas 3D
    world.js                           chão, pilares, caixas, arbustos
    input.js                            teclado, mouse e raycast pro chão
```

## Próximos passos

Mesmos de antes: fechar o elenco do time de tráfego com o "vibe" de cada
um, depois plugar Supabase Realtime pra multiplayer de verdade.
