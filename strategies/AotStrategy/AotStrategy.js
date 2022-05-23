class AotGameState {
  constructor({ game, grid, botPlayer, enemyPlayer }) {
    this.game = game;
    this.grid = grid;
    this.botPlayer = botPlayer;
    this.enemyPlayer = enemyPlayer;
    this.currentPlayer = botPlayer;
    this.distinctions = [];
    this.turnEffects = [];
  }

  calcScoreOf(playerId) {
    const player = this.getPlayerById(playerId);
    const enemy = this.getEnemyPlayerById(playerId);
    return player.metrics.calc(player, enemy, this); 
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

  isGameOver() {
    return this.botPlayer.isLose() || this.enemyPlayer.isLose();
  }

  isExtraturn() {
    return this.hasExtraTurn;
  }

  isBotTurn() {
    return this.currentPlayer.sameOne(this.botPlayer);
  }

  switchTurn() {
    if(this.isBotTurn()) {
      this.currentPlayer = this.botPlayer;
    } else {
      this.currentPlayer = this.enemyPlayer;
    }
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

  clone() {
    const game = this.game;
    const grid = this.grid.clone();
    const botPlayer = this.botPlayer.clone();
    const enemyPlayer = this.enemyPlayer.clone();
    const state = new AotGameState({ game, grid, botPlayer, enemyPlayer });
    state.distinctions = [...this.distinctions];
    state.turnEffects = [...this.turnEffects];
    return state;
  }
}

class AotMove {
  type = "";
}

class AotCastSkill extends AotMove {
  type = "CAST_SKILL";
  isCastSkill = true;
  constructor(hero) {
    super();
    this.hero = hero;
  }
}

class AotSwapGem extends AotMove {
  type = "SWAP_GEM";
  isSwap = true;
  constructor(swap) {
    super();
    this.swap = swap;
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
    return (gem - 3) * hero.attack + hero.attack;
  }
}

class SumScale extends ScaleFn {
  exec(...args) {
    return args.reduce((a, c) => a + c, 0);
  }
}

class TurnEfect {
  attackGem = 0;
  manaGem = {};
  buffAttack = 0;
  buffExtraTurn = 0;
  buffHitPoint = 0;
  buffMana = 0;
  buffPoint = 0;
  maxMatchedSize = 0;

  static fromDistinction(distinction) {
    const turnEffect = new TurnEfect();
    const maxMatchedSize = Math.max(...distinction.matchesSize);
    turnEffect.maxMatchedSize = maxMatchedSize;

    for (const gem of distinction.removedGems) {
      if(gem.type == GemType.SWORD) {
        turnEffect.applyAttack(gem);
      } else {
        turnEffect.applyCollect(gem);
      }

      if(gem.modifier == GemModifier.BUFF_ATTACK) {
        turnEffect.applyBuffAttack(gem);
      }

      if(gem.modifier == GemModifier.EXTRA_TURN) {
        turnEffect.applyExtraTurn(gem);
      }

      if(gem.modifier == GemModifier.HIT_POINT) {
        turnEffect.applyHitPoint(gem);
      }


      if(gem.modifier == GemModifier.MANA) {
        turnEffect.applyMana(gem);
      }

      if(gem.modifier == GemModifier.POINT) {
        turnEffect.applyPoint(gem);
      }
    }

    return turnEffect;
  }
  applyBuffAttack(gem) {
    this.buffAttack += 1;
  }

  applyExtraTurn(gem) {
    this.buffExtraTurn += 1;
  }

  applyHitPoint(gem) {
    this.buffHitPoint += 1;
  }

  applyMana(gem) {
    this.buffMana += 1;
  }

  applyPoint(gem) {
    this.buffPoint += 0;
  }

  applyAttack(gem){
    this.attackGem += 1;
  }

  applyCollect(gem) {
    if(!this.manaGem[gem.type]) {
      this.manaGem[gem.type] = 0;
    }
    this.manaGem[gem.type] += 1;
  }
}

class GameSimulator {
  buffAttackMetric = new LinearScale(2, 0);
  buffHitPointMetric = new LinearScale(2, 0);
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
      this.applySwap(move);
    } else if (move.isCastSkill) {
      this.applyCastSkill(move);
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
    this.state.addTurnEffect(turnEffect);
  }

  applyTurnEffect(turn) {
    this.turnEffect = turn;
    this.applyAttack(turn.attackGem);
    for (const [type, value] of Object.entries(turn.manaGem)) {
      this.applyMana(type, value);
    }
    this.applyMaxMatchedSize(turn.maxMatchedSize);
    this.applyBuffAttack(turn.buffAttack);
    this.applyBuffMana(turn.buffMana);
    this.applyHitPoint(turn.buffHitPoint);
    this.applyBuffExtraTurn(turn.buffExtraTurn);
  }

  applyMaxMatchedSize(value) {
    if(value >= 5) {
      this.state.hasExtraTurn = value > 0;
    }
  }

  applyBuffExtraTurn(value) {
    if(value > 0) {
      this.state.hasExtraTurn = value > 0;
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
    const attackDame = this.damgeMetric.exec(attackGem, myHeroAlive);
    const enemyHeroAlive = this.state.getCurrentEnemyPlayer().firstHeroAlive();
    enemyHeroAlive.takeDamge(attackDame);
  }

  applyMana(type, value) {
    const firstAliveHeroCouldReceiveMana = this.state
      .getCurrentPlayer()
      .firstAliveHeroCouldReceiveMana(+type);
    if (firstAliveHeroCouldReceiveMana) {
      const maxManaHeroCannCeceive =
        firstAliveHeroCouldReceiveMana.getMaxManaCouldTake();
      const manaToSend = Math.max(value, maxManaHeroCannCeceive);
      firstAliveHeroCouldReceiveMana.takeMana(manaToSend);

      const manaRemains = value - manaToSend;
      if (manaRemains > 0) {
        return this.applyMana(type, manaRemains);
      }
    }
    return value;
  }

  applyCastSkill(move) {}
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

class AotLineUpFactory {
  static lineups = [];
  metrics = null;

  static ofPlayer(player, enemy) {
    for(const lineup of this.lineups) {
      if(lineup.isMatched(player)) {
        return new lineup(player, enemy);
      }
    }

    return new AotGeneralLineup(player, enemy);
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

  hpMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.hp * 2;
  });

  manaMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.mana;
  });

  attackMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.attackl;
  });

  maxManaMetric = new AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    return hero.mana;
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
    const hpPower = this.hpMetric.exec(hero, player, enemyPlayer, state);
    const manaPower = this.manaMetric.exec(hero, player, enemyPlayer, state);
    const attackPower = this.attackMetric.exec(hero, player, enemyPlayer, state);
    const maxManaPower = this.maxManaMetric.exec(hero, player, enemyPlayer, state);
    const skillPower = this.skillMetric.exec(hero, player, enemyPlayer, state);
    const heroPower = attackPower + hpPower + (manaPower/maxManaPower + 1) * skillPower;
    return heroPower;
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
      return -999;
    }

    if(!enemyPlayer.isAlive()) {
      return 999;
    }

    const heros = player.getHerosAlive();
    const heroScores = heros.map((hero) => this.calcHeroScore(hero, player, enemyPlayer, state));
    const totalHeroScore = this.sumMetric.exec(...heroScores);
    return totalHeroScore;
  }

  calc(player, enemy, state) {
    const score = this.calcScoreOfPlayer(player, enemy, state);
    return score;
  }
}

class AotSigmudHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const totalRedGems = state.grid.countGemByType(GemType.RED);
    const heroTarget = this.bestHeroToSkillTarget(hero, player, enemyPlayer, state);
    const skillPower = heroTarget.attack + totalRedGems;
    return skillPower;
  });

  bestHeroToSkillTarget(hero, player, enemyPlayer, state) {
    const heroesAlive = enemyPlayer.getHerosAlive();
    const totalRedGems = state.grid.countGemByType(GemType.RED);
    const heroesCankill = heroesAlive.filter(hero => (hero.attack + totalRedGems) >= hero.hp);
    if(heroesCankill.length > 0) {
      const heroMaxPower = heroesCankill.reduce((acc, curr) => {
        const accPower = acc.metrics.calcScore(acc, enemyPlayer, player, state);
        const currPower = curr.metrics.calcScore(curr, enemyPlayer, player, state);
        if(accPower > currPower) {
          return acc;
        }
        return curr;
      }, heroesCankill[0]);
      return heroMaxPower;
    } 

    const heroMaxPower = heroesAlive.reduce((acc, curr) => {
      const accPower = acc.metrics.calcScore(acc, enemyPlayer, player, state);
      const currPower = curr.metrics.calcScore(curr, enemyPlayer, player, state);
      if(accPower > currPower) {
        return acc;
      }
      return curr;
    }, heroesAlive[0]);
    return heroMaxPower;
  }

  static isMatched(hero) {
    return hero.id == HeroIdEnum.FIRE_SPIRIT;
  }
}

class AotTerraHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const bestPowerGap = player.getHerosAlive().reduce((acc, curr) => {
      if(curr.sameOne(hero)) {
        return acc;
      }
      const cloned = curr.clone();
      curr.hp += 5;
      curr.attack += 5;
      const clonedPower = cloned.metrics.calcScore(cloned, player, enemyPlayer, state);
      const originalPower = curr.metrics.calcScore(curr, player, enemyPlayer, state);
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
}

class AotMagniHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillPower = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack, 0);
    return skillPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.SEA_GOD;
  }
}

class AotOrthurHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const additionalPower = player.getHerosAlive().reduce((acc, curr) => {
      if(curr.sameOne(hero)) {
        return acc + 8;
      }

      const cloned = curr.clone();
      curr.attack += 8;
      const originalPower = curr.metrics.calcScore(curr, player, enemyPlayer, state);
      const clonedPower = cloned.metrics.calcScore(cloned, player, enemyPlayer, state);
      const powerGap = clonedPower - originalPower;
      return acc + powerGap;
    }, 0);
    
    return additionalPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.MONK;
  }
}

class AotCerberusHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillPower = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack + (2 * 3), 0);
    return skillPower;
  });

  static isMatched(hero) {
    return hero.id == HeroIdEnum.CERBERUS;
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
} 

class AotFateHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const heroTarget = this.bestHeroToSkillTarget(hero, player, enemyPlayer, state);
    const powerTarget = heroTarget.metrics.calcScore(heroTarget, enemyPlayer, player, state);
    const skillPower = powerTarget;
    return skillPower;
  });

  bestHeroToSkillTarget(hero, player, enemyPlayer, state) {
    const heroesAlive = enemyPlayer.getHerosAlive();
    const heroMaxPower = heroesAlive.reduce((acc, curr) => {
      const accPower = acc.metrics.calcScore(acc, enemyPlayer, player, state);
      const currPower = curr.metrics.calcScore(curr, enemyPlayer, player, state);
      if(accPower > currPower) {
        return acc;
      }
      return curr;
    }, heroesAlive[0]);
    return heroMaxPower;
  }

  static isMatched(hero) {
    return hero.id == HeroIdEnum.DISPATER;
  }
} 

class AotPokoHeroMetric extends AotHeroMetrics {
  skillMetric = new  AotHeroMetricScale((hero, player, enemyPlayer, state) => {
    const skillDamge = enemyPlayer.getHerosAlive().reduce((acc, curr) => acc + hero.attack * 2, 0);
    const skillPower = skillDamge;
    return skillPower;
  });


  static isMatched(hero) {
    return hero.id == HeroIdEnum.MERMAID;
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
    AotSigmudHeroMetric
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
    player.lineup = AotLineUpFactory.dynamic(player, enemy);
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
      console.log(`${AoTStrategy.name}: isCastSkill`);
      this.castSkillHandle(action.hero);
    } else if (action.isSwap) {
      console.log(`${AoTStrategy.name}: isSwap`);
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

    if(!possibleMoves || possibleMoves.length == 0) {
      return null;
    }

    let currentBestMove = possibleMoves[0];
    let currentBestMoveScore = Number.NEGATIVE_INFINITY;
    for (const move of possibleMoves) {
      const futureState = this.seeFutureState(move, state, deep);
      console.log(state, futureState);
      const simulateMoveScore = this.compareScoreOnStates(state, futureState, currentPlayer);
      console.log(
        `${AoTStrategy.name}: simulateMoveScore  ${simulateMoveScore}`
      );

      if (simulateMoveScore > currentBestMoveScore) {
        currentBestMove = move;
        currentBestMoveScore = simulateMoveScore;
      }
    }
    return currentBestMove;
  }

  seeFutureState(move, state, deep) {
    console.log("See the future", deep);
    if (deep === 0 || !move) {
      return state;
    }

    if(state.isGameOver()) {
      return state;
    }

    const clonedState = state.clone();
    clonedState.hasExtraTurn = false;

    const futureState = this.applyMoveOnState(move, clonedState);
    if (futureState.isExtraturn()) {
      const newMove = this.chooseBestPossibleMove(futureState, deep);
      return this.seeFutureState(newMove, futureState, deep);
    }

    futureState.switchTurn();
    const newMove = this.chooseBestPossibleMove(futureState, deep - 1);
    const afterState = this.seeFutureState(newMove, futureState, deep - 1);
    return afterState;
  }

  compareScoreOnStates(state1, state2, player) {
    const score1 = this.calculateScoreOnStateOf(state1, player);
    const score2 = this.calculateScoreOnStateOf(state2, player);
    console.log(`${AoTStrategy.name}: compareScoreOnState`, score1, score2);
    return score2;
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
    const castableHeroes = currentPlayer.getCastableHeros();

    const possibleCastOnHeros = castableHeroes.map((hero) =>
      this.possibleCastOnHero(hero, state)
    );
    const allPossibleCasts = [].concat(...possibleCastOnHeros);

    return allPossibleCasts;
  }

  possibleCastOnHero(hero, state) {
    const casts = [new AotCastSkill(hero)];
    // const casts = [];
    return casts;
  }

  getAllPossibleGemSwap(state) {
    const allPosibleSwaps = state.grid.suggestMatch();
    const allSwapMove = allPosibleSwaps.map((swap) => new AotSwapGem(swap));

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
