var COLOR_TIMELINE = true;
var COLOR_GRID = true;

var ROWS = 5;
var COLS = 16 + 1;

function drawGrid() {
    var ctx = gridElt.getContext('2d');
    ctx.clearRect(0, 0, gridElt.width, gridElt.height);

    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    // DRAW COLS
    for (var i = 0; i < COLS - 1; i++) {
        var x = Math.floor((i + 2) * colWidth) + .5;
        ctx.beginPath();
        ctx.moveTo(x, rowHeight / 2);
        ctx.lineTo(x, gridElt.height - rowHeight / 2);
        ctx.stroke();
    }

    // DRAW ROWS
    ctx.fillStyle = '#333333';
    for (var i = 0; i < ROWS; i++) {
        var y = Math.floor((i + 1) * rowHeight) + .5;
        ctx.beginPath();
        ctx.moveTo(colWidth / 2, y);
        ctx.lineTo(gridElt.width - colWidth / 2, y);
        ctx.stroke();
    }

    for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < ROWS; j++) {
            var range = gridData[i][j];
            if (range != null) {
                ctx.fillStyle = range.color;
                ctx.beginPath();
                ctx.arc((i + 1) * colWidth, (j + 1) * rowHeight, 10, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }
    }

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    if (draggingGridCoord != null) {
        ctx.beginPath();
        ctx.arc((draggingGridCoord[1] + 1) * colWidth, (draggingGridCoord[0] + 1) * rowHeight, 14, 0, Math.PI * 2, true);
        ctx.stroke();
    }
}

var pitchColors = [[47, 255, 0], [160, 255, 0], [255, 227, 0], [255, 90, 0], [255, 0, 0], [255, 0, 0], [167, 0, 0], [98, 0, 181], [67, 0, 242], [0, 0, 255], [0, 132, 255], [0, 255, 216]];

function drawTimeline() {
    var ctx = timelineElt.getContext('2d');

    var segmentHeight = timelineElt.height / 12;

    ctx.strokeStyle = '#aaaaaa';
    ctx.clearRect(0, 0, timelineElt.width, timelineElt.height);
    if (COLOR_TIMELINE) {
        for (var i = 0; i < analysis.segments.length; i++) {
            var segment = analysis.segments[i];
            for (var j = 0; j < 12; j ++) {
                var color = pitchColors[j];
                ctx.fillStyle = 'rgba(' + color.join(',') + ',' + segment.pitches[j] + ')';
                ctx.fillRect(Math.floor(segment.start * scale) + .5, .5 + segmentHeight * j, Math.floor(segment.duration * scale), segmentHeight);
            }
        }
    }

    ctx.strokeStyle = '#aaaaaa';

    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        ctx.strokeRect(Math.floor(range.start * scale + 1) + .5, .5, Math.floor(range.duration * scale - 2), timelineElt.height - 1);
    }
}

function drawDraggingRange() {
    var ctx = draggingRangeElt.getContext('2d');
    ctx.fillStyle = draggingRange.color;
    ctx.fillRect(0, 0, Math.floor(draggingRange.duration * scale - 4), timelineElt.height);
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

var columnSamples = 44100 * 2 * .5;



function init() {
    gridElt = $('grid');
    timelineElt = $('timeline');
    draggingRangeElt = $('dragging_range');

    scale = timelineElt.width / trackLength;

    colWidth = gridElt.width / (COLS + 1);
    rowHeight = gridElt.height / (ROWS + 1);

    clearGridData();

    gridElt.observe('click', handleGridClick);

    timelineElt.observe('mousedown', handleTimelineMousedown);
    $('range_type').observe('change', updateTimeline);
    updateTimeline();
    drawGrid();

    $('play_button').observe('click', playGrid);
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

function updateTimeline() {
    ranges = analysis[$('range_type').value];
    drawTimeline();
}

function handleTimelineMousedown(e) {
    var x = e.pointerX();
    var position = (e.pointerX() - timelineElt.cumulativeOffset().left + timelineElt.cumulativeScrollOffset().left) / scale;
    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        if (position >= range.start && position < range.start + range.duration) {
            draggingRange = range;
            if (!draggingRange.color) {
                if (COLOR_GRID) {
                    var color = pitchColors[get_color(range.start, range.duration, analysis.segments)].join(',');
                    draggingRange.color = 'rgb(' + color + ')';
                }
                else {
                    draggingRange.color = '#333333';
                }
            }
            get_audio(range.start, range.duration, function(audio) {range.audio = audio});
            draggingRangeElt.show();
            draggingRangeElt.width = Math.ceil(range.duration * scale);
            drawDraggingRange();
            $(document).observe('mousemove', handleDragMousemove);
            $(document).observe('mouseup', handleDragMouseup);

            positionDraggingRange(e.pointerX(), e.pointerY());
            break;
        }
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

function handleGridClick(e) {
    e.stop();
    var gridPos = gridElt.cumulativeOffset();
    var gridX = e.pointerX() - gridPos.left;
    var gridY = e.pointerY() - gridPos.top;
    var coord = getCoord(gridX, gridY);
    if (gridData[coord[1]][coord[0]] != null) {
        gridData[coord[1]][coord[0]] = null;
        drawGrid();
        return;
    }
    for (var i = coord[1] - 1; i >= 0; i--) {
        if (gridData[i][coord[0]]) {
            gridData[coord[1]][coord[0]] = gridData[i][coord[0]];
            drawGrid();
            break;
        }
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

function getColumnAudio(columnIndex) {
    var result = [];

    var column = gridData[columnIndex];

    var numSamples = 0;

    for (var i = 0; i < columnSamples; i++) {
        var sample = 0;
        for (var j = 0; j < ROWS; j++) {
            if (column[j] && column[j].audio.length > i) {
                sample += column[j].audio[i];
                numSamples++;
            }
        }
        result[i] = sample;
    }
    return result;
}

function playGrid() {
    columnSamples = 44100 * 2 * parseFloat($('column_seconds').value);
    var loops = parseInt($('loop_count').value);
    var audioOutput = new Audio();
    audioOutput.mozSetup(2, 44100, 1);

    for (var l = 0; l < loops; l++) {
        for (var i = 1; i < COLS; i++) {
            var samples = getColumnAudio(i);
            var buffered = audioOutput.mozWriteAudio(samples.length, samples);
        }
    }
}
