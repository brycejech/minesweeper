'use strict';


const difficultyMap = {
    'EASY':         .175,
    'INTERMEDIATE': .2,
    'HARD':         .225,
    'INSANE':       .5
}


const minesweeper = (function(){

    const BOMB  = '<i class="fas fa-poo"></i>',
          EMPTY = '<i class="far fa-smile"></i>',
          FLAG  = '<i class="fab fa-font-awesome-flag"></i>';

    const defaultGame = {
        cols: 24,
        rows: 16,
        difficulty: difficultyMap['INTERMEDIATE']
    }

    const defaultGame = {
        cols: 24,
        rows: 16,
        difficulty: difficultyMap['INTERMEDIATE']
    }

    function Minesweeper(cols, rows, difficulty){

        this.cols = cols, this.rows = rows, this.difficulty = difficulty;

        this.timer = new Timer();

        this.init();
    }

    Minesweeper.prototype.reset = function(cols, rows, difficulty){

        cols && (this.cols = cols);
        rows && (this.rows = rows);
        difficulty && (this.difficulty = difficulty);

        this.init();
    }

    Minesweeper.prototype.init = function(){
        this.gameOver   = false;
        this.solved     = false;
        this.hints      = 3;
        this.firstClick = true;

        this.board    = new Board(this.cols, this.rows, this.difficulty);
        this.numBombs = this.board.numBombs;

        this.timer.stop().reset();

        this.draw();
    }

    Minesweeper.prototype.draw = function(){
        return this.board.draw();
    }

    Minesweeper.prototype.hint = function(){
        if(this.hints > 0){
            !this.gameOver && this.board.hint();
            --this.hints

            if(this.firstClick){
                this.timer.start();
                this.firstClick = false;
            }
        }
    }

    Minesweeper.prototype.clickCell = function(x, y){
        if(this.gameOver) return;

        if(this.firstClick){
            this.timer.start();
            this.firstClick = false;
        }

        const cell = this.board.clickCell(x, y);

        if(cell && cell.isBomb && !cell.flagged){
            this.gameOver = true;
            this.timer.stop();
        }

        if(this.isSolved()){
            this.gameOver = true;
            this.solved   = true;

            this.timer.stop();
        }

        return {
            isBomb: cell.isBomb,
            hidden: cell.hidden
        }
    }

    Minesweeper.prototype.flagCell = function(x, y){
        if(this.gameOver) return

        if(this.firstClick){
            this.timer.start();
            this.firstClick = false;
        }

        const cell = this.board.flagCell(x, y);

        cell.flagged ? --this.numBombs : ++this.numBombs;

        if(this.isSolved()){
            this.gameOver = true;
            this.solved   = true;

            this.timer.stop();
        }

        return {
            flagged: cell.flagged
        }
    }

    Minesweeper.prototype.isSolved = function(){

        var flaggedBombs = this.board
            .getBombs()
            .filter(bomb => bomb.flagged)

        var clickedCells = this.board
            .getNonBombs()
            .filter(cell => !cell.hidden)

        if(clickedCells.length + flaggedBombs.length === this.board.numCells){
            return true;
        }
    }

    Minesweeper.prototype.solve = function(){
        var numNonBombs = this.board.numCells - this.board.numBombs;

        this.board
            .getBombs()
            .forEach((bomb, i) => {
                bomb.flag();
            });

        this.board
            .getNonBombs()
            .forEach((cell, i)=> {
                cell.click();
            });

        this.draw();
    }

    /*
        =====
        BOARD
        =====
    */
    function Board(cols, rows, difficulty){
        this.cols      = cols;
        this.rows      = rows;
        this.numCells  = cols * rows;
        this.numBombs  = Math.round(difficulty * this.numCells);

        this.board = (() => {
            const board = [];
            for(let i = 0; i < this.rows; i++){
                const row = [];
                for(let j = 0; j < this.cols; j++){
                    const cell = new Cell(EMPTY, this);
                    cell.setPos(i, j);
                    row.push(cell);
                }
                board.push(row);
            }
            return board;
        })();

        this.init();

        return this;
    }

    Board.prototype.draw = function(){
        this.resetClicks;

        let boardHTML = '<div class="board">';
        for(let i = 0; i < this.rows; i++){
            const row = this.board[i];
            let rowHTML = '<div class="board-row">';
            for(let j = 0; j < this.cols; j++){
                const col = row[j];
                const colHTML = `<div class="board-cell" data-x="${i}" data-y="${j}" data-hidden="${col.hidden ? true : false}">${col.draw()}</div>`;
                rowHTML += colHTML;
            }
            rowHTML   += '</div>';
            boardHTML += rowHTML;
        }
        boardHTML += '</div>';

        return boardHTML;
    }

    Board.prototype.randCell = function(){
        const randRow = Math.floor(Math.random() * this.rows),
              randCol = Math.floor(Math.random() * this.cols);

        return this.board[randRow][randCol];
    }

    Board.prototype.get = function(x, y){
        if(this.isInside(x,y)) return this.board[x][y];
        return undefined;
    }

    Board.prototype.forEach = function(fn){
        let count = 0;
        for(let i = 0; i < this.rows; i++){
            const row = this.board[i];
            for(let j = 0; j < this.cols; j++){
                const cell = row[j];
                fn.call(cell, cell, count++);
            }
        }
    }

    Board.prototype.filter = function(fn){
        const cells = [];

        this.forEach(cell => {
            if(fn(cell)) cells.push(cell);
        });

        return cells;
    }

    Board.prototype.getBombs = function(){
        return this.filter(cell => cell.isBomb);
    }

    Board.prototype.getNonBombs = function(){
        return this.filter(cell => !cell.isBomb);
    }

    Board.prototype.init = function(){
        for(var i = 0; i < this.numBombs; i++){
            const cell = this.randCell();
            if(cell.isBomb){
                i--;
                continue;
            }
            cell.set(BOMB);
            cell.isBomb = true;
        }
        this.forEach(cell => cell.init());
    }

    Board.prototype.isInside = function(x, y){
        return x >= 0 && x < this.rows && y >= 0 && y < this.cols;
    }

    Board.prototype.resetClicks = function(){
        this.forEach(cell => cell.clicked = false);
    }

    Board.prototype.clickCell = function(x, y){
        const cell = this.get(x,y);
        if(!cell) return;

        return cell.click();
    }

    Board.prototype.flagCell = function(x, y){
        const cell = this.get(x, y);
        if(!cell || !cell.hidden) return;

        return cell.flag();
    }

    Board.prototype.hint = function(){

        let found = false;

        this.forEach(cell => {
            if(!found && cell.hidden && cell.numBombs === 0){
                cell.click();
                found = true;
            }
        });
    }

    /*
        =====
        CELLS
        =====
    */
    function Cell(text, board){
        this.text    = text;
        this.board   = board;
        this.isBomb  = false;
        this.hidden  = true;
        this.clicked = false;
        this.flagged = false;

        return this;
    }

    Cell.prototype.draw = function(){
        if(this.flagged) return FLAG;
        return this.hidden ? '' : this.text;
    }

    Cell.prototype.set = function(text){
        this.text = text;

        return this;
    }

    Cell.prototype.flag = function(){
        this.flagged = !this.flagged;
        return this;
    }

    Cell.prototype.setPos = function(x, y){
        this.x = x;
        this.y = y;

        return this;
    }

    Cell.prototype.getPos = function(){
        return {
            x: this.x,
            y: this.y
        }
    }

    Cell.prototype.init = function(){
        // # adjacent bombs must be computed after all cells generated
        if(!this.isBomb){
            const numBombs = this.neighbors().reduce((accum, cell) => {
                return cell.isBomb ? ++accum : accum;
            }, 0);
            this.numBombs = numBombs;
            this.set(numBombs);
        }
        return this;
    }

    Cell.prototype.click = function(){

        if(this.flagged || this.clicked) return this;

        this.hidden  = false;
        this.clicked = true;

        if(this.numBombs === 0){
            this.neighbors().forEach( cell => cell.click() );
        }

        return this;
    }

    Cell.prototype.neighbors = function(){
        const x = this.x, y = this.y;
        return [
            this.board.get(x - 1, y - 1), // top left
            this.board.get(x - 1, y),     // top center
            this.board.get(x - 1, y + 1), // top right
            this.board.get(x, y - 1),     // left
            this.board.get(x, y + 1),     // right
            this.board.get(x + 1, y - 1), // bottom left
            this.board.get(x + 1, y),     // bottom center
            this.board.get(x + 1, y + 1)  // bottom right
        ].filter(cell => cell); // filter on truthiness
    }


    /*
        ==========
        GAME TIMER
        ==========
    */
    function Timer(){
        this.elapsed = 0;

        return this;
    }

    Timer.prototype.tick = function(){
        ++this.elapsed;

        return this;
    }

    Timer.prototype.draw = function(){
        return this.format();
    }

    Timer.prototype.format = (() => {

        function _pad(str){
            str = str.toString();

            return str.length >= 2 ? str : '0' + str;
        }

        return function format(){
            var hour = Math.floor(this.elapsed / (60 * 60)),
                min  = Math.floor((this.elapsed - (hour * 60 * 60)) / 60),
                sec  = this.elapsed - (hour * 60 * 60) - (min * 60);

            return `${_pad(hour)}:${_pad(min)}:${_pad(sec)}`;
        }
    })();

    Timer.prototype.reset = function(){
        return this.set(0);
    }

    Timer.prototype.stop = function(){
        clearInterval(this.interval);

        return this;
    }

    Timer.prototype.start = function(){
        this.interval = setInterval(this.tick.bind(this), 1000);

        return this;
    }

    Timer.prototype.set = function(int){
        this.elapsed = parseInt(int) || 0;

        return this;
    }


    /*
        ==========
        INITIALIZE
        ==========
    */

    // Game instance
    const game = new Minesweeper(defaultGame.cols, defaultGame.rows, defaultGame.difficulty);

    // Create a proxy to hide internals
    const proxy = Object.create(null);

    const publicGameMethods = [
        'clickCell',
        'flagCell',
        'hint',
        'reset',
        'solve',
        'draw'
    ];

    // bind public game methods to proxy obj
    for(let method of publicGameMethods){
        proxy[method] = game[method].bind(game);
    }

    // create getters for public game props
    Object.defineProperties(proxy, {
        solved: {
            enumerable: true,
            get: function(){ return game.solved }
        },
        gameOver: {
            enumerable: true,
            get: function(){ return game.gameOver }
        },
        hints: {
            enumerable: true,
            get: function(){ return game.hints }
        },
        elapsed: {
            enumerable: true,
            get: function(){ return game.timer.format() }
        },
        numBombs: {
            enumerable: true,
            get: function(){ return game.numBombs }
        },
        cols: {
            enumerable: true,
            get: function(){ return game.cols }
        },
        rows: {
            enumerable: true,
            get: function(){ return game.rows }
        }
    });

    return proxy;

})();


(() => {


    /*
        ===========
        UI ELEMENTS
        ===========
    */
    const btn_submit     = document.getElementById('submit'),
          ctrl_cols      = document.getElementById('cols'),
          ctrl_rows      = document.getElementById('rows'),
          ddl_difficulty = document.getElementById('difficulty');

    // Containers
    const ctrl_board = document.getElementById('board');

    // Game Info
    const ctrl_numBombs = document.getElementById('numBombs'),
          ctrl_timer    = document.getElementById('timer');


    const game = window.game = (() => {

        let timerInterval;

        function reset(cols, rows, difficulty){
            minesweeper.reset(cols, rows, difficulty);
            init();
            drawBoard();
        }

        function hint(){
            minesweeper.hint();
            drawBoard();
        }

        function init(){
            ctrl_board.style.width  = ((minesweeper.cols * 40)).toString() + 'px';
            ctrl_board.innerHTML    = minesweeper.draw();
            ctrl_numBombs.innerText = minesweeper.numBombs;

            _drawTimer();
            clearInterval(timerInterval);
            timerInterval = setInterval(_drawTimer, 1000);
        }

        function newGame(){
            const cols       = parseInt(ctrl_cols.value),
                  rows       = parseInt(ctrl_rows.value),
                  difficulty = difficultyMap[ddl_difficulty.value];

            reset(cols, rows, difficulty);
            window.modal('#settings-modal');

            init();
            drawBoard();
        }

        function _drawTimer(){
            ctrl_timer.innerText = minesweeper.elapsed;
        }

        init();

        return {
            reset:   reset,
            hint:    hint,
            init:    init,
            newGame: newGame
        }

    })();


    /*
        ================
        DOM INTERACTIONS
        ================
    */

    function drawBoard(){
        ctrl_board.innerHTML = minesweeper.draw();
    }

    // Launch modal
    function _message(message){
        const msgModal = document.getElementById('message-modal'),
              el       = document.getElementById('message');

        el.innerHTML = '<div class="content"><h3>' + message + '</h3></div>';

        modal(msgModal)

        setTimeout(() => {
            if(msgModal.classList.contains('active')){
                modal(msgModal);
            }
        }, 10000);
    }

    const getClickedCoords = (() => {

            function _parents(node, test){
                let parent = node.parentNode;
                while(parent !== document){
                    if(test(parent)){
                        return parent;
                    }
                    parent = parent.parentNode;
                }
            }

            function _getClickedCell(e){
                if(/board-cell/.test(e.target.className)){
                    return e.target;
                }
                const cell = _parents(e.target, function(el){
                    return /board-cell/.test(el.className)
                });

                return cell;
            }

            function _getClickedCoords(e){
                const el = _getClickedCell(e);
                if(!el) return;

                return {
                    x: el.getAttribute('data-x'),
                    y: el.getAttribute('data-y')
                }
            }

            return _getClickedCoords
        })();

    /*
        ==============
        EVENT HANDLERS
        ==============
    */

    function leftClick(e){
        if(minesweeper.gameOver) return;

        const { x, y } = getClickedCoords(e);

        let cell;
        if(x && y){
            cell = minesweeper.clickCell(x,y);
        }

        if(minesweeper.solved){
            _message('Congratulations!!<br>You win!!!');
            new Audio('audio/mario-castle-clear.mp3').play();
        }
        else if(cell && cell.isBomb && !cell.hidden && minesweeper.gameOver){
            _message('You clicked a bomb!<br>Game Over!');
            new Audio('audio/mario-koopa-kid.mp3').play();
        }

        drawBoard();
    }

    function rightClick(e){
        if(minesweeper.gameOver) return;

        if(!e.ctrlKey){
            e.preventDefault();

            const { x, y } = getClickedCoords(e);

            if(x && y) minesweeper.flagCell(x, y);

            if(minesweeper.solved){
                _message('Congratulations!!<br>You win!!!');
                new Audio('audio/mario-castle-clear.mp3').play();
            }

            ctrl_numBombs.innerText = minesweeper.numBombs;
            drawBoard();
        }
    }

    // Event Listeners
    btn_submit.addEventListener('click', game.newGame);
    ctrl_board.addEventListener('click', leftClick);
    ctrl_board.addEventListener('contextmenu', rightClick);

    document.addEventListener('keypress', function(e){
        if(e.key === 'Enter'){
            const modal = document.getElementById('settings-modal');
            if(/active/.test(modal.className)){
                game.newGame()
            }
        }
    });

})();
