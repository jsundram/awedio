var samples;
var count = 0;

var audioOutput = new Audio();
audioOutput.mozSetup(2, 44100, 1);

function audioWritten(event)
{
    audio = event.target;
    if (!audio.extractSamples) {
        return;
    }

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
function get_audio(audio, offset, duration, callback)
{
    audio.volume = 0;
    audio.buffer = [];
    audio.currentTime = offset; // seek
    audio.callback = callback;

    // TODO sample accuracy?
    var frames = Math.floor(duration * 44100) * 2;
    audio.extractSamples = frames;
    audio.play();
}

function overlap_duration(s1, e1, s2, e2)
{
    if (s1 < s2)
    {
        if (e1 < e2)
            return e1 - s2;
        return e2 - s2;
    }
    // else s2 <= s1
    if (e1 < e2)
        return e1 - s1;
    return e2 - s1;
}

// returns the index of the dominant pitch over the given time-range
function get_color(start, duration, segments)
{
    var end = start + duration;
    pitches = [0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0];
    for (var i = 0; i < segments.length; i++)
    {
        var s = segments[i];
        var e = s.start + s.duration;
        
        if ((start <= s.start && s.start < end) || (start < e && e < end) || (s.start <= start && end <= e) )
        {
            var overlap = overlap_duration(start, end, s.start, e);
            for (var j = 0; j < 12; j++)
            {
                // TODO: weight with loudness and percentage overlap.
                pitches[j] += (overlap / duration) * s.timbre[0] * s.pitches[j];
            }
        }
    }
    
    var max_index = 0;
    for (var k = 0; k < 12; k++)
    {
        if (pitches[max_index] < pitches[k])
            max_index = k;
    }
    
    return max_index;
}
