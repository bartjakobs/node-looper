function Looper(obj){
    if(typeof obj  == 'object'){
        var options = ['sequence', 'length', 'looping', 'muted']
        for(var i in options){
            var key = options[i]
            if(typeof obj[key] != 'undefined'){
                this[key] = obj[key]
            }
        }
    }
    this.sequence = []
    this.length = false
    this.looping = false
    this.muted = false
    this.started = false
    this.recording = true
}

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
Looper.prototype.toggleRecording = function(){
    this.recording = !this.recording
    return this.recording
}

Looper.prototype.onStep = function(cb){
    this.stepCb = cb
}
Looper.prototype.onMute = function(cb){
    this.muteCb = cb
}

Looper.prototype.mute = function(){
    this.muted = !this.muted
    if(!this.muted){
        this.lastLoopStartTime = new Date
        this.lastPlayedIndex = 0
    }
    if(typeof this.muteCb == 'function') this.muteCb()
    return this.muted
}

Looper.prototype.start = function(){
    this.started = true
    this.startTime = new Date
    this.lastLoopStartTime = new Date
    this.lastStepTime = new Date
    this.lastPlayedIndex = 0
    this.intervalId = setInterval(this.step.bind(this), 2)
}

Looper.prototype.add = function(obj){
    if(!this.recording) return
    if(this.muted) return
    if(!this.started) return
    var obj ={time: new Date - this.lastLoopStartTime, data: obj, isNew: true}
    this.sequence.push(obj)
    this.sequence.sort(Looper.compare)
}

Looper.prototype.loop = function(){
    this.looping = true
    this.length = new Date - this.startTime
}

Looper.prototype.step = function(){

    var restarted = false
    var currentTime = new Date - this.lastLoopStartTime

    if(this.length && currentTime > this.length){
        this.lastLoopStartTime = new Date(this.lastLoopStartTime.getTime() + this.length)
        restarted = true
    }
    currentTime = new Date - this.lastLoopStartTime
    if(typeof this.stepCb != 'function') return
    if(restarted){ // flush notes at the end...
        while(this.lastPlayedIndex < this.sequence.length){
            if(!this.muted) this.stepCb(this.sequence[this.lastPlayedIndex++].data)
            else break
        }
        this.lastPlayedIndex = 0
    }

    while((this.sequence.length > this.lastPlayedIndex) && this.sequence[this.lastPlayedIndex].time < currentTime){
        var obj = this.sequence[this.lastPlayedIndex]
        this.lastPlayedIndex++
        if(obj.isNew === true){ // don't repeat just new notes
            delete obj.isNew
            continue
        }
        if(!this.muted) this.stepCb(obj.data)
    }

}
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
