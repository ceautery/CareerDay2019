const queueNames = ['Player', 'Button']
const queues = {}
queueNames.forEach(name => queues[name] = [])

const gameObjects = [{
  name: 'Player',
  x: 100, y: 100, w: 50, h: 50,
  states: {
    default: {
      speed: 10,
      color: 'red'
    }
  },
  scripts: {
    collideButton: [{
      private: true,
      f: moveTo,
      parms: {x: 100, y: 100}
    }]
  }
},{
  name: 'Player',
  x: 300, y: 100, w: 50, h: 50,
  states: {
    default: {
      speed: 10,
      color: 'red'
    }
  },
  scripts: {
    collideButton: [{
      private: true,
      f: moveTo,
      parms: {x: 100, y: 100}
    }]
  }
},{
  name: 'Button',
  x: 500, y: 100, w: 50, h: 50,
  states: {
    default: {
      color: 'blue'
    }
  }
}]

const keyActions = {
  ArrowRight: [{
    queue: queues.Player,
    f: move,
    parms: {x: 1, y: 0}
  }]
}

const pen = canvas.getContext('2d')
const [W, H] = [640, 480]
let scale

function draw() {
  pen.clearRect(0, 0, W, H)
  pen.strokeRect(0, 0, W, H)
  gameObjects.forEach(obj => {
    pen.fillStyle = obj.color
    pen.fillRect(obj.x, obj.y, obj.w, obj.h)
  })
  checkCollisions()
}

function checkCollisions() {
  gameObjects.forEach((obj, index) => {
    const others = gameObjects.slice(index + 1)
    others.forEach(other => {
      if (collides(obj, other)) {
        queuePrivateEvent(obj, `collide${other.name}`)
        queuePrivateEvent(other, `collide${obj.name}`)
      }
    })
  })
}

function collides(a, b) {
  return !(a.x > b.x + b.w
    || a.x + a.w < b.x
    || a.y > b.y + b.h
    || a.y + a.h < b.y)
}

function fireEvents() {
  queueNames.map(name => queues[name]).filter(queue => queue.length).forEach(queue => {
    while(queue.length) {
      const { f, parms } = queue.shift()
      gameObjects.filter(obj => obj.queue === queue).forEach(obj => f(obj, parms))
    }
  })

  gameObjects.filter(obj => obj.privateQueue.length).forEach(obj => {
    const queue = obj.privateQueue
    while(queue.length) {
      const { f, parms } = queue.shift()
      f(obj, parms)
    }
  })
  draw()
}

function move(obj, vector) {
  obj.x += vector.x * obj.speed
  obj.y += vector.y * obj.speed
}

function moveTo(obj, vector) {
  obj.x = vector.x
  obj.y = vector.y
}

function resize() {
  canvas.width = Math.min(innerWidth, (innerHeight * W / H) | 0) - 50
  canvas.height = (canvas.width * H / W) | 0

  let scale = canvas.width / W
  pen.resetTransform()
  pen.scale(scale, scale)
  pen.imageSmoothingEnabled = false
  draw()
}

function init() {
  gameObjects.forEach(obj => {
    obj.state = obj.states.default
    obj.queue = queues[obj.name]
    obj.privateQueue = []
    // if (!obj.scripts) obj.scripts = {}
    setFields(obj)
  })
}

function setFields(obj) {
  Object.assign(obj, obj.state)
}

onresize = resize
init()
resize()

onkeydown = e => {
  queueKeyEvents(e.key)
  fireEvents()
}

function queueKeyEvents(key) {
  const actions = keyActions[key]
  if (!actions || actions.length == 0) return

  actions.forEach(action => {
    const {f, parms} = action
    action.queue.push({f, parms})
  })
}

function queuePrivateEvent(obj, eventName) {
  if (!obj.scripts) return

  const scripts = obj.scripts[eventName]
  if (!scripts || !scripts.length) return

  scripts.forEach(script => {
    const {f, parms} = script
    obj.privateQueue.push({f, parms})
  })
}
