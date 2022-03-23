// TODO: Decide and render the game on acceptable bounds per device type
// and only fill/stretch the background.
var min = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
var max = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: window.innerWidth,
  heigth: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const soundQueue = [];

const game = new Phaser.Game(config);
var shapeCount = 5;

const cartoonascSounds = ["cartoonasc1", "cartoonasc2", "cartoonasc3", "cartoonasc4"];
const catSounds = ["meow1", "meow2"];

const shapes = ["circle", "square", "triangle", "star"];
const shapeTints = ["0x00ff00", "0xffff00", "0x0000ff", "0xff8800"];
const goalShapeTints = ["0xe9c7ff", "0xc873ff"];
const goalShapeWidth = min / 5;
const goalShapeHeight = min / 5;
const goalShapeTweenX = goalShapeWidth / 13;
const goalShapeTweenY = goalShapeHeight / 8;
const goalShapeInnerWidthOffset = window.innerWidth - goalShapeWidth;
const goalShapeInnerHeightOffset = window.innerHeight - goalShapeHeight;

function preload() {
  this.load.image("background", "assets/background.png");
  this.load.image("circle", "assets/circle.png");
  this.load.image("square", "assets/square.png");
  this.load.image("triangle", "assets/triangle.png");
  this.load.image("star", "assets/star.png");
  this.load.image("cat1", "assets/cat1.png");

  for (let index = 0; index < cartoonascSounds.length; index++) {
    const sound = cartoonascSounds[index];
    this.load.audio(sound, [
      `assets/${sound}.mp3`,
    ]);
  }

  this.load.audio("celebrate", [
    "assets/zapsplat_fantasy_magic_spell_cast_cheesy_classic_glisando_002_54395.mp3",
  ]);

  for (let index = 0; index < catSounds.length; index++) {
    const sound = catSounds[index];
    this.load.audio(sound, [
      `assets/${sound}.mp3`,
    ]);
  }
}

function create() {

  this.cartoon = this.sound.add("cartoon");
  this.celebrate = this.sound.add("celebrate");

  this.input.addPointer(1);

  var background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, "background");
  background.displayWidth = window.innerWidth;
  background.displayHeight = window.innerHeight;
  //background.smoothed = false;

  this.goalShapes = this.physics.add.staticGroup();

  setupGoalShapes(
    this, 
    0, 
    0, 
    "circle", 
    goalShapeTints[1], 
    goalShapeTweenX, 
    goalShapeTweenY);

  setupGoalShapes(
    this, 
    0, 
    goalShapeInnerHeightOffset, 
    "square", 
    goalShapeTints[1], 
    goalShapeTweenX, 
    goalShapeInnerHeightOffset - goalShapeTweenY);

  setupGoalShapes(
    this, 
    goalShapeInnerWidthOffset, 
    0, 
    "triangle", 
    goalShapeTints[1], 
    goalShapeInnerWidthOffset - goalShapeTweenX, 
    goalShapeTweenY);

  setupGoalShapes(
    this, 
    goalShapeInnerWidthOffset, 
    goalShapeInnerHeightOffset, 
    "star", 
    goalShapeTints[1], 
    goalShapeInnerWidthOffset - goalShapeTweenX, 
    goalShapeInnerHeightOffset - goalShapeTweenY);

  this.moveableShapes = this.physics.add.group();

  this.tapAndPopObjects = this.physics.add.group();

  const catCount = Phaser.Math.Between(0, 3);
  for (let index = 0; index < catCount; index++) {
    setupCat1(
      this, 
      (goalShapeInnerWidthOffset / 2) - (goalShapeWidth / 2), 
      goalShapeInnerHeightOffset);
  
  }

  newRound(this);

  this.input.topOnly = true;
  this.input.on("drag", function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });
  this.input.on("dragend", function (pointer, gameObject, dragX, dragY) {
    gameObject.setTintFill(gameObject.getData("tint"));
  });
  this.input.on("gameobjectdown", function(pointer, gameObject) {
    if (gameObject.getData("type") === "cat1") {
      gameObject.destroy();
      soundQueue.push([getRandomCatMeow()]);
    }
  });
}

function getRandomCatMeow() {
  const meowIndex = Phaser.Math.Between(0, catSounds.length - 1);
  return catSounds[meowIndex];
}

function setupGoalShapes(callingContext, x, y, shape, tint, tweenX, tweenY) {
  const shapeCount = callingContext.goalShapes.children.entries.length;  
  const createdShape = callingContext.goalShapes
    .create(x, y, shape)
    .setOrigin(0, 0)
    .setTintFill(tint)
    .refreshBody()
    .setData("shape", shape);
  
  createdShape.setSize(goalShapeWidth, goalShapeHeight);
  createdShape.setDisplaySize(goalShapeWidth, goalShapeHeight);

  callingContext.tweens.add({
    targets: callingContext.goalShapes.children.entries[shapeCount],
    props: {
      x: { value: tweenX, duration: 750, ease: 'Linear', yoyo: true, repeat: -1 },
      y: { value: tweenY, duration: 500, ease: 'Linear', yoyo: true, repeat: -1 }
    }
  })
}

function setupCat1(callingContext, x, y) {
  var cat1 = callingContext.tapAndPopObjects
    .create(x, y, "cat1")
    .setOrigin(0, 0)
    .setData("type", "cat1")
    .setInteractive();
  
  var catPlottingArea = new Phaser.Geom.Circle(window.innerWidth / 2, window.innerHeight / 2, min / 3);
  Phaser.Actions.RandomCircle(
      callingContext.tapAndPopObjects.getChildren(),
      catPlottingArea
    );

  // TODO: provide cat size variables
  cat1.setSize(goalShapeWidth, goalShapeHeight);
  cat1.setDisplaySize(goalShapeWidth, goalShapeHeight);
}

function newRound(callingContext) {
  var shapePlottingArea = new Phaser.Geom.Circle(window.innerWidth / 2, window.innerHeight / 2, min / 3);

  for (let i = 0; i < shapeCount; i++) {
    var shape = randomShape();
    var tint = randomTint();
    var moveableShape = callingContext.moveableShapes
      .create(0, 0, shape)
      .setOrigin(0, 0)
      .setScale(1)
      .setTintFill(tint)
      .setInteractive()
      .setData("shape", shape)
      .setData("tint", tint);
    callingContext.input.setDraggable(moveableShape);
  }
  Phaser.Actions.RandomCircle(
    callingContext.moveableShapes.getChildren(),
    shapePlottingArea
  );
  callingContext.physics.add.overlap(
    callingContext.moveableShapes,
    callingContext.goalShapes,
    shapeOverlap,
    null,
    callingContext
  );
}

function shapeOverlap(moveableShape, goalShape) {
  if (!shapesMatching(moveableShape, goalShape)) {
    moveableShape.setTintFill("0xff0000");
    return;
  }

  this.moveableShapes.remove(moveableShape, true, true);
  this.sound.play(randomCartoonasc());
}

function shapesMatching(moveableShape, goalShape) {
  return moveableShape.getData("shape") === goalShape.getData("shape");
}

function randomCartoonasc() {
  const cartoonascIndex = Phaser.Math.Between(0, shapes.length - 1);
  return cartoonascSounds[cartoonascIndex];
}

function randomShape() {
  const shapeIndex = Phaser.Math.Between(0, shapes.length - 1);
  return shapes[shapeIndex];
}

function randomTint() {
  const tintIndex = Phaser.Math.Between(0, shapes.length - 1);
  return shapeTints[tintIndex];
}

function update() {
  if (this.moveableShapes.children.entries.length === 0) {
    this.sound.play("celebrate");
    shapeCount++;
    newRound(this);
  }

  if (soundQueue.length > 0) {
    const sound = soundQueue.pop();
    this.sound.play(sound);
  }
}
