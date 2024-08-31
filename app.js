function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function removeHandlers(cell) {
    cell.style.backgroundColor = '#f0f0f0';
    if (cell._dragStartHandler) {
        cell.removeEventListener('dragstart', cell._dragStartHandler);
        delete cell._dragStartHandler; // Clean up the custom property
    }

    if (cell._clickHandler) {
        cell.removeEventListener('click', cell._clickHandler);
        delete cell._clickHandler; // Clean up the custom property
    }
}
var Ships = Array.from(Array(2), _ => Array.from(Array(6), _ => new Array()));;
var currentPlayer = 0;
var sunk = [0, 0];
function bombHandler(e) {
    let cell = e.target;
    const playerHit = currentPlayer ^ 1;
    const shipNumber = parseInt(cell.dataset.shipId.split("-")[1], 10);
    Ships[playerHit][shipNumber].push(cell);
    cell.style.backgroundColor = 'blue';
    cell.removeEventListener('click', bombHandler);
    if(Ships[playerHit][shipNumber].length === shipNumber){
        Ships[playerHit][shipNumber].forEach( x => {
            x.style.backgroundColor = "orange";
        })
        sunk[playerHit]++;
        if(sunk[playerHit] == 4){
            document.getElementById("player1").classList.add("disable");
            document.getElementById("player2").classList.add("disable");
            document.getElementById("turn").innerText = "Player " + (currentPlayer+1) +" Won!";
            let replay = document.createElement("BUTTON");
            replay.innerText = "New Game"
            replay.addEventListener('click', function() {window.location.reload()})
            document.querySelector(".container").appendChild(replay);
        }
    }
}
function emptyHandler(e) {
    let cell = e.target;
    cell.innerText = 'x';
    document.getElementById("player1").classList.toggle("transit");
    document.getElementById("player2").classList.toggle("transit");
    sleep(250).then(() => {
        document.getElementById("player1").classList.toggle("disable");
        document.getElementById("player2").classList.toggle("disable");
        let title = document.getElementById("turn");
        currentPlayer = currentPlayer ^ 1;
        title.innerText =  "Player " + (currentPlayer + 1);
    })
    cell.removeEventListener('click', emptyHandler);    
}
document.addEventListener('DOMContentLoaded', function () {
    loadGrid("#player1", 'yellow');
    loadGrid("#player2", 'red');
    let btn = document.getElementById("readyButton");
    let cnt = 0;
    let p1Ships = Array.from(Array(10), _ => Array(10).fill(0));
    let p2Ships = Array.from(Array(10), _ => Array(10).fill(0));
    btn.addEventListener('click', function () {
        currentPlayer = currentPlayer ^ 1;
        if (cnt === 0) {
            document.getElementById('turn').innerText = "Player " + (currentPlayer + 1);
            document.querySelectorAll("#player1 td").forEach(cell => {
                removeHandlers(cell);
                if (cell.dataset.shipId) {
                    p1Ships[cell.parentNode.rowIndex][cell.cellIndex] = cell.dataset.shipId;
                    cell.addEventListener('click', bombHandler);
                } else {
                    cell.addEventListener('click', emptyHandler)
                }     
            });
            document.getElementById("player1").classList.toggle("disable");
            document.getElementById("player2").classList.toggle("disable");
            document.getElementById("player1").classList.toggle("transit");
            document.getElementById("player2").classList.toggle("transit");
        }
        else if (cnt === 1) {
            document.getElementById('turn').innerText = "Player " + (currentPlayer + 1);
            btn.style.display = 'none';
            document.querySelectorAll("#player2 td").forEach(cell => {
                removeHandlers(cell);
                if (cell.dataset.shipId) {
                    p2Ships[cell.parentNode.rowIndex][cell.cellIndex] = cell.dataset.shipId;
                    cell.addEventListener('click', bombHandler);
                } else {
                    cell.addEventListener('click', emptyHandler);
                }
            });
        }
        
        cnt++;
    });
});

function loadGrid(id, color) {
    const tableBody = document.querySelector(id + ' tbody');
    const numRows = 10;
    const numCols = 10;
    const shipLengths = [5, 4, 3, 2]; // Ship sizes

    // Create grid
    for (let i = 0; i < numRows; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < numCols; j++) {
            const cell = document.createElement('td');
            cell.style.backgroundColor = '#f0f0f0'; // Default cell color
            row.appendChild(cell);
        }
        tableBody.appendChild(row);
    }

    function placeShip(length, startRow, startCol, direction, shipId) {
        for (let i = 0; i < length; i++) {
            let cell;
            if (direction === 'horizontal') {
                cell = tableBody.rows[startRow].cells[startCol + i];
            } else {
                cell = tableBody.rows[startRow + i].cells[startCol];
            }
            if (cell) {
                cell.style.backgroundColor = color; // Ship color
                cell.dataset.shipId = shipId; // Track which ship is in the cell
                cell.dataset.direction = direction;
            }
        }
        makeShipDraggable(shipId);
    }

    let dragging = false;

    function makeShipDraggable(shipId) {
        const shipCells = Array.from(tableBody.querySelectorAll(`td[data-ship-id="${shipId}"]`));
        shipCells.forEach((cell, index) => {
            if (!cell.draggable) {
                cell.draggable = true;

                const dragStartHandler = (e) => dragHandler(e, cell, index);
                cell._dragStartHandler = dragStartHandler; // Store the reference on the element
                cell.addEventListener('dragstart', dragStartHandler);
            }

            if (!cell._clickHandler) {
                const clickHandlerWrapper = (e) => clickHandler(e, cell, index);
                cell._clickHandler = clickHandlerWrapper; // Store the reference on the element
                cell.addEventListener('click', clickHandlerWrapper);
            }
        });
    }

    function dragHandler(e, cell, index) {
        dragging = true;
        e.dataTransfer.setData('shipId', cell.dataset.shipId);
        e.dataTransfer.setData('startRow', cell.parentNode.rowIndex);
        e.dataTransfer.setData('startCol', cell.cellIndex);
        e.dataTransfer.setData('cellOffset', index); // Store which cell within the ship was dragged
        e.dataTransfer.setData('direction', cell.dataset.direction);
    }

    function clickHandler(e, cell, index) {
        e.preventDefault();
        if (!cell.dataset.shipId) {
            return;
        }
        rotate(cell, index);
    }

    function rotate(cell, index) {
        if (dragging) {
            return;
        }
        const direction = cell.dataset.direction;
        const newDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
        const shipId = cell.dataset.shipId;
        const shipLength = shipLengths.find(len => len == shipId.split('-')[1]);
        const mid = Math.round(shipLength / 2);
        const rowIndex = cell.parentNode.rowIndex;
        const colIndex = cell.cellIndex;

        const newRow = direction === 'horizontal' ? rowIndex : rowIndex - index;
        const newCol = direction === 'horizontal' ? colIndex - index : colIndex;

        let x = direction === 'horizontal' ? newRow - mid + 1 : newRow + mid - 1;
        let y = direction === 'horizontal' ? newCol + mid - 1 : newCol - mid + 1;
        x = x < 0 ? 0 : x;
        y = y < 0 ? 0 : y;

        if (canPlaceShip(shipLength, x, y, newDirection, shipId)) {
            removeShipFromGrid(shipId);
            placeShip(shipLength, x, y, newDirection, shipId);
        } else {
            const newIndex = findPlace(shipLength, x, y, newDirection);
            if (newIndex === -1) {
                return;
            }
            const newX = newDirection === 'horizontal' ? x : x - newIndex;
            const newY = newDirection === 'horizontal' ? y - newIndex : y;
            removeShipFromGrid(shipId);
            placeShip(shipLength, newX, newY, newDirection, shipId);
        }
    }

    tableBody.addEventListener('drop', function (e) {

        e.preventDefault();
        const shipId = e.dataTransfer.getData('shipId');
        const cellOffset = parseInt(e.dataTransfer.getData('cellOffset'), 10); // Offset of dragged cell within the ship
        const direction = e.dataTransfer.getData('direction');
        const targetCell = e.target.closest('td');

        if (targetCell) {

            const rowIndex = targetCell.parentNode.rowIndex;
            const colIndex = targetCell.cellIndex;

            let newRow = direction === 'horizontal' ? rowIndex : rowIndex - cellOffset;
            let newCol = direction === 'horizontal' ? colIndex - cellOffset : colIndex;
            const shipLength = shipLengths.find(len => len == shipId.split('-')[1]);

            newRow = newRow < 0 ? 0 : newRow;
            newCol = newCol < 0 ? 0 : newCol;

            if (canPlaceShip(shipLength, newRow, newCol, direction, shipId)) {
                removeShipFromGrid(shipId);
                placeShip(shipLength, newRow, newCol, direction, shipId); // Re-position the ship
            }
        }
        dragging = false;
    });

    // Function to remove ship from the grid
    function removeShipFromGrid(shipId) {
        Array.from(tableBody.querySelectorAll('td')).forEach(cell => {
            if (cell.dataset.shipId === shipId) {
                cell.style.backgroundColor = '#f0f0f0'; // Reset to default cell color
                cell.draggable = false;

                if (cell._dragStartHandler) {
                    cell.removeEventListener('dragstart', cell._dragStartHandler);
                    delete cell._dragStartHandler;
                }

                if (cell._clickHandler) {
                    cell.removeEventListener('click', cell._clickHandler);
                    delete cell._clickHandler;
                }

                delete cell.dataset.shipId;
            }
        });
    }

    function canPlaceShip(length, startRow, startCol, direction, shipId) {
        for (let i = 0; i < length; i++) {
            let cell;
            if (direction === 'horizontal') {
                cell = tableBody.rows[startRow]?.cells[startCol + i];
            } else {
                cell = tableBody.rows[startRow + i]?.cells[startCol];
            }
            if (!cell || (cell.style.backgroundColor === color && cell.dataset.shipId !== shipId)) {
                return false;
            }
        }
        return true;
    }

    function findPlace(length, startRow, startCol, direction) {
        for (let i = 0; i < length; i++) {
            let cell;
            if (direction === 'horizontal') {
                cell = tableBody.rows[startRow]?.cells[startCol + i];
                if (!cell) {
                    return length - i;
                }
            } else {
                cell = tableBody.rows[startRow + i]?.cells[startCol];
                if (!cell) {
                    return length - i;
                }
            }
        }
        return -1;
    }

    function placeShipAtRandom(length) {
        let placed = false;
        while (!placed) {
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'; // Random direction
            const startRow = Math.floor(Math.random() * (direction === 'horizontal' ? numRows : numRows - length + 1));
            const startCol = Math.floor(Math.random() * (direction === 'vertical' ? numCols : numCols - length + 1));
            if (canPlaceShip(length, startRow, startCol, direction, 'init')) {
                placeShip(length, startRow, startCol, direction, `ship-${length}`);
                placed = true;
            }
        }
    }

    shipLengths.forEach(length => {
        placeShipAtRandom(length);
    });

    tableBody.addEventListener('dragover', function (e) {
        e.preventDefault();
    });
}
