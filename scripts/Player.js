class Player
{
    constructor(playerId, name)
    {
        this.signature = Math.random();
        this.playerId = playerId;
        this.displayName = name;

        this.heroes = [];
        this.heroGemType = new Set();
    }

    getTotalHeroAlive() {
        return this.getHerosAlive().length;
    }

    getHeroById(id) {
        return this.heroes.find(her => her.id == id);
    }

    getHerosAlive() {
        return this.heroes.filter(hero => hero.isAlive());
    }

    isAlive() {
        return this.getTotalHeroAlive() > 0;
    }

    getTotalHp() {
        return this.getHerosAlive().reduce((acc, hero) => acc + hero.hp, 0);
    }

    getTotalMana() {
        return this.getHerosAlive().reduce((acc, hero) => acc + hero.mana, 0);
    }

    getTotalMaxMana() {
        return this.getHerosAlive().reduce((acc, hero) => acc + hero.maxMana, 0);
    }

    getCastableHeros() {
        let arr = this.getHerosAlive().filter(hero => hero.isAlive() && hero.isFullMana());
        return arr;
    }

    sameOne(other) {
        return this.signature == other.signature;
    }

    isLose() {
        return !this.firstHeroAlive();
    }

    anyHeroFullMana() {
        let arr = this.heroes.filter(hero => hero.isAlive() && hero.isFullMana());

        let hero = arr != null && arr != undefined && arr.length > 0 ? arr[0] : null;
        return hero;
    }

    firstHeroAlive() {
        let arr = this.heroes.filter(hero => hero.isAlive());

        let hero = arr != null && arr != undefined && arr.length > 0 ? arr[0] : null;
        return hero;
    }

    getRecommendGemType() {
        this.heroGemType = new Set();

        for (let i = 0; i < this.heroes.length; i++){
            let hero = this.heroes[i];

            for (let j = 0; j < hero.gemTypes.length; j++){
                let gt = hero.gemTypes[j];
                this.heroGemType.add(GemType[gt]);
            }
        }        

        return this.heroGemType;
    }

    firstAliveHeroCouldReceiveMana(type) {
        const res = this.heroes.find(hero => hero.isAlive() && hero.couldTakeMana(type));
        return res;
    }

    clone() {
        const cloned = new Player(this.playerId, this.displayName);
        cloned.heroes = this.heroes.map(hero => hero.clone());
        cloned.heroGemType = new Set(Array.from(this.heroGemType));
        cloned.signature = this.signature;
        cloned.metrics = this.metrics;
        cloned.power = this.power;
        return cloned;
    }

    debug() {
        console.log(`Player ${this.playerId}`);
        for(const hero of this.heroes) {
            hero.debug();
        }
    }
}