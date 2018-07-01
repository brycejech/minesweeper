'use strict';

(function(){

    /*
        ===========
        UI ELEMENTS
        ===========
    */

    // Inputs
    const btn_submit   = document.getElementById('submit'),
        ctrl_cols      = document.getElementById('cols'),
        ctrl_rows      = document.getElementById('rows'),
        ddl_difficulty = document.getElementById('difficulty');

    // Containers
    const ctrl_board = document.getElementById('board');

    // Game Info
    const ctrl_numBombs = document.getElementById('numBombs'),
          ctrl_timer    = document.getElementById('timer');


    /*
        =========
        CONSTANTS
        =========
    */
    var difficultyMap = {
        'EASY':         .175,
        'INTERMEDIATE': .2,
        'HARD':         .225,
        'INSANE':       .5
    }

    var BOMB  = '<i class="fas fa-poo"></i>',
        EMPTY = '<i class="far fa-smile"></i>',
        FLAG  = '<i class="fas fa-map-pin"></i>';

    const defaultGame = {
        cols: 24,
        rows: 16,
        difficulty: difficultyMap['INTERMEDIATE']
    }



    function Minesweeper(cols, rows, difficulty, el){
        this.el = el instanceof HTMLElement ? el : document.querySelector(el);
        // prevent rows from wrapping
        el.style['width'] = ((cols * 40)).toString() + 'px';

        this.cols = cols, this.rows = rows, this.difficulty = difficulty;

        this.timer = new Timer(ctrl_timer);

        this.init();
    }

    Minesweeper.prototype.reset = function(){
        this.init();
    }

    Minesweeper.prototype.init = function(){
        this.gameOver = false;

        this.board    = new Board(this.cols, this.rows, this.difficulty);
        this.numBombs = this.board.numBombs;

        this.timer.reset().draw();

        ctrl_numBombs.innerText = this.numBombs;

        this.draw();
    }

    Minesweeper.prototype.draw = function(){
        this.el.innerHTML = this.board.draw();
    }

    Minesweeper.prototype.hint = function(){
        !this.gameOver && this.board.hint()
    }

    Minesweeper.prototype.clickCell = function(x, y){
        if(this.gameOver) return;

        const cell = this.board.clickCell(x, y);
        this.draw();

        if(cell && cell.isBomb && !cell.flagged){
            this.gameOver = true;
            alert('You clicked a bomb!');
        }

        if(this.isSolved()){
            alert('You win!!!');
            this.gameOver = true;
        }
    }

    Minesweeper.prototype.flagCell = function(x, y){
        if(this.gameOver) return

        this.board.flagCell(x, y);
        this.draw();
        if(this.isSolved()){
            alert('You win!!');
            this.gameOver = true;
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
                // if(i < this.board.numBombs - 1) bomb.flag();
            });

        this.board
            .getNonBombs()
            .forEach((cell, i)=> {
                cell.click();
                // if(i < (numNonBombs - 1)) cell.click();
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
        this.hintCount = 0;

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

        return this.board[randRow][randCol]
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

    Board.prototype.getBombs = function(){
        var bombs = [];

        this.forEach(cell => { if(cell.isBomb) bombs.push(cell) });

        return bombs;
    }

    Board.prototype.getNonBombs = function(){
        var nonBombs = [];

        this.forEach(cell => { if(!cell.isBomb) nonBombs.push(cell) });

        return nonBombs;
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

        if(this.hintCount <= 2){
            let found = false;

            this.forEach(cell => {
                if(!found && cell.hidden && cell.numBombs === 0){
                    cell.click();
                    found = true;
                    this.hintCount++;
                }
                ctrl_board.innerHTML = this.draw();
            });
        }
        else{ alert('No more hints! Work the problem ;)') }
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
    function Timer(el){
        this.el = el instanceof HTMLElement ? el : document.querySelector(el);

        this.elapsed = (60 * 58) + 45;

        this.interval = setInterval(this.tick.bind(this), 1000);

        return this;
    }

    Timer.prototype.tick = function(){
        ++this.elapsed;

        this.draw();

        return this;
    }

    Timer.prototype.draw = function(){
        this.el.innerText = this.format();

        return this;
    }

    Timer.prototype.format = function(){
        var hour = Math.floor(this.elapsed / (60 * 60)),
            min  = Math.floor((this.elapsed - (hour * 60 * 60)) / 60),
            sec  = this.elapsed - (hour * 60 * 60) - (min * 60);

        return `${_zeroPad(hour)}:${_zeroPad(min)}:${_zeroPad(sec)}`;
    }

    Timer.prototype.reset = function(){

        this.elapsed = 0;
        
        clearInterval(this.interval);
        this.interval = setInterval(this.tick.bind(this), 1000);

        return this;
    }


    /*
        ==========
        HELPER FNs
        ==========
    */
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

        return cell ? cell : undefined;
    }

    function _getClickedCoords(e){
        const el = _getClickedCell(e);
        if(!el) return;

        return {
            x: el.getAttribute('data-x'),
            y: el.getAttribute('data-y')
        }
    }

    function _zeroPad(str){
        str = str.toString();

        return str.length >= 2 ? str : '0' + str;
    }
    /*
        ==========
        INITIALIZE
        ==========
    */

    // Game instance
    var game = window.game = new Minesweeper(defaultGame.cols, defaultGame.rows, defaultGame.difficulty, ctrl_board);

    // Event Listeners
    btn_submit.addEventListener('click', function(){
        var cols       = parseInt(ctrl_cols.value),
            rows       = parseInt(ctrl_rows.value),
            difficulty = difficultyMap[ddl_difficulty.value];

        window.game = new Minesweeper(cols, rows, difficulty, ctrl_board);
        modal('#settings-modal');
    });

    ctrl_board.addEventListener('click', function(e){
        var { x, y } = _getClickedCoords(e);

        if(x && y) window.game.clickCell(x,y);
    });

    ctrl_board.addEventListener('contextmenu', function(e){
        if(!e.ctrlKey){
            e.preventDefault();

            var { x, y } = _getClickedCoords(e);

            if(x && y) window.game.flagCell(x, y);
        }
    });
})();
