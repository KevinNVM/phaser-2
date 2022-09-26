import Phaser from "phaser";
import $ from "jquery";

$("*").css({
  boxSizing: "border-box",
});

$("body").css({
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: 0,
  padding: 0,
  backgroundColor: "rgb(35, 35, 35)",
});

globalThis.movSpeed = 350;
globalThis.jumpHeight = 400;
globalThis.starPoint = 10;
globalThis.gameTimer = 200; // Seconds

globalThis.clearMaxScore = () => {
  localStorage.setItem("maxScore", 0);
  location.reload();
};

class GameScene extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.spritesheet({
      key: "player",
      url: require("./assets/dude.png"),
      frameConfig: {
        frameWidth: 32,
        frameHeight: 48,
      },
    });
    this.load.image({
      key: "capy-walk",
      url: require("./assets/capy-walk.png"),
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64,
      },
    });
    // this.load.spritesheet({
    //   key: "player-hurt",
    //   url: require("./assets/capy-sit.png"),
    //   frameConfig: {
    //     frameWidth: 64,
    //     frameHeight: 64,
    //   },
    // });
    this.load.image({
      key: "bomb",
      url: require("./assets/bomb.png"),
    });
    this.load.image({
      key: "platform",
      url: require("./assets/platform.png"),
    });
    this.load.image({
      key: "star",
      url: require("./assets/star.png"),
    });
    this.load.image({
      key: "sky",
      url: require("./assets/sky.png"),
    });
  }

  create() {
    const { width, height } = this.sys.game.canvas;
    this.add.sprite(width / 2, height / 2, "sky");

    // Score
    this.score = 0;
    this.maxScore = localStorage.getItem("maxScore") || 0;
    this.scoreText = this.add.text(
      16,
      16,
      `Highest ${this.maxScore} ${this.score}`,
      {
        fontSize: "20px",
        fill: "#ffff",
      }
    );

    // Timer
    this.time = this.time.addEvent({
      delay: gameTimer * 1000,
      paused: false,
      callback: () => {
        if (prompt(`Score: ${this.score}\nRestart ?`)) location.reload();
        else location = "//github.com/kevinnvm";
      },
    });
    this.timeText = this.add.text(width * 0.9, 16, "0.0", {
      font: "20px",
    });

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms
      .create(400, 568, "platform")
      .setScale(2)
      .setTint(Math.random() * 0xffffffff)
      .refreshBody();
    this.platforms.create(265, 100, "platform");
    this.platforms.create(600, 400, "platform");
    this.platforms.create(50, 300, "platform");
    this.platforms.create(650, 250, "platform");
    this.platforms.create(75, 455, "platform");

    // Power Up
    this.powers = this.physics.add.staticGroup();
    this.powers.create(650, 220, "bomb").setScale(2).setTint(0);

    // Player
    this.player = this.physics.add.sprite(100, height - 100, "player");
    this.player.setDepth(1);
    this.player.setScale(1.25);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.player.setGravityY(600);
    this.player.setMaxVelocity(movSpeed * 5);

    // Objects
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 5,
      setXY: {
        x: this.sys.game.canvas.width / 3,
        y: 0,
        stepX: Phaser.Math.Between(50, 76),
      },
    });
    this.stars.children.iterate((child) => {
      child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.9));
    });
    this.bombs = this.physics.add.group();

    // Collider
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(this.stars, this.platforms, (star, platform) => {
      star.y += 20;
    });
    this.physics.add.overlap(this.powers, this.player, (player, powers) => {
      this.player.setVelocityY(-600);
      this.player.body.velocity.x = 0;
    });
    this.physics.add.overlap(this.stars, this.player, (player, star) => {
      star.scaleX = Number(star.scaleX - 0.5).toFixed(1);
      star.scaleY = Number(star.scaleY - 0.5).toFixed(1);
      if (star.body.width <= 0 || star.body.height <= 0)
        star.disableBody(true, true);
      this.score += starPoint;

      if (this.score > this.maxScore) {
        this.maxScore = this.score;
        localStorage.setItem("maxScore", this.score);
      }
      this.scoreText.setText(`Highest ${this.maxScore} ${this.score}`);

      if (!this.stars.countActive()) {
        this.stars.children.iterate(function (child) {
          child.setScale(1);
          child.enableBody(
            true,
            child.x,
            Phaser.Math.Between(0, 500),
            true,
            true
          );
        });
      } else return;

      // Spawn Bombs
      var x =
        player.x > 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      for (let i = 0; i < 1; i++) {
        var bomb = this.bombs.create(x, Phaser.Math.Between(0, 20), "bomb");
        bomb.setScale(1.5);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(200, 200);
      }
    });
    this.physics.add.overlap(this.bombs, this.player, (player, bomb) => {
      this.physics.pause();

      player.setTint("0xff0000");

      player.anims.play("idle");
      player.disableBody(true, false);

      this.gameOver = true;
      this.time.paused = true;
      setTimeout(() => {
        if (confirm(`Score: ${this.score}\nRestart ?`)) location.reload();
        else location = "//github.com/kevinnvm";
      }, 500);
    });

    // Keybinds
    this.cursors = this.input.keyboard.createCursorKeys();

    // Animation For Player
    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 4 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", {
        start: 5,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  update() {
    // Jumping
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      setTimeout(() => {
        this.player.setVelocityY(-jumpHeight);
      }, 50);
    } else if (!this.player.body.touching.down) {
    }

    // Moving Left & Right
    if (this.cursors.left.isDown) {
      if (this.player.body.velocity.x > -movSpeed) {
        this.player.body.velocity.x -= 20;
      } else if (this.player.body.velocity.x < movSpeed) {
        this.player.body.velocity.x += 20;
      }
      // this.player.body.velocity.x = -movSpeed;
      this.player.play("left", true);
      // this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
      if (this.player.body.velocity.x > movSpeed) {
        this.player.body.velocity.x -= 20;
      } else if (this.player.body.velocity.x < movSpeed) {
        this.player.body.velocity.x += 20;
      }
      // this.player.body.velocity.x = movSpeed;
      this.player.play("right", true);
      this.player.flipX = false;
    } else {
      // if (this.player.body.velocity.x > 0 && this.player.body.velocity.x < 0) {
      //   this.player.setVelocityX(this.player.body.velocity.x - 1);
      // } else if (
      //   this.player.body.velocity.x < 0 &&
      //   this.player.body.velocity.x > 0
      // ) {
      //   this.player.setVelocityX(this.player.body.velocity.x + 1);
      // } else this.player.setVelocityX(0);

      setTimeout(() => {
        this.player.setVelocityX(0);
        this.player.play("idle", true);
      }, 0);
    }

    // Star Check pos
    this.stars.children.iterate((e) => {
      if (e.x >= 500) e.x = 400;
    });

    // Timer
    // console.log(this.time.getRemainingSeconds().toFixed(0));
    this.timeText.setText(this.time.getRemainingSeconds().toFixed(1));
    this.stars.children.iterate((child) => {
      console.log(
        this.stars.countActive(),
        child.x,
        this.sys.game.canvas.width
      );
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: GameScene,
};

// init
const game = new Phaser.Game(config);
