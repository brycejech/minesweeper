'use strict';

(function(){

    /*
        ===========
        UI ELEMENTS
        ===========
    */

    // Inputs
    var btn_submit     = document.getElementById('submit'),
        ctrl_cols      = document.getElementById('cols'),
        ctrl_rows      = document.getElementById('rows'),
        ddl_difficulty = document.getElementById('difficulty');

    // Containers
    var ctrl_board = document.getElementById('board');


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

    btn_submit.addEventListener('click', function(){
        var cols       = parseInt(ctrl_cols.value),
            rows       = parseInt(ctrl_rows.value),
            difficulty = difficultyMap[ddl_difficulty.value];

        ctrl_board.style['width'] = ((cols * 40)).toString() + 'px';
        var board = window.board = new Board(cols, rows, difficulty);
        ctrl_board.innerHTML = board.draw();
    });

    ctrl_board.addEventListener('click', function(e){

        var targetCell = _getClickedCell(e);

        if(targetCell){

            var x = targetCell.getAttribute('data-x'),
                y = targetCell.getAttribute('data-y');

            board.clickCell(x,y);
            ctrl_board.innerHTML = board.draw();
        }
    });

    ctrl_board.addEventListener('contextmenu', function(e){
        if(!e.ctrlKey){
            e.preventDefault();

            var targetCell = _getClickedCell(e);

            if(targetCell){
                var x = targetCell.getAttribute('data-x'),
                    y = targetCell.getAttribute('data-y');

                board.clickCell(x, y, 'flag');
                ctrl_board.innerHTML = board.draw();
            }

        }
    })

    /*
        =====
        BOARD
        =====
    */
    function Board(cols, rows, difficulty){
        this.cols      = cols;
        this.rows      = rows;
        this.numCols   = cols * rows;
        this.numBombs  = Math.round(difficulty * this.numCols);
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
        for(let i = 0; i < this.rows; i++){
            const row = this.board[i];
            for(let j = 0; j < this.cols; j++){
                const cell = row[j];
                fn.call(cell, cell);
            }
        }
    }

    Board.prototype.init = function(){
        for(let i = 0; i < this.numBombs; i++){
            const cell = this.randCell();
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

    Board.prototype.clickCell = function(x, y, type){
        const cell = this.get(x,y);
        if(!cell) return;

        cell.click(type);
        if(!type && !cell.flagged && cell.isBomb) alert('You clicked a bomb!');
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
                ctrl_board.innerHTML = board.draw();
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

    Cell.prototype.click = function(flag){
        if(this.hidden && flag){
            this.flagged = !this.flagged
        }
        else{
            if(!this.flagged){
                this.hidden = false;
                if(this.clicked) return;
                this.clicked = true;

                if(this.numBombs === 0){
                    this.neighbors().forEach( cell => cell.click() );
                }
            }
        }


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
})();
