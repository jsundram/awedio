var samples;
var count = 0;

var audioOutput = new Audio();
audioOutput.mozSetup(2, 44100, 1);

function audioWritten(event)
{
    if (!audio.extractSamples) {
        return;
    }

    audio = event.target;
    // sample data is obtained using samples.item(n)
    samples = event.mozFrameBuffer;
    var out = [];
    for (var i = 0; i < samples.length; i+=2) {
        if (audio.buffer.length == audio.extractSamples) {
            audio.pause();
            audio.callback(audio.buffer);
            audio.callback = null;
            audio.extractSamples = null;
            audio.buffer = null;
            break;
        }
        var sample = samples.item(i);
        out.push(sample);
        audio.buffer.push(sample);
        var sample = samples.item(i+1);
        out.push(sample);
        audio.buffer.push(sample);
    }

    audioOutput.mozWriteAudio(out.length, out);

    count += 1;
}

// offset and duration in seconds
function get_audio(offset, duration, callback)
{
    audio = document.getElementById("player");
    audio.volume = 0;
    audio.buffer = [];
    audio.currentTime = offset; // seek
    audio.callback = callback;

    // TODO sample accuracy?
    var frames = Math.floor(duration * 44100) * 2;
    audio.extractSamples = frames;
    audio.play();
}
