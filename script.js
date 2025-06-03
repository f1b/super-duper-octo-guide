const gridElement = document.getElementById('grid');
const scoreValue = document.getElementById('score-value');
const gameContainer = document.getElementById('game-container');
const calculatorContainer = document.getElementById('calculator-container');
const calcDisplay = document.getElementById('calc-display');
const calcButtons = document.getElementById('calc-buttons');
const backBtn = document.getElementById('back-to-game');

let board = [];
let score = 0;
let specialCount = 0;

function initBoard() {
  board = [];
  for (let r = 0; r < 4; r++) {
    board[r] = [];
    for (let c = 0; c < 4; c++) {
      board[r][c] = 0;
    }
  }
  addRandomTile();
  addRandomTile();
  drawBoard();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push({r,c});
    }
  }
  if (empty.length === 0) return;
  const {r, c} = empty[Math.floor(Math.random()*empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function drawBoard() {
  gridElement.innerHTML = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = board[r][c] === 0 ? '' : board[r][c];
      tile.dataset.row = r;
      tile.dataset.col = c;
      gridElement.appendChild(tile);
      tile.addEventListener('click', handleTileClick);
    }
  }
  scoreValue.textContent = score;
}

function handleTileClick(e) {
  const r = parseInt(e.target.dataset.row, 10);
  const c = parseInt(e.target.dataset.col, 10);
  if (r === 1 && c === 1) {
    specialCount++;
    if (specialCount === 5) {
      openCalculator();
      specialCount = 0;
    }
  } else {
    specialCount = 0;
  }
}

function slide(row) {
  const arr = row.filter(v => v);
  for (let i = 0; i < arr.length-1; i++) {
    if (arr[i] === arr[i+1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i+1] = 0;
    }
  }
  const result = arr.filter(v => v);
  while (result.length < 4) result.push(0);
  return result;
}

function rotateClockwise(b) {
  const res = [[],[],[],[]];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      res[c][3-r] = b[r][c];
    }
  }
  return res;
}

function moveLeft() {
  let changed = false;
  for (let r = 0; r < 4; r++) {
    const newRow = slide(board[r]);
    if (board[r].toString() !== newRow.toString()) changed = true;
    board[r] = newRow;
  }
  return changed;
}

function moveRight() {
  board = board.map(row => row.reverse());
  const changed = moveLeft();
  board = board.map(row => row.reverse());
  return changed;
}

function moveUp() {
  board = rotateClockwise(board);
  board = rotateClockwise(board);
  board = rotateClockwise(board);
  const changed = moveLeft();
  board = rotateClockwise(board);
  return changed;
}

function moveDown() {
  board = rotateClockwise(board);
  const changed = moveLeft();
  board = rotateClockwise(board);
  board = rotateClockwise(board);
  board = rotateClockwise(board);
  return changed;
}

function handleKey(e) {
  let moved = false;
  switch (e.key) {
    case 'ArrowLeft':
      moved = moveLeft();
      break;
    case 'ArrowRight':
      moved = moveRight();
      break;
    case 'ArrowUp':
      moved = moveUp();
      break;
    case 'ArrowDown':
      moved = moveDown();
      break;
  }
  if (moved) {
    addRandomTile();
    drawBoard();
  }
}

function openCalculator() {
  gameContainer.classList.add('hidden');
  calculatorContainer.classList.remove('hidden');
}

function closeCalculator() {
  calculatorContainer.classList.add('hidden');
  gameContainer.classList.remove('hidden');
}

// Calculator
let calcInput = '';
function buildCalculator() {
  const buttons = [
    '7','8','9','/',
    '4','5','6','*',
    '1','2','3','-',
    '0','C','=','+',
  ];
  buttons.forEach(b => {
    const btn = document.createElement('div');
    btn.className = 'calc-btn';
    btn.textContent = b;
    btn.addEventListener('click', () => handleCalc(b));
    calcButtons.appendChild(btn);
  });
}

function handleCalc(val) {
  if (val === 'C') {
    calcInput = '';
  } else if (val === '=') {
    try {
      calcInput = eval(calcInput).toString();
    } catch {
      calcInput = 'Error';
    }
  } else {
    calcInput += val;
  }
  calcDisplay.textContent = calcInput || '0';
}

backBtn.addEventListener('click', () => {
  closeCalculator();
  drawBoard();
});

document.addEventListener('keydown', handleKey);

initBoard();
buildCalculator();
