/**
 * This example shows how node-looper can be used as a looping machine.
 * When looper.start() is called, it receives input from looper.add(message).
 * After looper.loop() is called, it starts looping and plays back the events received in the previous loops
 * using the callback (attached using looper.onStep(cb)).
 *
 * This example uses the keypress library to start, start looping and mute input/output.
 * If the example is not working, find your midi input and output ports and change it at input.openPort and output.openPort.
 */

var midi = require('midi')
var Looper = require("../lib/looper.js")
var keypress = require('keypress')

/// Looper
var looper = new Looper()

//Input
var input = new midi.input()
input.on('message', function(deltaTime, message) {
    if(message[0] >= 0x80 && message[0] <= 0x9F){ // If the event is a note on (0x90-0x9F) or note off (0x80-0x8F)
        looper.add(message) // add it to the loop
    }
})
input.openPort(0)

// Output
var output = new midi.output()
output.openPort(0)

looper.onStep(function(arg){
    output.sendMessage(arg)
})

// Keypress handler

keypress(process.stdin)
process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.on('keypress', function (ch, key) {
    if((key && key.ctrl && key.name == 'c')||key.name == 'q'){
        console.log("Quitting")
        process.exit()
    }
    if(ch == ' '){
        if(looper.looping){
            var mute = looper.mute()
            console.log(mute?"Muting":"Not muting")
        }
        else if(looper.started){
            console.log("Looping. Press space again to toggle muting.")
            return looper.loop()
        }
        else {
            console.log("Starting")
            looper.start()
        }
        return
    }
    if(key.name == 'a'){
        var recording = looper.toggleRecording()
        console.log(recording?"Recording":"Not recording")
    }
    if(key.name == 'r'){
        looper.reset()
        console.log("Reset")
    }
})
console.log("Midi-looper.")
console.log("Press space to start recording.\nPress space again to start looping.\nPress 'a' to toggle recording.\nPress q to quit.\n")
