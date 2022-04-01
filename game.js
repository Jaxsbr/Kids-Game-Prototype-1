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

const cartoonascSounds = ["cartoonasc1", "cartoonasc2", "cartoonasc3", "cartoonasc4"];
const catSounds = ["meow1", "meow2", "meow3", "meow4", "meow5", "meow6", "meow7"];
const catImageCount = 3;
const celebrateSounds = ["celebrate1", "celebrate2"];
const celebrateSoundName = "celebrate";
const thudSoundName = "thud";

const shapes = ["circle", "square", "triangle", "star"];
const shapeTints = ["0x00ff00", "0xffff00", "0x0000ff", "0xff8800"];
const goalShapeTints = ["0xe9c7ff", "0xc873ff"];
const moveableShapeWidth = min / 5.5;
const moveableShapeHeight = min / 5.5;
const goalShapeWidth = min / 5;
const goalShapeHeight = min / 5;
const goalShapeTweenX = goalShapeWidth / 13;
const goalShapeTweenY = goalShapeHeight / 8;
const goalShapeInnerWidthOffset = window.innerWidth - goalShapeWidth;
const goalShapeInnerHeightOffset = window.innerHeight - goalShapeHeight;
let round = 0;

function preload() {
  this.load.image("background", "assets/background.png");
  this.load.image("circle", "assets/circle.png");
  this.load.image("square", "assets/square.png");
  this.load.image("triangle", "assets/triangle.png");
  this.load.image("star", "assets/star.png");

  for (let index = 0; index < catImageCount; index++) {
    this.load.image(`cat${index}`, [
      `assets/cat${index}.png`,
    ]);
  }

  for (let index = 0; index < cartoonascSounds.length; index++) {
    const sound = cartoonascSounds[index];
    this.load.audio(sound, [
      `assets/${sound}.mp3`,
    ]);
  }

  for (let index = 0; index < celebrateSounds.length; index++) {
    const sound = celebrateSounds[index];
    this.load.audio(sound, [
      `assets/${sound}.mp3`,
    ]);
  }

  this.load.audio(thudSoundName, [
    "assets/thud.mp3",
  ]);

  for (let index = 0; index < catSounds.length; index++) {
    const sound = catSounds[index];
    this.load.audio(sound, [
      `assets/${sound}.mp3`,
    ]);
  }
}

function create() {
  var background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, "background");
  background.displayWidth = window.innerWidth;
  background.displayHeight = window.innerHeight;

  this.goalShapes = this.physics.add.staticGroup();
  this.moveableShapes = this.physics.add.group();
  this.tapAndPopObjects = this.physics.add.group();
  
  configureInput(this);
  newRound(this);
}

function configureGoalShapes(callingContext) {
  setupGoalShapes(
    callingContext, 
    goalShapeWidth / 2,
    goalShapeHeight / 2,
    "circle", 
    goalShapeTints[1], 
    goalShapeWidth / 2 + goalShapeTweenX,
    goalShapeHeight / 2 + goalShapeTweenY);

  setupGoalShapes(
    callingContext, 
    goalShapeWidth / 2, 
    goalShapeInnerHeightOffset + goalShapeHeight / 2, 
    "square", 
    goalShapeTints[1], 
    goalShapeWidth / 2 + goalShapeTweenX,
    goalShapeInnerHeightOffset - (goalShapeTweenY - goalShapeHeight / 2));

  setupGoalShapes(
    callingContext, 
    goalShapeInnerWidthOffset + goalShapeWidth / 2, 
    goalShapeHeight / 2,
    "triangle", 
    goalShapeTints[1], 
    goalShapeInnerWidthOffset - (goalShapeTweenX - goalShapeWidth / 2), 
    goalShapeHeight / 2 + goalShapeTweenY);

  setupGoalShapes(
    callingContext, 
    goalShapeInnerWidthOffset + goalShapeWidth / 2, 
    goalShapeInnerHeightOffset + goalShapeHeight / 2, 
    "star", 
    goalShapeTints[1], 
    goalShapeInnerWidthOffset - (goalShapeTweenX - goalShapeWidth / 2), 
    goalShapeInnerHeightOffset - (goalShapeTweenY - goalShapeHeight / 2));
}

function configureInput(callingContext) {
  callingContext.input.topOnly = true;

  callingContext.input.on("drag", function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  callingContext.input.on("dragend", function (pointer, gameObject, dragX, dragY) {
    gameObject.setTintFill(gameObject.getData("tint"));
  });

  callingContext.input.on("gameobjectdown", function(pointer, gameObject) {
    if (gameObject.getData("type") === "cat") {
      gameObject.destroy();
      soundQueue.push([getRandomCatMeow()]);
    }
  });
}

function getRandomCatMeow() {
  const meowIndex = Phaser.Math.Between(0, catSounds.length - 1);
  return catSounds[meowIndex];
}

function getRandomCat() {
  const catIndex = Phaser.Math.Between(0, catImageCount - 1);
  return `cat${catIndex}`;
}

function setupGoalShapes(callingContext, x, y, shape, tint, tweenX, tweenY) {
  const createdShape = callingContext.goalShapes
    .create(x, y, shape)
    .setOrigin(0.5, 0.5)
    .setTintFill(tint)
    .refreshBody()
    .setData("shape", shape);
  
  createdShape.setSize(goalShapeWidth, goalShapeHeight);
  createdShape.setDisplaySize(goalShapeWidth, goalShapeHeight);

  callingContext.tweens.add({
    targets: [createdShape],
    props: {
      x: { value: tweenX, duration: 750, ease: 'Linear', yoyo: true, repeat: -1 },
      y: { value: tweenY, duration: 500, ease: 'Linear', yoyo: true, repeat: -1 }
    }
  })
}

function setupCat(callingContext, x, y) {
  const catCount = Phaser.Math.Between(1, 7);
  for (let index = 0; index < catCount; index++) {
    var randomCat = getRandomCat();
    var cat = callingContext.tapAndPopObjects
      .create(x, y, randomCat)
      .setOrigin(0, 0)
      .setData("type", "cat")
      .setInteractive();

    // TODO: provide cat size variables
    cat.setSize(goalShapeWidth, goalShapeHeight);
    cat.setDisplaySize(goalShapeWidth, goalShapeHeight);

    const tweenX = Phaser.Math.Between(x - goalShapeWidth * 2, x + goalShapeWidth * 2);
    const tweenY = Phaser.Math.Between(y - goalShapeHeight * 2, y + goalShapeHeight * 2);
    const xDuration = Phaser.Math.Between(2500, 3750);
    const yDuration = Phaser.Math.Between(2500, 3750);
    const delay = Phaser.Math.Between(0, 500);

    // Power1 Sine.easeInOut Linear Bounce.easeOut
    callingContext.tweens.add({
      targets: [cat],
      props: {
        x: { value: tweenX, duration: xDuration },
        y: { value: tweenY, duration: yDuration }
      },
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: delay
    })
  }
}

function setupMoveableShapes(callingContext) {
  var shapePlottingArea = new Phaser.Geom.Circle(window.innerWidth / 2, window.innerHeight / 2, min / 3);
  var shapeCount = Phaser.Math.Between(1, 3);

  for (let i = 0; i < shapeCount; i++) {
    var shape = randomShape();
    var tint = randomTint();
    var moveableShape = callingContext.moveableShapes
      .create(0, 0, shape)
      .setOrigin(0, 0)
      .setTintFill(tint)
      .setInteractive()
      .setData("shape", shape)
      .setData("tint", tint);

    callingContext.input.setDraggable(moveableShape);
    moveableShape.setDisplaySize(moveableShapeWidth, moveableShapeHeight);
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

function newRound(callingContext) {  
  callingContext.goalShapes.clear(true, true);
  callingContext.tweens.killAll();
  callingContext.moveableShapes.clear(true, true);

  round = Phaser.Math.Between(0, 1);
  if (round === 0) {
    configureGoalShapes(callingContext)
    setupMoveableShapes(callingContext);
  } else {
    setupCat(
      callingContext, 
      (goalShapeInnerWidthOffset / 2), 
      (goalShapeInnerHeightOffset / 2));
  }
}

function shapeOverlap(moveableShape, goalShape) {
  if (!shapesMatching(moveableShape, goalShape)) {    
    processInvalidShapeOverlap(this, moveableShape);
    return;
  }

  this.moveableShapes.remove(moveableShape, true, true);
  soundQueue.push([randomCartoonasc()]);
}

function processInvalidShapeOverlap(callingContext, moveableShape) {
  if (soundQueue.filter(s => s === thudSoundName).length === 0) {
    // soundQueue.push([thudSoundName]);
  }

  const defaultX = window.innerWidth / 2;
  const defaultY = window.innerHeight / 2;

  callingContext.tweens.add({
    targets: [moveableShape],
    props: {
      x: { value: defaultX, duration: 200 },
      y: { value: defaultY, duration: 200 }
    },
    ease: 'Sine.easeInOut',
    yoyo: false,
    repeat: 0,
  })
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
  if (round === 0 && this.moveableShapes.children.entries.length === 0) {
    soundQueue.push([celebrateSounds[0]]);
    newRound(this);
  }

  if (round === 1 && this.tapAndPopObjects.children.entries.length === 0) {
    soundQueue.push([celebrateSounds[1]]);
    newRound(this);
  }

  if (soundQueue.length > 0) {
    const sound = soundQueue.pop();
    this.sound.play(sound);
  }
}
