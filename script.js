(() => {
  const GRID_SIZE = 4;
  const SECRET_ROW = 1;
  const SECRET_COL = 1;
  const SECRET_STREAK_TARGET = 5;

  const gridEl = document.getElementById('grid');
  const scoreValueEl = document.getElementById('score-value');
  const bestScoreValueEl = document.getElementById('best-score-value');
  const gameMessageEl = document.getElementById('game-message');
  const newGameBtnEl = document.getElementById('new-game-btn');
  const gameViewEl = document.getElementById('game-view');
  const calculatorViewEl = document.getElementById('calculator-view');
  const calcDisplayEl = document.getElementById('calc-display');
  const calcButtonsEl = document.getElementById('calc-buttons');
  const backToGameBtnEl = document.getElementById('back-to-game-btn');

  const state = {
    board: createEmptyBoard(),
    score: 0,
    bestScore: Number(localStorage.getItem('best-2048-score') || 0),
    secretStreak: 0,
    gameOver: false,
    calcExpression: '',
    isCalculatorVisible: false,
    touchStart: null,
  };

  const calcLayout = [
    'C', '(', ')', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '=', '=',
  ];

  function createEmptyBoard() {
    return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  }

  function init() {
    buildCalculator();
    bindEvents();
    resetGame();
    render();
  }

  function bindEvents() {
    document.addEventListener('keydown', handleKeydown);
    newGameBtnEl.addEventListener('click', resetGame);
    backToGameBtnEl.addEventListener('click', hideCalculator);
    gridEl.addEventListener('click', handleGridClick);

    document.querySelectorAll('.control-btn').forEach((button) => {
      button.addEventListener('click', () => {
        move(button.dataset.direction);
      });
    });

    gridEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    gridEl.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  function resetGame() {
    state.board = createEmptyBoard();
    state.score = 0;
    state.gameOver = false;
    state.secretStreak = 0;
    addRandomTile();
    addRandomTile();
    render();
  }

  function addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (state.board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) {
      return;
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    state.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
  }

  function handleKeydown(event) {
    if (state.isCalculatorVisible) {
      return;
    }

    const directionByKey = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    const direction = directionByKey[event.key];
    if (!direction) {
      return;
    }

    event.preventDefault();
    move(direction);
  }

  function handleGridClick(event) {
    const tile = event.target.closest('.tile');
    if (!tile) {
      state.secretStreak = 0;
      return;
    }

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);

    if (row === SECRET_ROW && col === SECRET_COL) {
      state.secretStreak += 1;
      if (state.secretStreak >= SECRET_STREAK_TARGET) {
        showCalculator();
        state.secretStreak = 0;
      }
      return;
    }

    state.secretStreak = 0;
  }

  function move(direction) {
    if (state.gameOver || state.isCalculatorVisible) {
      return;
    }

    const initialBoard = cloneBoard(state.board);

    if (direction === 'left') {
      state.board = state.board.map((row) => compactAndMerge(row));
    }

    if (direction === 'right') {
      state.board = state.board.map((row) => compactAndMerge([...row].reverse()).reverse());
    }

    if (direction === 'up') {
      const columns = getColumns(state.board).map((column) => compactAndMerge(column));
      state.board = columnsToRows(columns);
    }

    if (direction === 'down') {
      const columns = getColumns(state.board).map((column) => compactAndMerge([...column].reverse()).reverse());
      state.board = columnsToRows(columns);
    }

    if (!isBoardChanged(initialBoard, state.board)) {
      return;
    }

    addRandomTile();

    if (!canMove()) {
      state.gameOver = true;
    }

    render();
  }

  function compactAndMerge(values) {
    const compact = values.filter((value) => value !== 0);

    for (let index = 0; index < compact.length - 1; index += 1) {
      if (compact[index] === compact[index + 1]) {
        compact[index] *= 2;
        state.score += compact[index];
        compact[index + 1] = 0;
      }
    }

    const merged = compact.filter((value) => value !== 0);
    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem('best-2048-score', String(state.bestScore));
    }

    return merged;
  }

  function canMove() {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const current = state.board[row][col];
        if (current === 0) {
          return true;
        }

        const right = state.board[row][col + 1];
        const down = state.board[row + 1]?.[col];
        if (current === right || current === down) {
          return true;
        }
      }
    }

    return false;
  }

  function cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  function isBoardChanged(previousBoard, currentBoard) {
    return previousBoard.some((row, rowIndex) => row.some((value, colIndex) => value !== currentBoard[rowIndex][colIndex]));
  }

  function getColumns(rows) {
    return Array.from({ length: GRID_SIZE }, (_, colIndex) => rows.map((row) => row[colIndex]));
  }

  function columnsToRows(columns) {
    return Array.from({ length: GRID_SIZE }, (_, rowIndex) => columns.map((column) => column[rowIndex]));
  }

  function render() {
    renderGrid();
    scoreValueEl.textContent = state.score;
    bestScoreValueEl.textContent = state.bestScore;
    gameMessageEl.classList.toggle('hidden', !state.gameOver);
  }

  function renderGrid() {
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const tile = document.createElement('button');
        const value = state.board[row][col];
        tile.type = 'button';
        tile.className = 'tile';
        tile.dataset.row = String(row);
        tile.dataset.col = String(col);
        tile.dataset.value = String(value);
        tile.textContent = value === 0 ? '' : String(value);
        tile.ariaLabel = value === 0 ? `Пустая ячейка ${row + 1}:${col + 1}` : `Ячейка ${row + 1}:${col + 1} со значением ${value}`;
        fragment.appendChild(tile);
      }
    }

    gridEl.innerHTML = '';
    gridEl.appendChild(fragment);
  }

  function showCalculator() {
    state.isCalculatorVisible = true;
    gameViewEl.classList.add('hidden');
    calculatorViewEl.classList.remove('hidden');
  }

  function hideCalculator() {
    state.isCalculatorVisible = false;
    calculatorViewEl.classList.add('hidden');
    gameViewEl.classList.remove('hidden');
  }

  function buildCalculator() {
    const fragment = document.createDocumentFragment();

    calcLayout.forEach((symbol, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calc-btn';
      button.textContent = symbol;
      button.dataset.value = symbol;

      if ('+-×÷'.includes(symbol)) {
        button.classList.add('operator');
      }

      if (symbol === '=') {
        button.classList.add('equals');
        if (index === calcLayout.length - 1) {
          button.classList.add('hidden');
          button.disabled = true;
          button.tabIndex = -1;
        }
      }

      button.addEventListener('click', () => onCalcButton(symbol));
      fragment.appendChild(button);
    });

    calcButtonsEl.appendChild(fragment);
  }

  function onCalcButton(symbol) {
    if (symbol === 'C') {
      state.calcExpression = '';
      updateCalcDisplay('0');
      return;
    }

    if (symbol === '=') {
      evaluateExpression();
      return;
    }

    state.calcExpression += symbol;
    updateCalcDisplay(state.calcExpression);
  }

  function evaluateExpression() {
    const normalized = state.calcExpression.replaceAll('×', '*').replaceAll('÷', '/');
    const isSafe = /^[0-9+\-*/().\s]+$/.test(normalized) && /[0-9)]$/.test(normalized);

    if (!isSafe) {
      state.calcExpression = '';
      updateCalcDisplay('Ошибка');
      return;
    }

    let result;
    try {
      result = Function(`'use strict'; return (${normalized});`)();
    } catch {
      state.calcExpression = '';
      updateCalcDisplay('Ошибка');
      return;
    }

    if (!Number.isFinite(result)) {
      state.calcExpression = '';
      updateCalcDisplay('Ошибка');
      return;
    }

    state.calcExpression = String(Number.parseFloat(result.toFixed(10)));
    updateCalcDisplay(state.calcExpression);
  }

  function updateCalcDisplay(content) {
    calcDisplayEl.textContent = content;
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0];
    state.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    if (!state.touchStart || state.isCalculatorVisible) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStart.x;
    const deltaY = touch.clientY - state.touchStart.y;

    if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      state.touchStart = null;
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      move(deltaX > 0 ? 'right' : 'left');
    } else {
      move(deltaY > 0 ? 'down' : 'up');
    }

    state.touchStart = null;
  }

  init();
})();
