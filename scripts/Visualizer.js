class Visualizer {
    constructor({ el }) {
        this.element =  document.querySelector(el);
        this.init();
    }

    setGame({ game, grid, botPlayer, enemyPlayer }) {
        this.game = game;
        this.gameGrid = grid;
        this.botPlayer = botPlayer;
        this.enemyPlayer = enemyPlayer;
        this.snapshots = [];
    } 
    
    init() {
        this.initGrid();
        this.initSlider();
    }

    initSlider() {
        this.sliderEl = this.element.querySelector('#slider');
        this.sliderEl.oninput = this.onSliderChange.bind(this);
    }

    onSliderChange(evt) {
        this.restore(evt.target.value);
    }

    initGrid() {
        this.grid = this.element.querySelector('table#grid');
        this.rows = this.grid.querySelectorAll('tr');
        this.cells = this.grid.querySelectorAll('td');
        this.player1 = this.element.querySelector('#player-1');
        this.player2 = this.element.querySelector('#player-2');
    }

    render() {
        this.renderPlayer(this.player1, this.botPlayer);
        this.renderPlayer(this.player2, this.enemyPlayer);
        this.genderGrid();
    }

    genderGrid() {
        const gameGrid = this.gameGrid || {};
        const gems = gameGrid.gems || [];
        const cells = this.cells;
        for(var i = 0; i < cells.length; i++) {
            var cell = cells[i] || null;
            const gemX = i % 8;
            const gemY = Math.floor(i/8);
            const gemIndex = (8 * (7 - gemY)) + gemX;
            const gem = (gems).find((gem) => gem.index === gemIndex);

            this.renderCell(cell, gem);
        }
    }

    renderPlayer(element, player) {
        if(!player) {
            return;
        }
        const infoEl = element.querySelector('.info');
        infoEl.innerHTML = `
        <div>ID: ${player.playerId}</div>
        <div>Name: ${player.displayName}</div>
        `

        const heroEls = element.querySelectorAll('.hero');
        for(let i = 0; i <  heroEls.length; i++) {
            const heroEl = heroEls[i];
            const playerHero = player.heroes[i];
            this.renderHero(heroEl, playerHero);
        }
    }

    renderHero(element, hero) {
        const gems = hero.gems.map(gem => (`<div class="gem-icon" style="background-color: ${GemColor[gem]};">${gem} </div>`))
        const attributes = 
            `
            <div>ID: ${hero.id}</div>
            <div>Attack: ${hero.attack}</div>
            <div>Hp: ${hero.hp}</div>
            <div>Mana: ${hero.mana}/${hero.maxMana}</div>
            <div>Gems: ${gems.join('&nbsp;')}</div>
            `
        element.innerHTML = attributes;
    }

    renderCell(cell, gem) {
        const type = gem ?  gem.type : '';
        cell.innerText = type;
        cell.style.backgroundColor = GemColor[type];
    }

    start() {
        this.intervalId = setInterval(visualizer.render.bind(this), 500);
    }

    stop() {
        if(!this.intervalId) {
            return;
        }
        this.game = null;
        this.gameGrid = null;
        this.botPlayer = null;
        this.enemyPlayer = null;
        this.render();
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    snapShot() {
        this.snapshots = this.snapshots || [];
        const snapshot = {
            gameGrid: this.gameGrid.clone(),
            botPlayer: this.botPlayer.clone(),
            enemyPlayer: this.enemyPlayer.clone(),
            logText: this.logText
        };
        const clone = snapshot;
        this.snapshots.push(clone);
        this.sliderEl.max = this.snapshots.length;
        this.sliderEl.value = this.snapshots.length;
    }

    restore(index) {
        if(!this.snapshots || this.snapshots.length <= index) {
            return;
        }
        const snapshot = this.snapshots[index];
        this.gameGrid = snapshot.gameGrid;
        this.botPlayer = snapshot.botPlayer;
        this.enemyPlayer = snapshot.enemyPlayer;
        this.logText = snapshot.logText;
        document.getElementById("log").innerHTML = this.logText;
    }

    log(text) {
        this.logText =  text;
    }
}