var buffer = [];
var samples;
var count = 0;


function audioWritten(event)
{
    // sample data is obtained using samples.item(n)
    samples = event.mozFrameBuffer;
    for (var i = 0; i < samples.length; i++)
        buffer.push(samples.item(i));
    
    count += 1;
    audio = document.getElementById("player");
    
    document.getElementById("debug").innerHTML += "Got audio: " + count + " samples=" + samples.length + "time= " + audio.currentTime + " buffer:" + buffer.length + "\n";
}

// offset and duration in seconds
function get_audio(offset, duration, callback)
{
    audio = document.getElementById("player");
    buffer = [];
    audio.currentTime = offset; // seek
    
    var frames = duration * 44100 * 2;
    while (buffer.length < frames)
    {
        
    }
    document.getElementById("debug").innerHTML =  "got buffer:" + buffer.length;
}