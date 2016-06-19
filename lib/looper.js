/**
 * NodeJS Looper constructor.
 * @param {object} obj Config object.
 * {
 * 	 sequence: initial sequence,
 * 	 length: initial length,
 * 	 looping: initial looping,
 * 	 muted: initial muting
 * }
 */
function Looper(obj){
    this.sequence = []
    this.length = false
    this.looping = false
    this.muted = false
    this.started = false
    this.recording = true
    if(typeof obj  == 'object'){
        var options = ['sequence', 'length', 'looping', 'muted']
        for(var i in options){
            var key = options[i]
            if(typeof obj[key] != 'undefined'){
                this[key] = obj[key]
            }
        }
    }
}

/**
 * Start looping.
 */
Looper.prototype.start = function(){
    this.started = true
    this.startTime = new Date
    this.lastLoopStartTime = new Date
    this.lastStepTime = new Date
    this.lastPlayedIndex = 0
    this.intervalId = setInterval(this.step.bind(this), 2)
}
/**
 * Reset the looping code.
 * Resets everything to original state.
 */
Looper.prototype.reset = function() {
    if(typeof this.muteCb == 'function') this.muteCb()
    this.sequence = []
    this.length = false
    this.looping = false
    this.muted = false
    this.started = false
    this.recording = true
    clearInterval(this.intervalId)
}

/**
 * Starts looping.
 */
Looper.prototype.loop = function(){
    if(this.looping) return
    this.looping = true
    this.length = new Date - this.startTime
}

/**
 * Toggles recording Looper.add calls.
 * @return {boolean} Whether this looper is currently recording.
 */
Looper.prototype.toggleRecording = function(){
    this.recording = !this.recording
    return this.recording
}

/**
 * Adds the callback function that should be called when a event should be repeated.
 * @param  {Function} cb Callback function.
 */
Looper.prototype.onStep = function(cb){
    this.stepCb = cb
}

/**
 * Adds the callback function that should be called when muting.
 * Eg. a midi reset / all notes off function
 * @param  {Function} cb Callback function
 */
Looper.prototype.onMute = function(cb){
    this.muteCb = cb
}

/**
 * Mute looper
 * @return {boolean} Whether this looper is currently muting.
 */
Looper.prototype.mute = function(){
    this.muted = !this.muted
    if(!this.muted){
        this.lastLoopStartTime = new Date
        this.lastPlayedIndex = 0
    }
    if(typeof this.muteCb == 'function') this.muteCb()
    return this.muted
}

/**
 * Add an event to the loop sequence.
 * @param  {object} obj event
 */
Looper.prototype.add = function(obj){
    if(!this.recording) return
    if(this.muted) return
    if(!this.started) return
    var obj ={time: new Date - this.lastLoopStartTime, data: obj, isNew: true}
    this.sequence.push(obj)
    this.sequence.sort(Looper.compare)
}

/**
 * Step event, called by a setInterval.
 */
Looper.prototype.step = function(){
    var restarted = false
    var currentTime = new Date - this.lastLoopStartTime // current time in this loop.
    // If this is the end of a loop.
    if(this.length && currentTime > this.length){
        this.lastLoopStartTime = new Date(this.lastLoopStartTime.getTime() + this.length)
        restarted = true
        currentTime = new Date - this.lastLoopStartTime
    }
    if(typeof this.stepCb != 'function') return
    if(restarted){ // flush events at the end...
        while(this.lastPlayedIndex < this.sequence.length){
            if(!this.muted) this.stepCb(this.sequence[this.lastPlayedIndex++].data)
            else break
        }
        this.lastPlayedIndex = 0
    }

    while((this.sequence.length > this.lastPlayedIndex) && this.sequence[this.lastPlayedIndex].time < currentTime){
        var obj = this.sequence[this.lastPlayedIndex]
        this.lastPlayedIndex++
        if(obj.isNew === true){ // don't repeat just new events
            delete obj.isNew
            continue
        }
        if(!this.muted) this.stepCb(obj.data)
    }

}
/**
 * Compare function for sorting events in the sequence.
 * @param  {object} a
 * @param  {object} b
 * @return {number} 
 */
Looper.compare = function (a, b) {
  if (a.time < b.time) {
    return -1
  }
  if (a.time > b.time) {
    return 1
  }
  return 0
}
module.exports = Looper
