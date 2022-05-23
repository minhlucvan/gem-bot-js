mocha.setup("bdd");
var expect = chai.expect;

const BASIC_GEMS = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
];

const NO_MATCH_GEMS = [
    1, 2, 3, 4, 5, 6, 7, 8,
    2, 3, 4, 5, 6, 7, 8, 1,
    3, 4, 5, 6, 7, 8, 1, 2,
    4, 5, 6, 7, 8, 1, 2, 3,
    5, 6, 7, 8, 1, 2, 3, 4,
    6, 7, 8, 1, 2, 3, 4, 5,
    7, 8, 1, 2, 3, 4, 5, 6,
    8, 1, 2, 3, 4, 5, 6, 7,
];

const ONE_MATCH_GEMS = [
    9, 9, 9, 4, 5, 6, 7, 8,
    2, 3, 4, 5, 6, 7, 8, 1,
    3, 4, 5, 6, 7, 8, 1, 2,
    4, 5, 6, 7, 8, 1, 2, 3,
    5, 6, 7, 8, 1, 2, 3, 4,
    6, 7, 8, 1, 2, 3, 4, 5,
    7, 8, 1, 2, 3, 4, 5, 6,
    8, 1, 2, 3, 4, 5, 6, 7,
];

const ONE_SWAP_GEMS = [
    9, 9, 3, 9, 5, 6, 7, 8,
    2, 3, 4, 5, 6, 7, 8, 1,
    3, 4, 5, 6, 7, 8, 1, 2,
    4, 5, 6, 7, 8, 1, 2, 3,
    5, 6, 7, 8, 1, 2, 3, 4,
    6, 7, 8, 1, 2, 3, 4, 5,
    7, 8, 1, 2, 3, 4, 5, 6,
    8, 1, 2, 3, 4, 5, 6, 7,
];


const FIVE_SWAP_GEMS = [
  9, 2, 9, 9, 5, 6, 7, 8,
  2, 9, 4, 5, 6, 7, 8, 1,
  3, 9, 5, 6, 7, 8, 1, 2,
  4, 5, 6, 7, 8, 1, 2, 3,
  5, 6, 7, 8, 1, 2, 3, 4,
  6, 7, 8, 1, 2, 3, 4, 5,
  7, 8, 1, 2, 3, 4, 5, 6,
  8, 1, 2, 3, 4, 5, 6, 7,
];

const THREE_THREE_SWAP_GEMS = [
  9, 2, 3, 4, 5, 6, 7, 8,
  4, 9, 4, 5, 6, 7, 8, 1,
  3, 9, 5, 6, 7, 8, 1, 2,
  4, 5, 6, 7, 8, 1, 2, 3,
  5, 4, 7, 8, 1, 2, 3, 4,
  6, 7, 8, 1, 2, 3, 4, 5,
  7, 8, 1, 2, 3, 4, 5, 6,
  8, 1, 2, 3, 4, 5, 6, 7,
];


function consrtuctGrid(value) {
    const grid = new Grid({ size: () => 0 }, new Set());
    grid.gems = value.map((type, index) => new Gem(index, type));
    grid.gemTypes = new Set();
    grid.myHeroGemType = new Set();
    return grid;
}

describe("Grid.js", () => {
  var grid = null;
  it("should construct grid", () => {
    grid = consrtuctGrid(BASIC_GEMS);
    expect(grid).to.be.not.null;
    expect(grid.gems).to.be.an('array');
    expect(grid.gems).to.have.lengthOf(64);
  });

  it("should check match correctly with no match",  () => {
    grid = consrtuctGrid(NO_MATCH_GEMS);
    expect(grid.getAllMatches()).to.be.an('array');
    expect(grid.getAllMatches()).to.have.lengthOf(0);
  })

  it("should return get at correctly",  () => {
    grid = consrtuctGrid(ONE_SWAP_GEMS);
    const gem = grid.gemAt(3, 0);
    expect(gem).to.be.an('object');
    expect(gem).to.have.property('index', 3);
    expect(gem).to.have.property('type', 9);
  })

  it("should check match at correctly with one match",  () => {
    grid = consrtuctGrid(ONE_SWAP_GEMS);
    const matches = grid.suggestMatch(3, 0);
    expect(matches).to.be.an('array');
    expect(matches).to.have.lengthOf(1);
  })

  it("should check match correctly with one match",  () => {
    grid = consrtuctGrid(ONE_MATCH_GEMS);
    const matches = grid.getAllMatches();
    expect(matches).to.be.an('array');
    expect(matches).to.have.lengthOf(1);
  })

  it("should swap match correctly with one match",  () => {
    grid = consrtuctGrid(ONE_SWAP_GEMS);
    const matches = grid.getAllMatches();
    expect(matches).to.be.an('array');
    expect(matches).to.have.lengthOf(0);

    grid.swapIndex(2, 3);

    const newMatches = grid.getAllMatches();
    expect(newMatches).to.be.an('array');
    expect(newMatches).to.have.lengthOf(1);
  })

  it("should perform distinction batch match correctly with one match",  () => {
    grid = consrtuctGrid(ONE_MATCH_GEMS);
    const matches = grid.getAllMatches();
    const distinction  = new GridDistinction();
    grid.distinctGemBatch(matches[0], distinction);

    expect(grid.gemAt(0, 0)).to.have.property('removed', true);
    expect(grid.gemAt(1, 0)).to.have.property('removed', true);
    expect(grid.gemAt(2, 0)).to.have.property('removed', true);
    console.log(grid);
  })

  it("should perform reshape match correctly with one match",  () => {
    grid = consrtuctGrid(ONE_MATCH_GEMS);
    const matches = grid.getAllMatches();
    const distinction  = new GridDistinction();
    grid.distinctGemBatch(matches[0], distinction);

    grid.performReshape();
    
    console.log(grid.toString());

    expect(grid.gemAt(0, 0)).to.have.property('type', 2);
    expect(grid.gemAt(1, 0)).to.have.property('type', 3);
    expect(grid.gemAt(2, 0)).to.have.property('type', 4);

    expect(grid.gemAt(0, 1)).to.have.property('type', 3);
    expect(grid.gemAt(1, 1)).to.have.property('type', 4);
    expect(grid.gemAt(2, 1)).to.have.property('type', 5);

    expect(grid.gemAt(0, 2)).to.have.property('type', 4);
    expect(grid.gemAt(1, 2)).to.have.property('type', 5);
    expect(grid.gemAt(2, 2)).to.have.property('type', 6);

    expect(grid.gemAt(0, 3)).to.have.property('type', 5);
    expect(grid.gemAt(1, 3)).to.have.property('type', 6);
    expect(grid.gemAt(2, 3)).to.have.property('type', 7);

    expect(grid.gemAt(0, 4)).to.have.property('type', 6);
    expect(grid.gemAt(1, 4)).to.have.property('type', 7);
    expect(grid.gemAt(2, 4)).to.have.property('type', 8);

    expect(grid.gemAt(0, 5)).to.have.property('type', 7);
    expect(grid.gemAt(1, 5)).to.have.property('type', 8);
    expect(grid.gemAt(2, 5)).to.have.property('type', 1);

    expect(grid.gemAt(0, 6)).to.have.property('type', 8);
    expect(grid.gemAt(1, 6)).to.have.property('type', 1);
    expect(grid.gemAt(2, 6)).to.have.property('type', 2);

    expect(grid.gemAt(0, 7)).to.have.property('type', -1);
    expect(grid.gemAt(1, 7)).to.have.property('type', -1);
    expect(grid.gemAt(2, 7)).to.have.property('type', -1);

    expect(grid.gemAt(0, 7)).to.have.property('locked', true);
    expect(grid.gemAt(1, 7)).to.have.property('locked', true);
    expect(grid.gemAt(2, 7)).to.have.property('locked', true);
  })

  it("should perform swap correctly with one match",  () => {
    grid = consrtuctGrid(ONE_SWAP_GEMS);

    const result = grid.performSwap(2, 3);
    console.log(result);
  })

  it("should perform swap correctly with five match",  () => {
    grid = consrtuctGrid(FIVE_SWAP_GEMS);

    const result = grid.performSwap(0, 1);
    console.log('FIVE_SWAP_GEMS', result);
  })

  it("should perform swap correctly with five three match",  () => {
    grid = consrtuctGrid(THREE_THREE_SWAP_GEMS);
    console.log(grid.toString());

    const result = grid.performSwap(0, 1);
    console.log('FIVE_THREE_SWAP_GEMS', result);

    console.log(grid.toString());
  })
});

mocha.run();
