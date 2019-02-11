var Ballz = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function Breakout ()
    {
        Phaser.Scene.call(this, { key: 'breakout' });
        const rand = Math.random() * game.config.width
        this.bricks = [];
        this.paddle;
        this.ball = { onPaddle: true, nextX: rand } 
        this.ballCount = 1
        this.balls = []
        this.walls;
        this.pointerDown;
        this.level = 1
        this.graphics;
        this.brickSize = 45
        this.ballHeight = game.config.height - 75
        this.shooting = false
        this.force = 10
        this.goalSize = 10
        this.ballSize = 6
        this.columnNum = 7
        this.ballsLeftText
    },

    preload: function ()
    {
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    },

    create: function ()
    {
        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0xffffff, 1);
        //  Enable world bounds, but disable the floor
        this.matter.world.setBounds(0, 0, game.config.width, game.config.height);
        this.matter.world.setGravity(0, 0);
        //Collision(true, true, true, true);
        const wall1 = this.matter.add.rectangle(game.config.width / 2, this.ballHeight + this.brickSize / 2, game.config.width + 20, this.brickSize, {isStatic: true, showDebug: false})
        this.walls = [
            this.matter.add.rectangle(-50, (game.config.height + 20) / 2, 100, game.config.height + 20, {isStatic: true}),
            this.matter.add.rectangle(game.config.width + 50, (game.config.height + 20) / 2, 100, game.config.height + 20, {isStatic: true}),
            this.matter.add.rectangle(game.config.width / 2, -50, game.config.width + 20, 100, {isStatic: true}),
            wall1,
        ]
        this.ballsLeftText = this.add.text( this.ball.nextX, this.ballHeight - 20, this.ballCount + 'x', { fontSize: '12px', fill: '#fff' });
        //  Create the bricks in a 10x6 grid
        reset = ()=> {
            this.bricks.forEach(brick=>{
                const t = brick.getData('text')
                brick.destroy()
                t && t.destroy()
            })
            this.ballCount = 1
            this.bricks = []
        }
        makeBricks = init=>{
            this.bricks.forEach(brick=>{
                brick.setY(brick.y + this.brickSize)
                if (!brick.getData('goal')) {
                    const t = brick.getData('text')
                    t.setY(t.y + this.brickSize)
                }
            })
            if (this.bricks.find(brick => brick.y > this.brickSize * 8)) {
                reset()
            }
            const newBricks = []
            const num = Math.floor(Math.random() * 5 + 1)
            let newGoal
            do {
             newGoal = init ? -1 : Math.floor(Math.random() * 5 + 1)   
            } while(newGoal == num)
            for(var a = 0; a < this.columnNum; a++) {
                if (newGoal == a) {
                    newBricks.push(
                        this.matter.add.sprite(
                            1 + (this.brickSize/2) + a*this.brickSize,
                            this.brickSize + (this.brickSize/2)
                        ).setCircle(this.goalSize).setStatic(true).setSensor(true).setCollisionGroup(1).setData(
                            'goal',
                            true
                        )
                    )
                } else if (a == num || Math.random() > .75) {
                    const number = !init && Math.random() > .75 ? this.level * 2 : this.level
                    const t = this.add.text(
                        2.5 + a*this.brickSize + this.brickSize / 2 - 8, 
                        this.brickSize + this.brickSize / 2 - 8,
                        number,
                        { fontSize: '16px', fill: '#000' }
                    );
                    newBricks.push(
                        this.matter.add.sprite(
                            2.5 + (this.brickSize/2) + a*this.brickSize,
                            this.brickSize + (this.brickSize/2)
                        ).setDisplaySize(
                            this.brickSize - 2,
                            this.brickSize - 2
                        ).setStatic(true).setCollisionGroup(1).setData(
                            'numLeft',
                            number
                        ).setData(
                            'text',
                            t
                        )
                    )
                }
            }
            this.matterCollision.addOnCollideStart({
                objectA: newBricks,
                callback: function(eventData) {
                // This function will be invoked any time the player and trap door collide
                    const { bodyA, bodyB, gameObjectA, gameObjectB, pair } = eventData;
                    this.hitBrick(gameObjectA)
                },
                context: this // Context to apply to the callback function
            });
            this.bricks = this.bricks.concat(newBricks)
        }
        makeBricks(true)

        createBalls = (index, x)=> {
            if (index > 0) {
                setTimeout(()=>{
                    this.ballsLeftText.setText(index + 'x')
                    const veloX = Math.cos(this.ball.theta) * this.force
                    const veloY = Math.sin(this.ball.theta) * this.force
                    this.balls.push(
                        this.matter.add.sprite(x, this.ballHeight - this.ballSize)
                            .setCircle(this.ballSize)
                            .setBounce(1)
                            .setFriction(0,0,0)
                            .setFixedRotation()
                            .setVelocity(veloX, veloY)
                            .setCollisionGroup(-1)
                    )
                    createBalls(index - 1, x)
                }, 150)
            } else {
                this.ballsLeftText.setText('')
                this.shooting = false
            }
        }
        
        //this.paddle = this.matter.add.sprite(400, 550).setDisplaySize(100,25).setBounce(0).setFixedRotation()


        this.matterCollision.addOnCollideStart({
            objectA: wall1,
            callback: eventData=>{
                const { bodyA, bodyB, gameObjectA, gameObjectB, pair } = eventData;
                if(this.ball.nextX == null) {
                    this.ball.nextX = gameObjectB.x 
                }
                gameObjectB.destroy()
                if(this.shooting == false && !this.balls.find(b=>b.scene)) {
                    this.balls = []
                    this.ball.onPaddle = true
                    this.level += 1
                    this.ballsLeftText.setText(this.ballCount + 'x')
                    this.ballsLeftText.setX(this.ball.nextX)
                    makeBricks()
                }
            }
        })

        //  Input events
        this.input.on('pointermove', pointer => {
            if (this.ball.onPaddle && this.ball.dragging)
            {
                const nextX = this.ball.nextX || this.ball.startX
                const delta_x = this.ball.startX - pointer.x
                const delta_y = this.ball.startY - pointer.y
                const _theta = Math.atan2(delta_y, delta_x)
                const theta = _theta > 0
                    ? _theta > Math.PI / 2
                        ? -Math.PI + .01
                        : -.01
                    : _theta > -Math.PI / 2
                        ? Math.min(_theta, 0 - .01)
                        : Math.max(_theta, -Math.PI + .01)
                this.ball.theta = theta
            }
        }, this);
        this.input.on('pointerdown', pointer => {
          if (this.ball.onPaddle) {
            this.ball.dragging = true
            this.ball.startX = pointer.x
            this.ball.startY = pointer.y
            const nextX = this.ball.nextX
          }
        }, this);

        this.input.on('pointerout', pointer => {
            this.ball.dragging = false
        }, this)


        this.input.on('pointerup', pointer => {
            if (this.ball.onPaddle) {
                this.ball.dragging = false
                this.shooting = true
                createBalls(this.ballCount, this.ball.nextX)
                this.ball.onPaddle = false
                this.ball.nextX = null
            }
        }, this);
    },

    hitBrick: function (brick)
    {
        if (brick.getData('goal')) {
            brick.destroy();
            this.ballCount += 1
        } else {
            const num = brick.getData('numLeft') - 1
            const t = brick.getData('text')
            if (num == 0) {
                brick.destroy();
                t.destroy();
            } else {
                brick.setData('numLeft', num)
                t.setText(num)
            }
        }
        this.bricks = this.bricks.filter(b=>b.scene)
    },
    speedUp: () =>{
        this.balls.forEach(ball=>{
            ball.scene && ball.setVelocityX(ball.body.velocity.x * 2).setVelocityY(ball.body.velocity.y * 2)
        })
    },
    resetBall: function ()
    {
        //this.ball.setVelocity(0);
        //this.ball.setPosition(this.paddle.x, 500);
        //this.ball.setData('onPaddle', true);
    },

    resetLevel: function ()
    {
        this.resetBall();

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    update: function ()
    {
        this.graphics.clear()
        this.graphics.fillStyle(0x1d1d1d);
        this.graphics.fillRect(0, this.ballHeight, game.config.width, this.brickSize * 3 )
        this.graphics.fillStyle(0xffffff);
        this.graphics.lineStyle(1, 0xffffff)

        if (this.ball.nextX) {
            this.graphics.fillStyle(0xff0000);
            this.graphics.fillCircle(this.ball.nextX, this.ballHeight, this.ballSize )
            this.graphics.fillStyle(0xffffff);
        }
        if (this.ball.dragging) {
            this.graphics.beginPath();
            this.graphics.moveTo(this.ball.nextX, this.ballHeight);
            this.graphics.lineTo(this.ball.nextX + Math.cos(this.ball.theta) * 100, this.ballHeight + Math.sin(this.ball.theta) * 100);
            this.graphics.closePath();
            this.graphics.strokePath();
        }
        this.bricks.forEach(brick=>{
            if (brick.getData('goal')) {
                this.graphics.fillCircle(brick.x, brick.y, this.goalSize)
            } else {
                brick.scene && this.graphics.fillRect(brick.x - (this.brickSize / 2), brick.y - (this.brickSize / 2), this.brickSize - 2, this.brickSize - 2)
            }
        })
        this.balls.forEach(ball=>{
            ball.scene && this.graphics.fillCircle(ball.x, ball.y, this.ballSize)
        })
    },
});

var config = {
    type: Phaser.WEBGL,
    width: 320,
    height: 480,
    parent: 'game',
    scene: [ Ballz ],
    debug: true,
    physics: {
        default: "matter",
        matter: {
            debug: false
        },
    },
    plugins: {
        scene: [
        {
            plugin: PhaserMatterCollisionPlugin, // The plugin class
            key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
            mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision
        }
        ]
    }
};

var game = new Phaser.Game(config);
