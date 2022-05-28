class AotGameState {
  constructor({ game, grid, botPlayer, enemyPlayer }) {
    this.game = game;
    this.grid = grid;
    this.botPlayer = botPlayer;
    this.enemyPlayer = enemyPlayer;
    this.currentPlayer = botPlayer;
    this.distinctions = [];
    this.turnEffects = [];
    this.hasExtraTurn = false;
    this.everExtraTurn = false;
    this.scores = {};
  }

  setExtraTurn(value) {
    this.hasExtraTurn = value;
    if(this.hasExtraTurn) {
      this.everExtraTurn = true;
    }
    console.log(`Set extra turn ${value}`);
  }

  getTotalMatched(){
    let totalMatched = 0
    for (const effect of this.turnEffects) {
      totalMatched += effect.totalMatched
    }
    return totalMatched
  }

  calcScoreOf(playerId) {
    if(this.scores[playerId]) {
      return this.scores[playerId];
    }
    const player = this.getPlayerById(playerId);
    const enemy = this.getEnemyPlayerById(playerId);
    const score = player.metrics.calc(player, enemy, this); 

    this.scores[playerId] = score;
    return score;
  }

  getPlayerById(id) {
    if(this.botPlayer.playerId == id){
      return this.botPlayer;
    }
    return this.enemyPlayer;
  }

  getEnemyPlayerById(id) {
    if(this.botPlayer.playerId == id){
      return this.enemyPlayer;
    }
    return this.botPlayer;
  }

  isPlayerWin(id) {
    const player = this.getPlayerById(id);
    return player.isLose();
  }

  isPlayerLose(id) {
    const player = this.getPlayerById(id);
    return player.isLose();
  }

  isGameOver() {
    return this.botPlayer.isLose() || this.enemyPlayer.isLose();
  }

  isExtraTurnEver() {
    return this.everExtraTurn;
  }

  totalMove() {
    return this.turnEffects.length;
  }

  isExtraTurn() {
    return this.hasExtraTurn;
  }

  isBotTurn() {
    return this.currentPlayer.sameOne(this.botPlayer);
  }

  switchTurn() {
    console.log(`Switch turn ${this.getCurrentPlayer().playerId} -> ${this.getCurrentEnemyPlayer().playerId}`);
    if(this.isBotTurn()) {
      this.currentPlayer = this.enemyPlayer;
    } else {
      this.currentPlayer = this.botPlayer;
    }
    this.turnEffects = [];
    this.distinctions = [];
  }

  getCurrentPlayer() {
    if(this.isBotTurn()) {
      return this.botPlayer;
    }
    return this.enemyPlayer;
  }

  getCurrentEnemyPlayer() {
    if(this.isBotTurn()) {
      return this.enemyPlayer;
    }
    return this.botPlayer;
  }

  copyTurn(other) {
    this.botPlayer = other.botPlayer;
    this.enemyPlayer
  }

  addDistinction(result) {
    this.distinctions.push(result);
  }

  addTurnEffect(result) {
    this.turnEffects.push(result);
  }

  toalSwordGain() {
    let denied = 0;
    for(const effect of this.turnEffects) {
      denied += denied += effect.attackGem;
    }
    return denied;
  }

  gemDeninedOfPlayer(player) {
    const designedGems  = player.getRecomenedGems();
    let denied = 0;
    for(const distinction of this.distinctions) {
      for(const gem of distinction.removedGems) {
        if(designedGems.includes(gem.type)) {
          denied += 1;
        }
      }
    }

    return denied;
  }

  clone() {
    const game = this.game;
    const grid = this.grid.clone();
    const botPlayer = this.botPlayer.clone();
    const enemyPlayer = this.enemyPlayer.clone();
    const state = new AotGameState({ game, grid, botPlayer, enemyPlayer });
    state.hasExtraTurn = this.hasExtraTurn;
    state.distinctions = [...this.distinctions];
    state.turnEffects = [...this.turnEffects];
    return state;
  }

  debug() {
    console.log('Aot State');
    const currentPlayer = this.getCurrentPlayer();
    console.log('currentPlayer');
    currentPlayer.debug();
    const currentEnemyPlayer = this.getCurrentEnemyPlayer();
    console.log('currentEnemyPlayer');
    currentPlayer.debug();

    console.log(this.distinctions);
    console.log(this.turnEffects);
  }
}

class AotMove {
  type = "";

  debug() {
    console.log(`Move ${this.type}`);
  }
}

class AotCastSkill extends AotMove {
  type = "CAST_SKILL";
  isCastSkill = true;
  targetId = null;
  selectedGem = null;
  gemIndex = null;

  target = null;
  gem = null;

  constructor(hero) {
    super();
    this.hero = hero;
  }

  withTargetHero(target) {
    this.target = target;
    this.targetId = target.id;
    return this;
  }

  withGem(gem) {
    this.gem = gem;
    this.gemIndex = gem.index;
    return this;
  }

  setup() {
    return {
      targetId: this.targetId,
      selectedGem: this.selectedGem,
      gemIndex: this.gemIndex,
    }
  }

  applyToState(state, player) {
    // TBD:
  }

  debug() {
    console.log(`Move ${this.type} ${this.hero.id} target ${this.targetId} gem: ${this.gemIndex}`);
  }
}

class AotChainLightingSkill extends AotCastSkill {

  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    return [new AotChainLightingSkill(hero)];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const targets = enemy.getHerosAlive();
    const toalYellowGem = state.grid.countGemByType(GemType.YELLOW);
    const damage = caster.attack + toalYellowGem;
    for(const enemyHero of targets) {
      enemyHero.takeDamage(damage);
    }
  }
}

class AotDeathTouchSkill extends AotCastSkill {

  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    const targetPriority = [HeroIdEnum.DISPATER, HeroIdEnum.MERMAID, HeroIdEnum.MONK];
    const targetBlacklists = [HeroIdEnum.SKELETON, HeroIdEnum.ELIZAH];
    const enemies = enemyPlayer.getHerosAlive();
    let heroTargetMaxAttack = null;
    let heroTargetPriority = null;
    let currentPriority = null;
    let targetNotBlackList = null;

    for(const targetHero of enemies) {
      if(!targetBlacklists.includes(targetHero.id)) {
        targetNotBlackList = true;
      }

      if(!heroTargetMaxAttack)  {
        heroTargetMaxAttack = targetHero;
      } else if(targetHero.attack > heroTargetMaxAttack.attack) {
        heroTargetMaxAttack = targetHero;
      }

      const priority = targetPriority.findIndex(heroId => targetHero.id == heroId);
      if(priority > -1) {
        if(!heroTargetPriority) {
          heroTargetPriority = targetHero;
          currentPriority = priority;
        } else if(priority < currentPriority) {
          heroTargetPriority = targetHero;
          currentPriority = priority;
        }
      }
    }

    if(targetNotBlackList) {
      return enemyPlayer.getHerosAlive()
      .filter(tar => !targetBlacklists.includes(tar.id))
      .map(targetHero => new AotDeathTouchSkill(hero).withTargetHero(targetHero)) 
    }

    const target = targets[Math.floor(Math.random()*targets.length)];

    return [new AotDeathTouchSkill(hero).withTargetHero(target)];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const targets = enemy.getHerosAlive();
    const damage = 666;
    const target = targets[Math.floor(Math.random()*targets.length)];
    target.takeDamage(target.hp);
  }
}

class AotWindForceSkill extends AotCastSkill {

  constructor(hero, options) {
    super(hero, options);

  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    return state.grid.gems.map((gem) => new AotWindForceSkill(hero).withGem(gem));
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const targets = enemy.getHerosAlive();
    const damage = caster.attack;
    for(const enemyHero of targets) {
      enemyHero.takeDamage(damage);
    }

    const distinction = state.grid.performSquareGrab(this.gem.index);
    const effect = TurnEfect.fromDistinction(distinction);

    return effect;
  }
} 

class AotFocusSkill extends AotCastSkill {
  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    return player.getHerosAlive().map((heroTarget) => new AotFocusSkill(hero).withTargetHero(heroTarget));
  }

  applyToState(state, player, enemy) {
    const turnEffect = new TurnEfect();
    const caster = player.getHeroById(this.hero.id);
    const target = player.getHeroById(this.target.id);
    // caster.burnManaTo(0);
    if(target) {
      target.buffHp(5);
      target.buffAttack(5);
    }
    
    turnEffect.addExtraTurn(1);
    
    return turnEffect;
  }
} 

class AotEathShockSkill extends AotCastSkill {

  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    const totalMana = enemyPlayer.getTotalMana();
    const maxMana =  enemyPlayer.getTotalMaxMana();
    if(totalMana/maxMana > 1/3) {
      return [new AotEathShockSkill(hero)];
    } 
    return [];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const targets = enemy.getHerosAlive();
    const damage = caster.attack;
    for(const enemyHero of targets) {
      enemyHero.takeDamage(damage);
      enemyHero.burnMana(3);
    }
  }
} 

class AotSoulSwapSkill extends AotCastSkill {
  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    const maxHpGapHero = enemyPlayer.getHerosAlive().reduce((acc, curr) => {
      if(!acc) { return curr; }
      if(curr.hp - hero.hp > hero.hp - acc.hp ) {
        return curr;
      } 
    }, null);

    if(maxHpGapHero.hp - hero.hp > 10) {
      return [new AotSoulSwapSkill(hero).withTargetHero(maxHpGapHero)];
    } else if(hero.hp < 10 && maxHpGapHero.hp - hero.hp > 2) {
      return [new AotSoulSwapSkill(hero).withTargetHero(maxHpGapHero)];
    }

    return [];
  }
} 

class AotCeberusBiteSkill extends AotCastSkill {
  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    return [new AotCeberusBiteSkill(hero)];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const targets = enemy.getHerosAlive();
    const damage = caster.attack + 6;
    for(const enemyHero of targets) {
      enemyHero.takeDamage(damage);
    }
  }
}

class AotBlessOfLightSkill extends AotCastSkill {
  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    const allies = player.getHerosAlive();
    let hasCompanies = false;

    for(const ally of allies) {
      if(ally.id == HeroIdEnum.MONK) {
        continue;
      }
      if(ally.id == HeroIdEnum.CERBERUS || ally.id == HeroIdEnum.MERMAID) {
        hasCompanies = true;
        if(ally.maxMana - ally.mana < 4) {
          return [new AotBlessOfLightSkill(hero)]
        }
      }
    } 

    if(!hasCompanies) {
      return [new AotBlessOfLightSkill(hero)];
    }

    return [];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    // caster.burnManaTo(0);
    const allies = player.getHerosAlive();
    for(const ally of allies) {
      ally.buffAttack(8);
    }
  }
}

class AotVolcanoWrathSkill extends AotCastSkill {
  constructor(hero, options) {
    super(hero, options);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    const targetPriovity = [HeroIdEnum.DISPATER, HeroIdEnum.MERMAID, HeroIdEnum.MONK];
    const targetBlacklitst = [HeroIdEnum.SKELETON, HeroIdEnum.ELIZAH];
    const toalRedGem = state.grid.countGemByType(GemType.RED);
    const enemies = enemyPlayer.getHerosAlive();
    let heroTargetCanKill = null;
    let heroTargetMaxAttack = null;
    let heroTargetPriovity = null;
    let currentPriovity = null;
    let targetNotBlackList = null;

    for(const targetHero of enemies) {
      if(!targetBlacklitst.includes(targetHero.id)) {
        targetNotBlackList = true;
      }

      const skillDamge = targetHero.attack + toalRedGem;
      if(skillDamge >=  targetHero.hp && !(targetHero.id == HeroIdEnum.ELIZAH && targetHero.isFullMana())) {
        if(!heroTargetCanKill) {
          heroTargetCanKill = targetHero;
        } else if(targetHero.maxMana - targetHero.mana < 3) {
          heroTargetCanKill = targetHero;
        } else if ( heroTargetCanKill.attack < targetHero.attack) {
          heroTargetCanKill = targetHero;
        }
      }

      if(!heroTargetMaxAttack)  {
        heroTargetMaxAttack = targetHero;
      } else if(targetHero.attack > heroTargetMaxAttack.attack) {
        heroTargetMaxAttack = targetHero;
      }

      const priovity = targetPriovity.findIndex(heroId => targetHero.id == heroId);
      if(priovity > -1) {
        if(!heroTargetPriovity) {
          heroTargetPriovity = targetHero;
          currentPriovity = priovity;
        } else if(priovity < currentPriovity) {
          heroTargetPriovity = targetHero;
          currentPriovity = priovity;
        }
      }
    }

    if(heroTargetCanKill) {
      return [new AotVolcanoWrathSkill(hero).withTargetHero(heroTargetCanKill)];
    } else if(heroTargetMaxAttack && heroTargetMaxAttack.attack > 10) {
      return [new AotVolcanoWrathSkill(hero).withTargetHero(heroTargetMaxAttack)];
    } else if(heroTargetPriovity) {
      return [new AotVolcanoWrathSkill(hero).withTargetHero(heroTargetPriovity)];
    }

    if(targetNotBlackList) {
      return enemyPlayer.getHerosAlive()
      .filter(tar => !targetBlacklitst.includes(tar.id))
      .map(targetHero => new AotVolcanoWrathSkill(hero).withTargetHero(targetHero)) 
    }

    return enemyPlayer.getHerosAlive()
      .map(targetHero => new AotVolcanoWrathSkill(hero).withTargetHero(targetHero))
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    const totalRedGem = state.grid.countGemByType(GemType.RED);
    const target = player.getHeroById(this.target.id);
    if(!target) {
      return;
    }
    // caster.burnManaTo(0);
    if(target) {
      const damage = totalRedGem + target.attack;
      target.takeDamage(totalRedGem);
    }

  }
}

class AotChargeSkill extends AotCastSkill {
  constructor(hero) {
    super(hero);
  }

  static fromHeroState(hero, player, enemyPlayer, state) {
    return [new AotChargeSkill(hero)];
  }

  applyToState(state, player, enemy) {
    const caster = player.getHeroById(this.hero.id);
    const targets = enemy.getHerosAlive();
    // caster.burnManaTo(0);
    const damage = caster.attack;
    caster.buffAttack(caster.attack);
    for(const enemyHero of targets) {
      enemyHero.takeDamage(damage);
    }
  }
}

class AotSwapGem extends AotMove {
  type = "SWAP_GEM";
  isSwap = true;
  constructor(swap) {
    super();
    this.swap = swap;
  }

  debug() {
    console.log(`Move ${this.type} gem: ${this.swap.type} ${this.swap.index1}/${this.swap.index2}`);
  }
}

class ScaleFn {}

class LinearScale extends ScaleFn {
  constructor(a, b) {
    super();
    this.a = a;
    this.b = b;
  }

  exec(x) {
    return this.a * x + this.b;
  }
}

class AttackDamgeMetric extends ScaleFn {
  exec(gem, hero) {
    if (gem < 3) {
        return 0;
    }
    const baseDamge = hero.attack;
    const extraDamge = (gem - 3) * 5;
    const damge = baseDamge + extraDamge;
    return damge;
  }
}

class SumScale extends ScaleFn {
  exec(...args) {
    return args.reduce((a, c) => a + c, 0);
  }
}

class TurnEfect {
  isCastSkill = false;
  manaGem = {};
  attackGem = 0;
  buffAttack = 0;
  buffExtraTurn = 0;
  buffHitPoint = 0;
  buffMana = 0;
  buffPoint = 0;
  maxMatchedSize = 0;
  totalMatched = 0;

  static fromDistinction(distinction) {
    const turnEffect = new TurnEfect();
    const maxMatchedSize = Math.max(...distinction.matchesSize);
    turnEffect.maxMatchedSize = maxMatchedSize;
    turnEffect.totalMatched = distinction.removedGems.length;

    for (const gem of distinction.removedGems) {
      if(gem.type == GemType.SWORD) {
        turnEffect.addAttack(gem);
      } else {
        turnEffect.addCollect(gem);
      }

      if(gem.modifier == GemModifier.BUFF_ATTACK) {
        turnEffect.addBuffAttack(gem);
      }

      if(gem.modifier == GemModifier.EXTRA_TURN) {
        turnEffect.addExtraTurn(gem);
      }

      if(gem.modifier == GemModifier.HIT_POINT) {
        turnEffect.addHitPoint(gem);
      }

      if(gem.modifier == GemModifier.MANA) {
        turnEffect.addBuffMana(gem);
      }

      if(gem.modifier == GemModifier.POINT) {
        turnEffect.addBuffPoint(gem);
      }
    }

    return turnEffect;
  }
  addBuffAttack(gem) {
    this.buffAttack += 1;
  }

  addExtraTurn(gem) {
    this.buffExtraTurn += 1;
  }

  addHitPoint(gem) {
    this.buffHitPoint += 1;
  }

  addBuffMana(gem) {
    this.buffMana += 1;
  }

  addBuffPoint(gem) {
    this.buffPoint += 0;
  }

  addAttack(gem){
    this.attackGem += 1;
  }

  addCollect(gem) {
    if(!this.manaGem[gem.type]) {
      this.manaGem[gem.type] = 0;
    }
    this.manaGem[gem.type] += 1;
  }

  debug() {
    console.log(`Effect is skill ${this.isCastSkill}`);
    console.log(`Collection ${JSON.stringify(this.manaGem)}, totalMatched: ${this.totalMatched}, MaxMatchSize: ${this.maxMatchedSize}`);
    console.log(`Attack: ${this.attackGem}`);
    console.log(`Buffs: buffAttack ${this.buffAttack}, buffMana ${this.buffMana}, buffExtraTurn ${this.buffExtraTurn}, buffHitPoint ${this.buffHitPoint}, buffPoint ${this.buffPoint}`)
  }
}

class GameSimulator {
  buffAttackMetric = new LinearScale(3, 0);
  buffHitPointMetric = new LinearScale(3, 0);
  buffManaMetric = new LinearScale(2, 0);
  damgeMetric = new AttackDamgeMetric();

  constructor(state) {
    this.state = state;
  }

  getState() {
    return this.state;
  }

  applyMove(move) {
    if (move.isSwap) {
      return this.applySwap(move);
    } else if (move.isCastSkill) {
      return this.applyCastSkill(move);
    }
    return this;
  }

  applySwap(move) {
    const { swap } = move;
    const { index1, index2 } = swap;
    const result = this.state.grid.performSwap(index1, index2);
    this.applyDistinctionResult(result);
    return result;
  }

  applyDistinctionResult(result) {
    this.state.addDistinction(result);
    const turnEffect = TurnEfect.fromDistinction(result);
    this.applyTurnEffect(turnEffect);
  }
  
  applyTurnEffect(turn) {
    this.state.addTurnEffect(turn);

    if(turn.attackGem) {
      this.applyAttack(turn.attackGem);
    }
    
    for (const [type, value] of Object.entries(turn.manaGem)) {
      this.applyMana(type, value);
    }
    
    if(turn.maxMatchedSize) {
      this.applyMaxMatchedSize(turn.maxMatchedSize);
    }

    if(turn.buffAttack ) {
        this.applyBuffAttack(turn.buffAttack);
    }

    if(turn.buffMana) {
      this.applyHitPoint(turn.buffHitPoint);
    }

    if(turn.buffExtraTurn ) {
      this.applyBuffExtraTurn(turn.buffExtraTurn);
    }
  }

  applyMaxMatchedSize(value) {
    if(value >= 5) {
      this.state.setExtraTurn(true);
    }
  }

  applyBuffExtraTurn(value) {
    if(value > 0) {
      this.state.setExtraTurn(true);
    }
  }

  applyBuffMana(value) {
    const additionalMana = this.buffManaMetric.exec(value);
    this.state
      .getCurrentPlayer()
      .getHerosAlive()
      .forEach(hero => hero.buffMana(additionalMana));
  }

  applyHitPoint(value) {
    const additionalHp = this.buffHitPointMetric.exec(value);
    this.state
      .getCurrentPlayer()
      .getHerosAlive()
      .forEach(hero => hero.buffHp(additionalHp));
  }

  applyBuffAttack(value) {
    const additionalAttack = this.buffAttackMetric.exec(value);
    this.state
      .getCurrentPlayer()
      .getHerosAlive()
      .forEach(hero => hero.buffAttack(additionalAttack));
  }

  applyAttack(attackGem) {
    const myHeroAlive = this.state.getCurrentPlayer().firstHeroAlive();
    if(!myHeroAlive) {
      return;
    }
    const attackDame = this.damgeMetric.exec(attackGem, myHeroAlive);
    const enemyHeroAlive = this.state.getCurrentEnemyPlayer().firstHeroAlive();
    if(!enemyHeroAlive) {
      return;
    }
    enemyHeroAlive.takeDamage(attackDame);
  }

  applyMana(type, value) {
    const firstAliveHeroCouldReceiveMana = this.state
      .getCurrentPlayer()
      .firstAliveHeroCouldReceiveMana(+type);
    if (firstAliveHeroCouldReceiveMana) {
      const maxManaHeroCanReceive =
        firstAliveHeroCouldReceiveMana.getMaxManaCouldTake();
      const manaToSend = Math.min(value, maxManaHeroCanReceive);
      firstAliveHeroCouldReceiveMana.takeMana(manaToSend);

      const manaRemains = value - manaToSend;
      if (manaRemains > 0) {
        return this.applyMana(type, manaRemains);
      }
    }
    return value;
  }

  applyCastSkill(move) {
    const currentPlayer = this.state.getCurrentPlayer();
    const currentEnemyPlayer = this.state.getCurrentEnemyPlayer();

    if(move.applyToState) {
      let result = move.applyToState(this.state, currentPlayer, currentEnemyPlayer);
      move.hero.useSkill();

      if(!result) {
        result = new TurnEfect();
      } 
      result.isCastSkill = true;

      console.log(`Move applied use skill`);
      move.debug();
      console.log(`Move effect`);
      result.debug();

      this.applyTurnEffect(result);
      return result;
    }
  }
}

class AttackDamgeScoreMetric {
  exec(hero, enemyPlayer) {
    //todo: check has hero counter phisical damge 
    return hero.attack;
  }
}

class AotLineUpSetup {
  static line = []
  constructor(player, enemy) {
    this.player = player;
    this.enemy = enemy;
    this.metrics = this.createScoreMetrics();
  }

  createScoreMetrics() {
    return new AotScoreMetric(this);
  }

  static isMatched(player) {
    return player.heroes.every(hero => this.line.includes(hero.id))
  }
}

class AotGeneralLineup extends AotLineUpSetup {

}

class AotDynamicLineup extends AotLineUpSetup {
  static line = [];

  createScoreMetrics() {
    return new AotDynamicScoreMetric(this);
  }
}

class AotAllInLineup extends AotLineUpSetup {
  static name = 'ALL_IN';

  name = 'ALl_IN';
  static line = [HeroIdEnum.MONK, HeroIdEnum.MERMAID, HeroIdEnum.CERBERUS];

  createScoreMetrics() {
    return new AotAllInScoreMetric(this);
  }
}


class AotLineUpFactory {
  static lineups = [AotAllInLineup];
  metrics = null;

  static ofPlayer(player, enemy) {
    for(const lineup of this.lineups) {
      if(lineup.isMatched(player)) {
        return new lineup(player, enemy);
      }
    }

    return new AotDynamicLineup(player, enemy);
  }

  allIn(player, enemy) {
    return new AotAllInLineup(player, enemy);
  }

  static dynamic(player, enemy) {
    return new AotDynamicLineup(player, enemy);
  }

}

class AotHeroMetricScale extends ScaleFn {
  constructor(fn) {
    super();
    this.fn = fn;
  }
  exec(hero, player, enemyPlayer, state) {
    return this.fn(hero, player, enemyPlayer, state);
  }
}

class AotHeroMetrics {
  hpScale = 1;
  manaScale = 1;
  baseManaScale = 2;
  attackScale = 0.2;
  skillMetricScale = 1;

  hpMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.hp*this.hpScale;
  });

  manaMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return (hero.mana*this.manaScale/hero.maxMana + this.baseManaScale)/(this.manaScale + this.baseManaScale);
  });

  attackMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.attack*this.attackScale;
  });

  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.attack;
  });

  static isMatched(hero) {
    return false;
  }

  // hero metrics are represent by power
  // power is caculated by atk, hp, skill damge and mana
  // power = atk + (hp * 2) + (mana/maxMana + 1)*skillDamge;
  calcScore(hero, player, enemyPlayer, state) {
    if(!hero.isAlive()) {
      return 0;
    }

    if(hero.power != undefined) {
      return hero.power;
    }

    const attackPower = this.attackMetric.exec(hero, player, enemyPlayer, state);
    const hpPower = this.hpMetric.exec(hero, player, enemyPlayer, state);
    const manaPower = this.manaMetric.exec(hero, player, enemyPlayer, state);
    const skillPower = this.skillMetric.exec(hero, player, enemyPlayer, state);
    const heroPower = attackPower + hpPower + manaPower * skillPower * this.skillMetricScale;
    console.log(`Hero score ${player.playerId} ${hero.id} heroPower ${heroPower} =  ${attackPower} + ${hpPower} + ${manaPower} *  ${skillPower} * ${this.skillMetricScale}`);
    hero.power = heroPower;
    return heroPower;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return [new AotCastSkill(hero, player, enemyPlayer, state)];
  }
}

class AotGeneralHeroMetrics extends AotHeroMetrics {
  static fromHero(hero, player, enemy) {
    return new this(hero, player, enemy);
  }
}
class AotScoreMetric {
  score = 0;
  heroMetrics = [];
  sumMetric = new SumScale();

  constructor(lineup) {
    for(const hero of lineup.player.heroes) {
      const heroMetrics = this.createHeroMetric(hero, lineup.player, lineup.enemy);
      hero.metrics = heroMetrics;
    }
  }

  createHeroMetric(hero, player, enemy) {
    return new AotGeneralHeroMetrics(hero, player, enemy);
  }

  calcHeroScore(hero, player, enemyPlayer, state) {
    const score = hero.metrics.calcScore(hero, player, enemyPlayer, state);
    return score;
  }

  calcScoreOfPlayer(player, enemyPlayer, state) {
    if(!player.isAlive()) {
      return 0;
    }

    const heros = player.getHerosAlive();
    const heroScores = heros.map((hero) => {
      const heroScore = this.calcHeroScore(hero, player, enemyPlayer, state);
      return heroScore;
    });
    const totalHeroScore = this.sumMetric.exec(...heroScores);
    return totalHeroScore;
  }

  calc(player, enemy, state) {
    for(const hero of [].concat(player.heroes, enemy.heroes)) {
      hero.power = undefined;
      hero.skillPower = undefined;
    }

    const playerScore = this.calcScoreOfPlayer(player, enemy, state);
    console.log(`Current player ${player.playerId} score ${playerScore}`);

    if(playerScore == 0) {
      return 0;
    }
    
    for(const hero of [].concat(player.heroes, enemy.heroes)) {
      hero.power = undefined;
      hero.skillPower = undefined;
    }

    const enemyScore =  this.calcScoreOfPlayer(enemy, player, state);
    console.log(`Current enemy ${enemy.playerId} score ${enemyScore}`);

    if(playerScore == 0) {
      return Number.POSITIVE_INFINITY;
    }

    const score = playerScore / enemyScore;
    console.log(`calc score ${playerScore} / ${enemyScore} = ${score}`)
    return score;
  }
}

class AotSigmudHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const totalRedGems = state.grid.countGemByType(GemType.RED);
    const heroTarget = this.bestHeroToSkillTarget(hero, player, enemyPlayer, state);
    if ( !heroTarget ) {
      return 0;
    }
    const skillPower = heroTarget.attack + totalRedGems;
    this.skillPower = skillPower;
    return skillPower;
  });

  bestHeroToSkillTarget(hero, player, enemyPlayer, state) {
    const heroesAlive = enemyPlayer.getHerosAlive();
    const totalRedGems = state.grid.countGemByType(GemType.RED);

    const heroMaxAttack = heroesAlive.reduce((acc, curr) => {
      if(acc.attack >= curr.attack) {
        return acc;
      }
      return curr;
    }, heroesAlive[0]);
    return heroMaxAttack;
  }

  static isMatched(hero) {
    return hero.id == HeroIdEnum.FIRE_SPIRIT;
  }


  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotVolcanoWrathSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
}

class AotTerraHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const bestPowerGap = player.getHerosAlive().reduce((acc, curr) => {
      if(curr.id == hero.id) {
        return acc;
      }
      const cloned = curr.clone();
      curr.hp += 5;
      curr.attack += 5;
      const clonedPower = cloned.metrics.calcScore(cloned, player, enemyPlayer, state, true);
      const originalPower = curr.metrics.calcScore(curr, player, enemyPlayer, state, true);
      const powerGap = clonedPower - originalPower;
      if(powerGap > acc) {
        return powerGap;
      }
      return acc;
    }, 10)
    return bestPowerGap;
  }, 0);

  static isMatched(hero) {
    return hero.id == HeroIdEnum.SEA_SPIRIT;
  }


  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotFocusSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
}

class AotMagniHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillPower = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack, 0);
    return skillPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.SEA_GOD;
  }


  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotEathShockSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
}

class AotOrthurHeroMetric extends AotHeroMetrics {

  static allIn() {
    const metric = new AotOrthurHeroMetric();
    metric.skillMetricScale = 4;
    metric.baseManaScale = 1;
    metric.manaScale = 2;
    return metric;
  }

  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const addDamage = hero.attack > 10 ? 2 : 8; 
    const additionalPower = player.getHerosAlive().reduce((acc, curr) => {
      if(curr.id == hero.id) {
        return acc + addDamage;
      }

      const cloned = curr.clone();
      cloned.attack += addDamage;
      const originalPower = curr.metrics.calcScore(curr, player, enemyPlayer, state, true);
      const clonedPower = cloned.metrics.calcScore(cloned, player, enemyPlayer, state, true);
      const powerGap = clonedPower - originalPower;
      return acc + powerGap;
    }, 0);
    
    return additionalPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.MONK;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotBlessOfLightSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
}

class AotCerberusHeroMetric extends AotHeroMetrics {
  
  static allIn() {
    const metric = new AotCerberusHeroMetric();
    metric.skillMetricScale = 2;
    metric.baseManaScale = 1;
    metric.manaScale = 2;
    return metric;
  }

  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillPower = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack + (2 * 3), 0);
    return skillPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.CERBERUS;
  }


  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotCeberusBiteSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
} 

class AotZeusHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const totalYellowGems = state.grid.countGemByType(GemType.YELLOW);
    const skillDamge = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack + totalYellowGems, 0);
    const skillPower = skillDamge;
    return skillPower;
  });


  static isMatched(hero) {
    return hero.id == HeroIdEnum.THUNDER_GOD;
  }


  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotChainLightingSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
} 

class AotFateHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const heroTarget = this.bestHeroToSkillTarget(hero, player, enemyPlayer, state);
    const powerTarget = heroTarget.metrics.calcScore(heroTarget, enemyPlayer, player, state, true);
    const skillPower = powerTarget;
    return skillPower;
  });

  bestHeroToSkillTarget(hero, player, enemyPlayer, state) {
    const heroesAlive = enemyPlayer.getHerosAlive();
    const heroMaxPower = heroesAlive.reduce((acc, curr) => {
      const curPower = curr.mana + acc.attack;
      const accPower = acc.mana + acc.attack;
      if(curPower > accPower) {
        return curr;
      }
      return acc;
    }, heroesAlive[0]);
    return heroMaxPower;
  }

  static isMatched(hero) {
    return hero.id == HeroIdEnum.DISPATER;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotDeathTouchSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
} 

class AotPokoHeroMetric extends AotHeroMetrics {
  static allIn() {
    const metric = new AotPokoHeroMetric();
    metric.skillMetricScale = 2;
    metric.baseManaScale = 1;
    metric.manaScale = 2;
    return metric;
  }

  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillDamge = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack * 2, 0);
    const skillPower = skillDamge;
    return skillPower;
  });


  static isMatched(hero) {
    return hero.id == HeroIdEnum.MERMAID;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotChargeSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
} 

class AotQueenMetric extends AotHeroMetrics {

  hpMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.hp + 13;
  });

  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return 0;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.ELIZAH;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return [];
  }
} 

class AotSketletonHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const targetHero = this.bestHeroToSkillTarget(hero, player, enemyPlayer, state)
    const skillDamge = (hero.hp - targetHero.hp) * 4;
    return skillDamge;
  });

  bestHeroToSkillTarget(hero, player, enemyPlayer, state) {
    const heroesAlive = enemyPlayer.getHerosAlive();
    const heroMaxPower = heroesAlive.reduce((acc, curr) => {
      if(acc.hp > curr.hp) {
        return acc;
      }
      return curr;
    }, heroesAlive[0]);
    return heroMaxPower;
  }


  static isMatched(hero) {
    return hero.id == HeroIdEnum.SKELETON;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotSoulSwapSkill.fromHeroState(hero, player, enemyPlayer, state);
  }

} 

class AotNefiaHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillDamge = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack, 0);
    const skillPower = skillDamge;
    return skillPower;
  });


  static isMatched(hero) {
    return hero.id == HeroIdEnum.AIR_SPIRIT;
  }

  getPossibleSkillCasts(hero, player, enemyPlayer, state) {
    return AotWindForceSkill.fromHeroState(hero, player, enemyPlayer, state);
  }
} 

class AotDynamicScoreMetric extends AotScoreMetric {
  static heroMetricsClass = [
    AotNefiaHeroMetric,
    AotSketletonHeroMetric,
    AotPokoHeroMetric, 
    AotFateHeroMetric, 
    AotZeusHeroMetric, 
    AotCerberusHeroMetric, 
    AotOrthurHeroMetric,
    AotMagniHeroMetric,
    AotTerraHeroMetric,
    AotSigmudHeroMetric,
    AotQueenMetric,
  ];
  constructor(lineup) {
    super(lineup);
  }

  createHeroMetric(hero) {
   for(const metric of AotDynamicScoreMetric.heroMetricsClass) {
     if (metric.isMatched(hero)) {
       return new metric();
     }
   }
   return new AotGeneralHeroMetrics();
  }
}

class AotAllInScoreMetric extends AotScoreMetric {
  constructor(lineup) {
    super(lineup);
  }

  createHeroMetric(hero) {
    if(hero.id == HeroIdEnum.MONK) {
      return AotOrthurHeroMetric.allIn();
    }

    if(hero.id == HeroIdEnum.CERBERUS) {
      return AotCerberusHeroMetric.allIn();

    }

    if(hero.id == HeroIdEnum.MERMAID) {
      return AotPokoHeroMetric.allIn();
    }
  }
}

class AoTStrategy {
  static name = "aot";
  static factory() {
    return new AoTStrategy();
  }

  setGame({ game, grid, botPlayer, enemyPlayer }) {
    this.game = game;

    this.initPlayer(botPlayer, enemyPlayer);
    this.initPlayer(enemyPlayer, botPlayer);
    
    this.state = new AotGameState({ grid, botPlayer, enemyPlayer });
    this.snapshots = [];
  }

  initPlayer(player, enemy) {
    player.lineup = AotLineUpFactory.ofPlayer(player, enemy);
    player.metrics = player.lineup.metrics;
  }

  playTurn() {
    console.log(`${AoTStrategy.name}: playTurn`);
    const action = this.chooseBestPossibleMove(this.state, 1);
    if(!action) {
      console.log("Cannot choose");
      return;
    }
    if (action.isCastSkill) {
      console.log(`${AoTStrategy.name}: Cast skill`);
      this.castSkillHandle(action.hero, action.setup());
    } else if (action.isSwap) {
      console.log(`${AoTStrategy.name}: Swap gem`);
      this.swapGemHandle(action.swap);
    }
  }

  getCurrentState() {
    return this.state.clone();
  }

  chooseBestPossibleMove(state, deep = 2) {
    console.log(`${AoTStrategy.name}: chooseBestPosibleMove`);
    const possibleMoves = this.getAllPossibleMove(state);
    const currentPlayer = state.getCurrentPlayer();
    const currentEnemyPlayer = state.getCurrentEnemyPlayer()
    console.log(`Player ${currentPlayer.playerId} Choose best move in ${possibleMoves.length} moves againts ${currentEnemyPlayer.playerId}`);

    if(!possibleMoves || possibleMoves.length == 0) {
      return null;
    }

    let currentBestMove = null;
    let currentBestState = null;

    for (const move of possibleMoves) {
      const clonedState = state.clone();
      console.log(`Test move deep ${deep} ${move.type} step ${possibleMoves.indexOf(move)}/${possibleMoves.length}`);
      move.debug();
      const futureState = this.seeFutureState(move, clonedState, deep);

      for(const distinction of futureState.distinctions) {
        console.log(`Turn distinction ${futureState.distinctions.indexOf(distinction)}/${futureState.distinctions.length}`)
        distinction.debug();
      }

      for(const effect of futureState.turnEffects) {
        console.log(`Turn effect ${futureState.turnEffects.indexOf(effect)}/${futureState.turnEffects.length}`)
        effect.debug();
      }
      const simulateMoveScore = this.compareScoreOnStates(currentBestState, futureState.clone(), currentPlayer, currentEnemyPlayer);
      console.log('State compare', simulateMoveScore);
      if (simulateMoveScore == 2) {
        currentBestMove = move;
        currentBestState = futureState;
      } 
    }
    console.log('best score', currentBestState.scores[currentPlayer.playerId]);
    console.log('best move');
    currentBestMove.debug();
    
    return currentBestMove;
  }

  seeFutureState(move, state, deep) {
    const clonedState = state.clone();

    if(!move) {
      return clonedState;
    }

    if(clonedState.isGameOver()) {
      return clonedState;
    }

    const futureState = this.applyMoveOnState(move, clonedState);
    
    if (deep === 1) {
      return futureState;
    }

    const clonedFutureState = futureState.clone();
    if (clonedFutureState.isExtraTurn()) {
      clonedFutureState.setExtraTurn(false);
      const newMove = this.chooseBestPossibleMove(clonedFutureState, deep);
      return this.seeFutureState(newMove, clonedFutureState, deep);
    }
    
    clonedFutureState.switchTurn();
    const newMove = this.chooseBestPossibleMove(clonedFutureState, deep - 1);
    const afterState = this.seeFutureState(newMove, clonedFutureState, deep - 1);
    return afterState;
  }

  compareScoreOnStates(state1, state2, player, enemy) {
    if(!state1) {
      return 2;
    }

    if(!state2) {
      return 1;
    }

    if(state1.isPlayerWin(player.playerId)) {
      console.log(`Player ${player.playerId} wins`);
      return 1;
    }

    if(state2.isPlayerWin(player.playerId)) {
      console.log(`Player ${player.playerId} wins`);
      return 2;
    }

    if(state1.isPlayerLose(player.playerId)) {
      console.log(`Player ${player.playerId} lost`);
      return 2;
    }

    if(state2.isPlayerLose(player.playerId)) {
      console.log(`Player ${player.playerId} lost`);
      return 1;
    }

    if(state2.totalMove() > state1.totalMove()) {
      console.log(`Total move ${state2.totalMove()} over ${state1.totalMove()}`);
      return 2;
    }

    const [effect1] = state1.turnEffects;
    const [effect2] = state2.turnEffects;

    if(state2.isExtraTurn() && !effect2.isCastSkill) {
      console.log(`Got extra turn on swap`);
      return 2;
    }

    // // handle case chossing between cast skill and sword
    // if(effect2 && effect1 && effect2.isCastSkill && !effect1.isCastSkill) {
    //   console.log(`Compare score of state effect2 isCastSkill ${effect2.isCastSkill} effect1 isCastSkill ${effect1.isCastSkill}`);
    //   const sword1 = state1.toalSwordGain();
    //   console.log(`Total sword1 gain ${sword1}`);
    //   const damageMetric  = new AttackDamgeMetric();
    //   const playerFirstHero = player.firstHeroAlive();
    //   const enemyFirstHero = enemy.firstHeroAlive();
    //   console.log(`Compare cast skill with sword`);

    //   const playerDamage = damageMetric.exec(sword1, playerFirstHero);
    //   console.log(`Player damge over enemy hp ${playerDamage}/${enemyFirstHero.hp}`);
    //   if(playerDamage/enemyFirstHero.hp >= 0.5) {
    //     return 1;
    //   } 

    //   const enemyDamage = damageMetric.exec(sword1, playerFirstHero);
    //   console.log(`Enemy damge over player hp ${enemyDamage}/${playerFirstHero.hp}`);
    //   if(enemyDamage/playerFirstHero.hp >= 0.5) {
    //     return 1;
    //   }
      
    //   const enemyFullMana = enemy.anyHeroFullMana();
    //   if(!enemyFullMana) {
    //     console.log(`Has no enemy hero full mana`);
    //     return 1;
    //   }
    // }

    const score1 = this.calculateScoreOnStateOf(state1, player);
    const score2 = this.calculateScoreOnStateOf(state2, player);
    
    // if(score1 == score2 ){
    //   console.log(`Got same score ${score1}  ${score2}`);

    //   if(state2.gemDeninedOfPlayer(enemy) > state1.gemDeninedOfPlayer(enemy)) {
    //     console.log(`Got total denied ${state2.gemDeninedOfPlayer(enemy)} / ${state1.gemDeninedOfPlayer(enemy)}`);
    //     return 2;
    //   }

    //   if (state2.getTotalMatched() > state1.getTotalMatched()) {
    //     console.log(`Got total matched ${state2.getTotalMatched()} / ${state1.getTotalMatched()}`);
    //     return 2;
    //   }
    // }

    if(player.lineup.name == AotAllInLineup.name) {
      if(effect2 && effect1 && !effect2.isCastSkill && !effect1.isCastSkill) {
        const skillUsed = player.heroes.reduce(her => her.skillUsed + acc, 0);
        const sword2 = state2.toalSwordGain();
        console.log(`Compare swap turn with ${sword2} swords and ${skillUsed} skill used`);
        if(skillUsed < 3 && sword2 > 0) {
          return 1;
        }
      }
    }

    const result = score2 > score1 ? 2 : 1;
    console.log(`Got score gap 2 ${score2} over 1 ${score1} select ${result}`);
    return result;
  }

  calculateScoreOnStateOf(state, player) {
    const score = state.calcScoreOf(player.playerId);
    return score;
  }

  applyMoveOnState(move, state) {
    const cloneState = state.clone();
    const simulator = new GameSimulator(cloneState);
    simulator.applyMove(move);
    const newState = simulator.getState();
    return newState;
  }

  getAllPossibleMove(state) {
    const possibleSkillCasts = this.getAllPossibleSkillCast(state);
    const possibleGemSwaps = this.getAllPossibleGemSwap(state);
    return [...possibleGemSwaps, ...possibleSkillCasts];
  }

  getAllPossibleSkillCast(state) {
    const currentPlayer = state.getCurrentPlayer();
    const currentEnemy = state.getCurrentEnemyPlayer();

    const castableHeroes = currentPlayer.getCastableHeros();
    console.log(`All castable heros ${castableHeroes.map(hero => `${hero.id} ${hero.mana}/${hero.maxMana}`)}`)
    const possibleCastOnHeros = castableHeroes.map((hero) =>
      this.possibleCastOnHero(hero, currentPlayer, currentEnemy, state)
    );
    const allPossibleCasts = [].concat(...possibleCastOnHeros);
    console.log(`All possible casts ${allPossibleCasts.length}`);
    const focusSkillCasts = allPossibleCasts.filter(skill => skill.hero.id == HeroIdEnum.SEA_SPIRIT);

    if(focusSkillCasts.length > 0) {
      return focusSkillCasts;
    }

    const blessedCasts = allPossibleCasts.filter(skill => skill.hero.id == HeroIdEnum.MONK);

    if(blessedCasts.length > 0) {
      return blessedCasts;
    }

    const deathCast = allPossibleCasts.filter(skill => skill.hero.id == HeroIdEnum.DISPATER);
    if(deathCast.length > 0) {
      return deathCast;
    }

    return allPossibleCasts;
  }

  possibleCastOnHero(hero, player, enemy, state) {
    if(hero.metrics && hero.metrics.getPossibleSkillCasts) {
      const skills = hero.metrics.getPossibleSkillCasts(hero, player, enemy, state);
      return skills;
    }
    return [];
  }

  getAllPossibleGemSwap(state) {
    const allPosibleSwaps = state.grid.suggestMatch();
    const allSwapMove = allPosibleSwaps  
    .map((swap) => new AotSwapGem(swap));

    return allSwapMove;
  }

  addSwapGemHandle(callback) {
    this.swapGemHandle = callback;
  }

  addCastSkillHandle(callback) {
    this.castSkillHandle = callback;
  }
}

class SeeTheFutureStrategy extends AoTStrategy {
  static name = "see";
  static factory() {
    const strategy = new SeeTheFutureStrategy();
    return strategy;
  }
}

window.strategies = {
  ...(window.strategies || {}),
  [AoTStrategy.name]: AoTStrategy,
  [SeeTheFutureStrategy.name]: SeeTheFutureStrategy,
};
