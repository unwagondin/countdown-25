const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.background = '#000'
    canvas.style.display = 'block'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
        this.y = y || 0
      }
      static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y)
      }
      static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y)
      }
      add(x, y) {
        if (arguments.length === 1) {
          this.x += x.x
          this.y += x.y
        } else if (arguments.length === 2) {
          this.x += x
          this.y += y
        }
        return this
      }
      sub(x, y) {
        if (arguments.length === 1) {
          this.x -= x.x
          this.y -= x.y
        } else if (arguments.length === 2) {
          this.x -= x
          this.y -= y
        }
        return this
      }
      mult(v) {
        if (typeof v === 'number') {
          this.x *= v
          this.y *= v
        } else {
          this.x *= v.x
          this.y *= v.y
        }
        return this
      }
      setXY(x, y) {
        this.x = x
        this.y = y
        return this
      }
      dist(v) {
        const dx = this.x - v.x
        const dy = this.y - v.y
        return Math.sqrt(dx * dx + dy * dy)
      }
    }

    class Spring {
      constructor(options) {
        this.position = options.position || 0
        this.velocity = 0
        this.target = options.target || 1
        this.frequency = options.frequency || 2.5
        this.halfLife = options.halfLife || 0.05
      }

      step(dt) {
        const f = this.frequency * 2 * Math.PI
        const zeta = Math.log(2) / (f * this.halfLife)
        const omega = f * Math.sqrt(Math.abs(1 - zeta * zeta))
        
        const h = dt
        const x = this.position - this.target
        const v = this.velocity
        
        const c1 = x
        const c2 = (v + zeta * omega * x) / omega
        
        const exp = Math.exp(-zeta * omega * h)
        const cos = Math.cos(omega * h)
        const sin = Math.sin(omega * h)
        
        this.position = this.target + exp * (c1 * cos + c2 * sin)
        this.velocity = -exp * omega * (c1 * (zeta * cos + sin) + c2 * (zeta * sin - cos))
      }
    }

    class Mouse {
      constructor(canvas) {
        this.pos = new Vector(-1000, -1000)
        this.radius = 40
        this.isHovering = false

        canvas.onmousemove = e => {
          this.pos.setXY(e.clientX, e.clientY)
          this.isHovering = true
        }
        canvas.ontouchmove = e => {
          this.pos.setXY(e.touches[0].clientX, e.touches[0].clientY)
          this.isHovering = true
        }
        canvas.ontouchcancel = () => {
          this.pos.setXY(-1000, -1000)
          this.isHovering = false
        }
        canvas.ontouchend = () => {
          this.pos.setXY(-1000, -1000)
          this.isHovering = false
        }
        canvas.onmouseleave = () => {
          this.isHovering = false
        }
      }
    }

    class Dot {
      constructor(x, y) {
        this.pos = new Vector(x, y)
        this.oldPos = new Vector(x, y)
        this.friction = 0.97
        this.gravity = new Vector(0, 0.6)
        this.mass = 2
        this.pinned = false
        this.spring = new Spring({
          position: 0,
          frequency: 2.5,
          halfLife: 0.05
        })
      }

      update(mouse, dt) {
        if (this.pinned) return
        
        let vel = Vector.sub(this.pos, this.oldPos)
        this.oldPos.setXY(this.pos.x, this.pos.y)
        vel.mult(this.friction)
        vel.add(this.gravity)

        let { x: dx, y: dy } = Vector.sub(mouse.pos, this.pos)
        const dist = Math.sqrt(dx * dx + dy * dy)
        const direction = new Vector(dx / dist, dy / dist)
        const force = Math.max((mouse.radius - dist) / mouse.radius, 0)
        
        if (force > 0.6) this.pos.setXY(mouse.pos.x, mouse.pos.y)
        else {
          this.pos.add(vel)
          this.pos.add(direction.mult(force))
        }

        // Update spring for hover effect
      if (mouse.isHovering && dist < mouse.radius * 2) {
  this.spring.target = 1
  this.color = '#0000ff'
} else {
  this.spring.target = 1
  this.color = '#ff0000'
}
this.spring.step(dt)
      }

      drawText(ctx) {
        const scale = Math.max(this.spring.position, 0)
        const size = 80 * scale
        
        ctx.save()
        ctx.fillStyle = this.color || "red"
        ctx.textBaseline = "top"
        ctx.font = `bold ${size}px Helvetica Neue, Helvetica`
        ctx.textAlign = "center"
        ctx.fillText("3", this.pos.x, this.pos.y)
        ctx.restore()
      }

      draw(ctx) {
        ctx.fillStyle = '#ff0000ff'
        ctx.fillRect(this.pos.x - this.mass, this.pos.y - this.mass, this.mass * 2, this.mass * 2)
      }
    }

    class Stick {
      constructor(p1, p2) {
        this.startPoint = p1
        this.endPoint = p2
        this.length = this.startPoint.pos.dist(this.endPoint.pos)
        this.tension = 0.3
      }

      update() {
        const dx = this.endPoint.pos.x - this.startPoint.pos.x
        const dy = this.endPoint.pos.y - this.startPoint.pos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const diff = (dist - this.length) / dist
        const offsetX = diff * dx * this.tension
        const offsetY = diff * dy * this.tension
        const m = this.startPoint.mass + this.endPoint.mass
        const m1 = this.endPoint.mass / m
        const m2 = this.startPoint.mass / m

        if (!this.startPoint.pinned) {
          this.startPoint.pos.x += offsetX * m1
          this.startPoint.pos.y += offsetY * m1
        }
        if (!this.endPoint.pinned) {
          this.endPoint.pos.x -= offsetX * m2
          this.endPoint.pos.y -= offsetY * m2
        }
      }

      draw(ctx) {
        ctx.beginPath()
        ctx.strokeStyle = '#ff0000ff'
        ctx.moveTo(this.startPoint.pos.x, this.startPoint.pos.y)
        ctx.lineTo(this.endPoint.pos.x, this.endPoint.pos.y)
        ctx.stroke()
        ctx.closePath()
      }
    }

    class Rope {
      constructor(config) {
        this.x = config.x
        this.y = config.y
        this.segments = 2
        this.gap = config.gap || 100
        this.dots = []
        this.sticks = []
        this.iterations = 60
        this.create()
      }

      pin(index) {
        this.dots[index].pinned = true
      }

      create() {
        for (let i = 0; i < this.segments; i++) {
          this.dots.push(new Dot(this.x, this.y + i * this.gap))
        }
        for (let i = 0; i < this.segments - 1; i++) {
          this.sticks.push(new Stick(this.dots[i], this.dots[i + 1]))
        }
      }
      
      update(mouse, dt) {
        this.dots.forEach(dot => dot.update(mouse, dt))
        for (let i = 0; i < this.iterations; i++) {
          this.sticks.forEach(stick => stick.update())
        }
      }

      draw(ctx) {
        this.dots.forEach(dot => dot.draw(ctx))
        this.sticks.forEach(stick => stick.draw(ctx))
        this.dots[this.dots.length - 1].drawText(ctx)
      }
    }

    class App {
      static width = innerWidth
      static height = innerHeight
      static dpr = devicePixelRatio > 1 ? 2 : 1
      static interval = 1000 / 60

      constructor() {
        this.canvas = document.querySelector('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.mouse = new Mouse(this.canvas)
        this.resize()
        window.addEventListener('resize', this.resize.bind(this))
        this.createRopes()
        this.lastTime = Date.now()
      }

      createRopes() {
  this.ropes = []
  const TOTAL = 5
  const startX = App.width * 0.2          // premier x
  const endX = App.width * 0.8            // dernier x
  const gapX = (endX - startX) / (TOTAL - 1)  // écart horizontal régulier
  const gapY = App.height * 0.07          // espace vertical entre les dots

  for (let i = 0; i < TOTAL; i++) {
    const x = startX + i * gapX
    const y = 0
    const segments = 10
    const rope = new Rope({ x, y, gap: gapY, segments })
    rope.pin(0) // fixe le haut de la corde
    this.ropes.push(rope)
  }
}
      

      randomNumBetween(min, max) {
        return Math.random() * (max - min) + min
      }

      resize() {
        App.width = innerWidth
        App.height = innerHeight
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.width = App.width * App.dpr
        this.canvas.height = App.height * App.dpr
        this.ctx.scale(App.dpr, App.dpr)
        this.createRopes()
      }

      render() {
        const frame = () => {
          requestAnimationFrame(frame)
          const now = Date.now()
          const dt = Math.min((now - this.lastTime) / 1000, 0.1)
          this.lastTime = now

          this.ctx.fillStyle = '#f4ede2ff'
          this.ctx.fillRect(0, 0, App.width, App.height)

          this.ropes.forEach(rope => {
            rope.update(this.mouse, dt)
            rope.draw(this.ctx)
          })
        }
        requestAnimationFrame(frame)
      }
    }

    window.addEventListener('load', () => {
      const app = new App()
      app.render()
    })