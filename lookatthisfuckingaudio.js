var ROWS = 4;
var COLS = 8;

function drawGrid() {
    var ctx = gridElt.getContext('2d');
    ctx.clearRect(0, 0, gridElt.width, gridElt.height);

    ctx.strokeStyle = '#aaaaaa';
    // DRAW COLS
    for (var i = 0; i < COLS; i++) {
        var x = (i + 1) * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gridElt.height);
        ctx.stroke();
    }

    // DRAW ROWS
    for (var i = 0; i < ROWS; i++) {
        var y = (i + 1) * rowHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gridElt.width, y);
        ctx.stroke();
    }

    for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < ROWS; j++) {
            if (gridData[i][j] != null) {
                ctx.beginPath();
                ctx.arc((i + 1) * colWidth, (j + 1) * rowHeight, 10, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }
    }

    if (draggingGridCoord != null) {
        ctx.beginPath();
        ctx.arc((draggingGridCoord[1] + 1) * colWidth, (draggingGridCoord[0] + 1) * rowHeight, 20, 0, Math.PI * 2, true);
        ctx.fill();
    }
}

function drawTimeline() {
    var ctx = timelineElt.getContext('2d');

    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        ctx.strokeRect(range.start * scale + 2, 0, range.duration * scale - 4, timelineElt.height);
    }
}

function drawDraggingRange() {
    var ctx = draggingRangeElt.getContext('2d');
    ctx.strokeRect(0, 0, draggingRange.duration * scale - 4, timelineElt.height);
}

var timelineElt;
var gridElt;
var draggingRangeElt;
var scale;
var colWidth;
var rowHeight;

var draggingRange;
var draggingGridCoord = null;

var gridData;

function init() {
    gridElt = $('grid');
    timelineElt = $('timeline');
    draggingRangeElt = $('dragging_range');

    scale = timelineElt.width / trackLength;

    colWidth = gridElt.width / (COLS + 1);
    rowHeight = gridElt.height / (ROWS + 1);

    clearGridData();

    timelineElt.observe('mousedown', handleTimelineMousedown);
    drawTimeline();
    drawGrid();
}

function clearGridData() {
    gridData = [];
    for (var i = 0; i < COLS; i++) {
        gridData[i] = [];
        for (var j = 0; j < ROWS; j++) {
            gridData[i][j] = null;
        }
    }
}

function handleTimelineMousedown(e) {
    var x = e.pointerX();
    var position = (e.pointerX() - timelineElt.cumulativeOffset().left + timelineElt.cumulativeScrollOffset().left) / scale;
    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        if (position >= range.start && position < range.start + range.duration) {
            draggingRange = range;
            draggingRangeElt.show();
            draggingRangeElt.width = Math.ceil(range.duration * scale);
            drawDraggingRange();
        }

        $(document).observe('mousemove', handleDragMousemove);
        $(document).observe('mouseup', handleDragMouseup);

        positionDraggingRange(e.pointerX(), e.pointerY());
    }
    e.stop();
}

function handleDragMousemove(e) {
    var x = e.pointerX();
    var y = e.pointerY();
    positionDraggingRange(x, y);
    e.stop();
}

function positionDraggingRange(x, y) {
    var dims = draggingRangeElt.getDimensions();
    draggingRangeElt.style.top = y - dims.height / 2 + 'px';
    draggingRangeElt.style.left = x - dims.width / 2 + 'px';
    var gridPos = gridElt.cumulativeOffset();
    var gridDims = gridElt.getDimensions();
    if (x >= gridPos.left && x < gridPos.left + gridDims.width && y >= gridPos.top && y < gridPos.top + gridDims.height) {
        var gridX = x - gridPos.left;
        var gridY = y - gridPos.top;
        draggingGridCoord = getCoord(gridX, gridY);
        drawGrid();
    }
}

function getCoord(x, y) {
    var col = Math.floor((x + colWidth / 2) / colWidth) - 1;
    var row = Math.floor((y + rowHeight / 2) / rowHeight) - 1;
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        return [row, col];
    }
    else {
        return null;
    }
}

function handleDragMouseup(e) {
    positionDraggingRange(e.pointerX(), e.pointerY());
    if (draggingGridCoord != null) {
        gridData[draggingGridCoord[1]][draggingGridCoord[0]] = draggingRange;
    }
    draggingGridCoord = null;
    drawGrid();
    draggingRangeElt.hide();
    $(document).stopObserving('mousemove', handleDragMousemove);
    $(document).stopObserving('mouseup', handleDragMouseup);
    e.stop();
}
