const HeroIdEnum = {
  THUNDER_GOD: "THUNDER_GOD", // Zues deal aoe = attack + light gems
  MONK: "MONK", // Orthur +5 damge to all
  AIR_SPIRIT: "AIR_SPIRIT", // Nefia deal damge and remove selected gem type
  SEA_GOD: "SEA_GOD", // Magni + attack and health to 1
  MERMAID: "MERMAID", // Poko
  SEA_SPIRIT: "SEA_SPIRIT", // Terra
  FIRE_SPIRIT: "FIRE_SPIRIT", // Sigmund  deal damge base on enemy attack + red gems
  CERBERUS: "CERBERUS", //Cerberus deal dame = attack + increase self attack
  DISPATER: "DISPATER", //Fate
  ELIZAH: "ELIZAH", // Queen
  TALOS: "TALOS",
  MONKEY: "MONKEY",
  GUTS: "GUTS",

  SKELETON: "SKELETON", // Skeleton
  SPIDER: "SPIDER",
  WOLF: "WOLF",
  BAT: "BAT",
  BERSERKER: "BERSERKER",
  SNAKE: "SNAKE",
  GIANT_SNAKE: "GIANT_SNAKE",
};

class Hero {
  constructor(objHero) {
    this.objHero = objHero;
    this.playerId = objHero.getInt("playerId");
    this.id = objHero.getUtfString("id");
    //this.name = id.name();
    this.attack = objHero.getInt("attack");
    this.hp = objHero.getInt("hp");
    this.mana = objHero.getInt("mana");
    this.maxMana = objHero.getInt("maxMana");

    this.gemTypes = [];
    this.gems = [];
    let arrGemTypes = objHero.getSFSArray("gemTypes");
    for (let i = 0; i < arrGemTypes.size(); i++) {
      const gemName = arrGemTypes.getUtfString(i);
      this.gemTypes.push(gemName);
      this.gems.push(GemType[gemName]);
    }
    this.signature = Math.random();
  }

  updateHero(objHero) {
    this.attack = objHero.getInt("attack");
    this.hp = objHero.getInt("hp");
    this.mana = objHero.getInt("mana");
    this.maxMana = objHero.getInt("maxMana");
  }

  isAlive() {
    return this.hp > 0;
  }

  isFullMana() {
    return this.mana >= this.maxMana;
  }

  isHeroSelfSkill() {
    return HeroIdEnum.SEA_SPIRIT == this.id;
  }

  couldTakeMana(type) {
    return this.isAcceptManaType(type) && !this.isFullMana();
  }

  isAcceptManaType(type) {
    return this.gems.includes(type);
  }

  getManaLacked() {
    return this.maxMana - this.mana;
  }

  getMaxManaCouldTake() {
    return this.getManaLacked();
  }

  takeDamage(damage) {
    this.hp = Math.max(this.hp - Math.round(damage), 0);
    console.log(`Hero ${this.id} take damage ${damage} -> ${this.hp}`);
  }

  burnManaTo(value) {
    this.mana = value;
    console.log(`Hero ${this.id} burn mana to ${value} -> ${this.mana}`);
  }

  burnMana(value) {
    this.mana = Math.max(this.mana - value, 0);
    console.log(`Hero ${this.id} burn mana ${value} -> ${this.mana}`);
  }

  takeMana(value) {
    this.mana += value;
    console.log(`Hero ${this.id} take mana ${value} -> ${this.mana}`);
  }

  buffAttack(additionalAttack) {
    this.attack += additionalAttack;
    console.log(`Hero ${this.id} buff attack ${additionalAttack} -> ${this.attack}`);
  }

  buffMana(additionalMana) {
    this.mana += additionalMana;
    this.mana = Math.min(this.mana, this.maxMana);
    console.log(`Hero ${this.id} buff mana ${additionalMana} -> ${this.mana}`);
  }

  buffHp(additionalHp) {
    this.hp += additionalHp;
    console.log(`Hero ${this.id} buff hp ${additionalHp} -> ${this.hp}`);
  }

  sameOne(other) {
    return this.signature == other.signature;
  }

  useSkill() {
    this.skillUsed++;
  }

  clone() {
    const cloned = new Hero(this.objHero);
    cloned.playerId = this.playerId;
    cloned.id = this.id;
    cloned.attack = this.attack;
    cloned.hp = this.hp;
    cloned.mana = this.mana;
    cloned.maxMana = this.maxMana;
    cloned.gemTypes = this.gemTypes;
    cloned.gems = this.gems;
    cloned.signature = this.signature;
    cloned.power = this.power;
    cloned.skillPower = this.skillPower;
    cloned.metrics = this.metrics;
    cloned.skillUsed = this.skillUsed;
    return cloned;
  }

  debug() {
    console.log(`Hero ${this.id}`);
    console.log("playerId", this.playerId);
    console.log("id", this.id);
    console.log("attack", this.attack);
    console.log("hp", this.hp);
    console.log("mana", this.mana);
    console.log("maxMana", this.maxMana);
    console.log("gemTypes", this.gemTypes);
    console.log("gems", this.gems);
    console.log("metrics", this.metrics);
    console.log("signature", this.signature);
    console.log("power", this.power);
    console.log("skillPower", this.skillPower);
  }
}
