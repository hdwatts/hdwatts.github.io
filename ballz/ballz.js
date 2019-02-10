var Ballz = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function Breakout ()
    {
        Phaser.Scene.call(this, { key: 'breakout' });
        const rand = Math.random() * game.config.width
        this.bricks;
        this.paddle;
        this.ball = { onPaddle: true, ballNum: 30, nextX: rand };
        this.ballCount = 0;
        this.balls = []
        this.walls;
        this.pointerDown;
        this.graphics;
        this.ballHeight = game.config.height - 10
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
        this.matter.world.setGravity(0, .001);
        //Collision(true, true, true, true);
        const wall1 = this.matter.add.rectangle(game.config.width / 2, game.config.height + 5, game.config.width + 20, 10, {isStatic: true})
        this.walls = [
            this.matter.add.rectangle(-5, (game.config.height + 20) / 2, 10, game.config.height + 20, {isStatic: true}),
            this.matter.add.rectangle(game.config.width + 5, (game.config.height + 20) / 2, 10, game.config.height + 20, {isStatic: true}),
            this.matter.add.rectangle(game.config.width / 2, -5, game.config.width + 20, 10, {isStatic: true}),
            wall1,
        ]

        //  Create the bricks in a 10x6 grid
        this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
        makeBricks = ()=>{
            var bricks = []
            const size = 53
            for(var a = 0; a < 6; a++) {
                for(var b = 0; b < 6; b++) {
                    const number = Math.floor(Math.random() * 30 + 1)
                    const t = this.add.text(a*size + 20, b*size + 20, number, { fontSize: '16px', fill: '#fff' });
                    bricks.push(
                        this.matter.add.sprite((size/2) + a*size, (size/2) + b*size).setDisplaySize(size, size).setStatic(true).setCollisionGroup(1).setData('numLeft', number).setData('text', t)
                    )
                }
            }
            return bricks
        }
        this.bricks = makeBricks()

        //this.ball = this.matter.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        //const ballShape = this.matter.add.circle(400, 500, 10, {bounce: 1, frictionAir: 0, friction: 0})
        createBalls = (index, x)=>index >= 0 && setTimeout(()=>{
            this.ballCount += 1
            const force = 10
            const veloX = Math.cos(this.ball.theta) * force
            const veloY = Math.sin(this.ball.theta) * force
            this.matter.add.sprite(x, this.ballHeight).setCircle(10).setBounce(1).setFriction(0,0,0).setFixedRotation().setVelocity(veloX, veloY).setCollisionGroup(-1)
            createBalls(index - 1, x)
        }, 150)
        
        //this.paddle = this.matter.add.sprite(400, 550).setDisplaySize(100,25).setBounce(0).setFixedRotation()

        this.matterCollision.addOnCollideStart({
          objectA: this.bricks,
          callback: function(eventData) {
            // This function will be invoked any time the player and trap door collide
            const { bodyA, bodyB, gameObjectA, gameObjectB, pair } = eventData;
            this.hitBrick(gameObjectA)
          },
          context: this // Context to apply to the callback function
        });
        this.matterCollision.addOnCollideStart({
            objectA: wall1,
            callback: eventData=>{
                const { bodyA, bodyB, gameObjectA, gameObjectB, pair } = eventData;
                this.ballCount -= 1
                if(this.ball.nextX == null) {
                    this.ball.nextX = gameObjectB.x 
                }
                gameObjectB.destroy()
                console.log(this.ballCount)
                if(this.ballCount == 0) {
                    this.balls = []
                    this.ball.onPaddle = true
                }
            }
        })

        //  Our colliders
        //this.matter.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        //this.matter.add.collider(this.ball, this.bricks, this.hitBrick, null, this);

        //  Input events
        this.input.on('pointermove', pointer => {

            //  Keep the paddle within the game
            if (this.ball.onPaddle && this.ball.dragging)
            {
                const nextX = this.ball.nextX || this.ball.startX
                const delta_x = this.ball.startX - pointer.x
                const delta_y = this.ball.startY - pointer.y
                const _theta = Math.atan2(delta_y, delta_x)
                const theta = Math.min(0, _theta)
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
        }, this)


        this.input.on('pointerup', pointer => {
            console.log(this.ball.onPaddle)
            if (this.ball.onPaddle) {
                this.ball.dragging = false
                createBalls(this.ball.ballNum, this.ball.nextX)
                this.ball.onPaddle = false
                this.ball.nextX = null
            }

        }, this);
    },

    hitBrick: function (brick)
    {
        const num = brick.getData('numLeft') - 1
        const t = brick.getData('text')
        if (num == 0) {
            brick.destroy();
            t.destroy();
        } else {
            brick.setData('numLeft', num)
            t.setText(num)
        }
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

    hitPaddle: function (ball, paddle)
    {
        var diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    },

    update: function ()
    {
        this.graphics.clear()
        this.graphics.fillStyle(0xffffff);
        this.graphics.lineStyle(1, 0xffffff)

        if (this.ball.nextX) {
            this.graphics.fillRect(this.ball.nextX, game.config.height - 10, 10, 10 )
        }
        if (this.ball.dragging) {
            this.graphics.beginPath();
            this.graphics.moveTo(this.ball.nextX, this.ballHeight);
            this.graphics.lineTo(this.ball.nextX + Math.cos(this.ball.theta) * 100, this.ballHeight + Math.sin(this.ball.theta) * 100);
            this.graphics.closePath();
            this.graphics.strokePath();
        }
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
            debug: true
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
