import { isMobile } from './mobile';
import { checkMonetization } from './monetization';
import { loadSongs, playSound, playSong } from './sound';
import { initSpeech } from './speech';
import { saveToStorage, loadFromStorage } from './storage';
import { ALIGN_CENTER, ALIGN_RIGHT, CHARSET_SIZE, initCharset, renderText } from './text';
import { lerp, lerpArray, smoothLerpArray } from './utils';


const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let konamiIndex = 0;

// GAMEPLAY VARIABLES

const TITLE_SCREEN = 0;
const GAME_SCREEN = 1;
const END_SCREEN = 2;
let screen = TITLE_SCREEN;

let countdown; // in seconds
let teapotsCollected;
let hero;
let entities; // current entities
let newEntities;  // new entities that will be added at the end of the frame
let win;      // did the game end in victory or defeat?
const DEFAULT_HIGHSCORE = 13;
const MAX_GAME_TIME = 404; // in sec
const SPAWN_FALLING_ROAD_DURATION = 0.083;  // in sec
const SPEED_REDUCTION_DURATION = 5; // in sec
// Highway 404 obstacle entities template, converted to entity instances on game start
let level = [
  { distance: 400, type: '501', lane: 1, length: 31 },
  { distance: 420, type: '501', lane: 2, length: 30 },
  { distance: 440, type: '501', lane: 4, length: 29 },
  { distance: 420, type: '501', lane: 5, length: 30 },
  { distance: 400, type: '501', lane: 6, length: 22 },
  { distance: 800, type: '501', lane: 3, length: 11 },
  { distance: 800, type: '501', lane: 4, length: 10 },
  { distance: 780, type: '302', lane: 3, redirect: 3 },

  { distance: 1360, type: '418', lane: 1 },
  { distance: 1400, type: '501', lane: 1, length: 20 },
  { distance: 1420, type: '501', lane: 2, length: 19 },
  { distance: 1440, type: '501', lane: 3, length: 18 },
  { distance: 1460, type: '501', lane: 4, length: 17 },
  { distance: 1440, type: '501', lane: 6, length: 18 },

  { distance: 2000, type: '404', lane: 1 },
  { distance: 2000, type: '404', lane: 2 },
  { distance: 2000, type: '404', lane: 3 },
  { distance: 2000, type: '404', lane: 4 },
  { distance: 2000, type: '404', lane: 5 },
  { distance: 2000, type: '404', lane: 6 },
  { distance: 3000, type: '200', lane: 1 },
  { distance: 3000, type: '200', lane: 2 },
  { distance: 3000, type: '200', lane: 3 },
  { distance: 3000, type: '200', lane: 4 },
  { distance: 3000, type: '200', lane: 5 },
  { distance: 3000, type: '200', lane: 6 },





  // { distance: 808, type: '404', lane: 1 },
  // { distance: 808, type: '404', lane: 2 },
  // { distance: 808, type: '404', lane: 3 },
  // { distance: 808, type: '501', lane: 4, length: 20 },
  // { distance: 808, type: '501', lane: 5, length: 19 },
  // { distance: 808, type: '501', lane: 6, length: 18 },
  // { distance: 1000, type: '418', lane: 2 },
  // { distance: 1700, type: '200', lane: 1 },
  // { distance: 1720, type: '200', lane: 2 },
  // { distance: 1740, type: '200', lane: 3 },
  // { distance: 1500, type: '418', lane: 6 },
  // { distance: 1580, type: '503', lane: 4, length: 20 },
  // { distance: 1560, type: '503', lane: 5, length: 19 },
  // { distance: 1540, type: '503', lane: 6, length: 18 },
  // { distance: 2000, type: '418', lane: 1 },
  // { distance: 2400, type: '100', lane: 1 },
  // { distance: 2400, type: '100', lane: 2 },
  // { distance: 2400, type: '100', lane: 3 },
  // { distance: 2400, type: '100', lane: 4 },
  // { distance: 2400, type: '100', lane: 5 },
  // { distance: 2400, type: '100', lane: 6 },
  // { distance: 2600, type: '503', lane: 1, length: 20 },
  // { distance: 2600, type: '503', lane: 2, length: 20 },
  // { distance: 2600, type: '503', lane: 4, length: 20 },
  // { distance: 2600, type: '503', lane: 5, length: 20 },
  // { distance: 2600, type: '503', lane: 6, length: 20 },
];


// Highway 404 background
const map = [
  // leftmost lane
  [0, 6, 6],
  [1, 5, 5, 5],
  [2, 5, 5, 5],
  [2, 5, 5, 5],
  [2, 5, 5, 5],
  [2, 5, 5, 5],
  [3, 5, 5, 5],
  // rightmost lane
  [7, 4, 7]
];


// SOUND VARIABLES

let HIGHWAY_404_SONG = [[[,0,77,,,.7,2,.41,,,,,,,,.06],[,0,43,.01,,.3,2,,,,,,,,,.02,.01],[,0,170,.003,,.008,,.97,-35,53,,,,,,.1],[.8,0,270,,,.12,3,1.65,-2,,,,,4.5,,.02],[,0,86,,,,,.7,,,,.5,,6.7,1,.05],[,0,41,,.05,.4,2,0,,,9,.01,,,,.08,.02],[,0,2200,,,.04,3,2,,,800,.02,,4.8,,.01,.1],[.3,0,16,,,.3,3]],[[[1,-1,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33],[3,1,22,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,24,,,,,,,,,,,,,,,,,,,,,,,,22,,22,,22,,,,],[5,-1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,],[,1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,]],[[1,-1,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33],[3,1,24,,,,,,,,27,,,,,,,,,,,,,,,,27,,,,24,,,,24,,,,,,,,27,,,,,,,,,,,,,,,,24,,24,,24,,,,],[5,-1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,],[,1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,],[6,1,,,34,34,34,,,,,,34,34,,,,,34,,,,34,34,,,,,34,,,,34,,,,34,34,34,,,,,,34,,,,,,34,34,,,34,34,,,,,,,,,34,34],[4,1,,,,,,,24,,,,,,24,,24,,,,24,,,,24,,,,,,,,,,,,,,,,24,,,,,,24,,24,,,,24,,,,24,,,,,,,,,,]],[[1,-1,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,23,23,35,23,23,36,23,23,35,23,23,36,23,23,35,35,23,23,35,23,23,35,23,23,36,23,23,35,23,23,36,36],[5,-1,21,,,19,,,21,,,,,,,,,,21,,,19,,,17,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[3,1,24,,,24,,,24,,,,,,,,,,24,,,24,,,24,,,,24.75,24.5,24.26,24.01,24.01,24.01,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,,,25,25,25,25],[4,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,24.75,24.5,24.26,24.01,24.01,24.01,24.01,24,,24,24,,24,24,24,24,,24,24,,24,,24,24,,24,24,,24,24,24,24,,24,24,,24,24],[7,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,23,,21,23,,35,,23,,21,23,,35,,35,,23,,21,23,,35,,21,23,,35,,21,23,,,],[6,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,34,36,34,,33,34,34,36,31,36,34,,31,34,32,,33,36,34,,31,34,34,36,33,36,33,,31,,,]],[[1,-1,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,21,21,33,21,21,33,21,21,33,21,21,33,21,21,33,33,17,17,29,17,17,29,17,17,29,17,17,29,17,17,29,29,17,17,29,17,17,29,17,17,29,17,17,29,17,17,29,29],[4,1,24,24,,24,24,,24,24,24,24,,24,24,,24,,24,24,,24,24,,24,24,24,24,,24,24,,24,24,24,24,,24,24,,24,24,24,,,24,24,,24,,24,24,,24,24,,24,24,24,24,,24,24,,24,24],[7,-1,21,,19,21,,33,,21,,19,21,,33,,33,,21,,19,21,,33,,21,,19,21,,33,,33,,17,,17,17,29,17,17,29,17,,17,17,29,17,17,29,17,,17,17,29,17,17,29,17,,17,17,29,17,17,29],[2,1,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,,,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,34,34,,34,,,],[6,1,,,36,,,,,,36,,36,,,,,,,,36,,,,,,36,,36,,,,,,,,36,,,,,,,,,,,,,,,,36,,,,,,36,,36,,,,,,],[3,1,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,,,25,25,25,25,,,,,25,,,,,25,,,25,,,,,,,,25,,,,,,,,25,25,25,25]],[[1,-1,14,14,26,14,14,26,14,14,26,14,14,26,14,14,26,26,14,14,26,14,14,26,14,14,26,14,14,26,14,14,26,26,17,17,29,17,17,29,17,17,29,17,17,29,17,17,29,29,19,19,31,19,19,31,19,19,31,19,19,31,19,19,31,31],[4,1,24,24,,24,24,,24,24,24,24,,24,24,,24,,24,24,,24,24,,24,24,24,24,,24,24,,24,24,24,24,,24,24,,24,24,24,24,,24,24,,36,,24,24,,24,24,,24,24,24,24,,24,24,,24,24],[7,-1,14,,14,14,26,14,14,26,14,,14,14,26,14,14,26,14,,14,14,26,14,14,26,14,,14,14,26,14,14,26,17,,17,17,29,17,17,29,17,,17,17,29,17,17,29,19,,19,19,31,19,19,31,19,,19,19,31,19,19,31],[2,1,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,,,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,36,36,,36,,,],[3,1,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,,,25,25,25,25,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,,,25,25,25,25],[6,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,34,,,,,,34,,34,,,,,,,,34,,,,,,34,,34,,,,,,]]],[0,1,1,2,3,4,4],,{"title":"Depp","instruments":["Instrument 0","Instrument 1","Instrument 2","Instrument 3","Instrument 4","Instrument 5","Instrument 6","Instrument 7"],"patterns":["Pattern 0","Pattern 1","Pattern 2","Pattern 3","Pattern 4"]}];
let speak;
let audioNode;

// RENDER VARIABLES

const CTX = c.getContext('2d');         // visible canvas
const MAP = c.cloneNode();              // full map rendered off screen
const MAP_CTX = MAP.getContext('2d');
MAP.width = 160;                        // map size
MAP.height = 400;
const VIEWPORT = c.cloneNode();           // visible portion of map/viewport
const VIEWPORT_CTX = VIEWPORT.getContext('2d');
VIEWPORT.width = 120;                      // viewport size
VIEWPORT.height = 160;

let controlKeys = 'wasd';

const TILE_SIZE = 20;

// camera-window & edge-snapping settings
const CAMERA_WINDOW_X = 50;
const CAMERA_WINDOW_Y = 50;
const CAMERA_WINDOW_WIDTH = VIEWPORT.width - CAMERA_WINDOW_X;
const CAMERA_WINDOW_HEIGHT = VIEWPORT.height - CAMERA_WINDOW_Y;
let viewportOffsetX = 0;
let viewportOffsetY = 0;

const ATLAS = {
  hero: {
    sprites: [
      { x: 0, y: 0, w: TILE_SIZE / 2, h: TILE_SIZE },
    ],
    // pixel per second
    speed: {
      x: 100,
      y: 50
    }
  },
  fallingRoad: {
    sprites: [
      { x: 2*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE },
      { x: 3*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE },
      { x: 4*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE },
      { x: 5*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE },
      { x: 6*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE },
      { x: 7*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE }
    ],
  },
  missingRoad: {
    sprites: [
      { x: 7*TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE }
    ]
  },
  highwayPanel: {
    sprites: [
      { x: 0, y: 2*TILE_SIZE, w: MAP.width, h: 2*TILE_SIZE }
    ]
  },
  highway: {
    // highway left shoulder and verge
    0: [
      { x: 0, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    6: [
      { x: TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    // highway left lane
    1: [
      { x: 2*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    // highway center lane
    2: [
      { x: 3*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    // highway right lane
    3: [
      { x: 4*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    // highway right shoulder and verge
    4: [
      { x: 5*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    7: [
      { x: 6*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    // highway blank lane
    5: [
      { x: 7*TILE_SIZE, y: TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
    ],
    speed: {
      // px per second
      y: 200
    },
  },
};
const FRAME_DURATION = 0.1; // duration of 1 animation frame, in seconds
const DYING_ROTATION_DELTA = Math.PI / 4; // in radian
const DYING_SCALE_DELTA = 0.1;            // [0...1]
const LANE_CHANGE_DURATION = 0.25;  // duration to change 1 lane, in sec
const TURNING_ROTATION_DELTA = DYING_ROTATION_DELTA/4; // in radian
let tileset = 'DATAURL:src/img/tileset.png';   // characters sprite, embedded as a base64 encoded dataurl by build script

// LOOP VARIABLES

let currentTime;
let elapsedTime;
let lastTime;
let requestId;
let running = true;

// GAMEPLAY HANDLERS

function unlockExtraContent() {
  // use a different car sprite
  ATLAS.hero.sprites[0].x += TILE_SIZE / 2;

  // add speed limit code to help with some levels
  level = level.concat([
    { distance: 1300, type: '429', lane: 2 },
  ]);
}

function setupTitleScreen() {
  entities = [
    hero = createEntity('hero', VIEWPORT.width / 2, MAP.height - 2.5*TILE_SIZE),
    createEntity('highwayPanel', 0, MAP.height - VIEWPORT.height + 0.75*TILE_SIZE),
  ];
  viewportOffsetX = 0;
  viewportOffsetY = MAP.height - VIEWPORT.height;
}

function startGame() {
  konamiIndex = 0;
  countdown = MAX_GAME_TIME;
  teapotsCollected = 0;
  distance = 0;
  win = false;

  loadLevel();

  screen = GAME_SCREEN;
  startMusic();
};

/**
 * Return true if collider's half-size & centered bounding box overlaps with the collidee's full bounding box
 * @param {*} collider 
 * @param {*} collidee 
 */
function testAABBCollision(collider, collidee) {
  return (
    collider.x + collider.w/4 < collidee.x + collidee.w
    && collider.x + collider.w*3/4 > collidee.x
    && collider.y + collider.h/4 < collidee.y + collidee.h
    && collider.y + collider.h*3/4 > collidee.y
  );
};

// entity1 collided into entity2
function correctAABBCollision(entity1, entity2, test) {
  const { entity1MaxX, entity1MaxY, entity2MaxX, entity2MaxY } = test;

  const deltaMaxX = entity1MaxX - entity2.x;
  const deltaMaxY = entity1MaxY - entity2.y;
  const deltaMinX = entity2MaxX - entity1.x;
  const deltaMinY = entity2MaxY - entity1.y;

  // AABB collision response (homegrown wall sliding, not physically correct
  // because just pushing along one axis by the distance overlapped)

  // entity1 moving down/right
  if (entity1.moveX > 0 && entity1.moveY > 0) {
    if (deltaMaxX < deltaMaxY) {
      // collided right side first
      entity1.x -= deltaMaxX;
    } else {
      // collided top side first
      entity1.y -= deltaMaxY;
    }
  }
  // entity1 moving up/right
  else if (entity1.moveX > 0 && entity1.moveY < 0) {
    if (deltaMaxX < deltaMinY) {
      // collided right side first
      entity1.x -= deltaMaxX;
    } else {
      // collided bottom side first
      entity1.y += deltaMinY;
    }
  }
  // entity1 moving right
  else if (entity1.moveX > 0) {
    entity1.x -= deltaMaxX;
  }
  // entity1 moving down/left
  else if (entity1.moveX < 0 && entity1.moveY > 0) {
    if (deltaMinX < deltaMaxY) {
      // collided left side first
      entity1.x += deltaMinX;
    } else {
      // collided top side first
      entity1.y -= deltaMaxY;
    }
  }
  // entity1 moving up/left
  else if (entity1.moveX < 0 && entity1.moveY < 0) {
    if (deltaMinX < deltaMinY) {
      // collided left side first
      entity1.x += deltaMinX;
    } else {
      // collided bottom side first
      entity1.y += deltaMinY;
    }
  }
  // entity1 moving left
  else if (entity1.moveX < 0) {
    entity1.x += deltaMinX;
  }
  // entity1 moving down
  else if (entity1.moveY > 0) {
    entity1.y -= deltaMaxY;
  }
  // entity1 moving up
  else if (entity1.moveY < 0) {
    entity1.y += deltaMinY;
  }
};

function updateViewportVerticalScrolling() {
  // move the highway down (aka move viewport and hero up by the same amount)
  let scrollSpeed;
  const highwaySpeed = ATLAS.highway.speed.y;
  if (hero.dying) {
    scrollSpeed = lerp(highwaySpeed, 0, (hero.dyingTime - countdown) / 1.5);
  } else {
    scrollSpeed = lerp(0, highwaySpeed, (MAX_GAME_TIME - countdown) / 1.5)
  }
  if (hero.speedTime) {
    scrollSpeed = smoothLerpArray([1, 0.25,0.25, 0.25, 0.25, 1].map(coef => highwaySpeed*coef), (hero.speedTime - countdown) / SPEED_REDUCTION_DURATION);
  }

  viewportOffsetY -= scrollSpeed*elapsedTime;
  hero.y -= scrollSpeed*elapsedTime;

  // loop highway (aka when viewport reach the top of the map, bring it &
  // all entities down at the bottom of the map)
  if (viewportOffsetY < 0) {
    viewportOffsetY += MAP.height - VIEWPORT.height;
    entities.forEach(entity => {
      entity.y += MAP.height - VIEWPORT.height
    });
  }
};

function constrainToViewport(entity) {
  // left highway shoulder
  if (entity.x < TILE_SIZE) {
    entity.x = TILE_SIZE;
  }
  // right highway shoulder
  else if (entity.x > MAP.width - TILE_SIZE - entity.w) {
    entity.x = MAP.width - TILE_SIZE - entity.w;
  }
  // top (almost)
  if (entity.y < viewportOffsetY + TILE_SIZE) {
    entity.y = viewportOffsetY + TILE_SIZE;
  }
  // bottom
  else if (entity.y > viewportOffsetY + VIEWPORT.height - entity.h) {
    entity.y = viewportOffsetY + VIEWPORT.height - entity.h;
  }
};


function updateCameraWindow() {
  // horizontal edge-snapping only
  if (0 < viewportOffsetX && hero.x < viewportOffsetX + CAMERA_WINDOW_X) {
    viewportOffsetX = Math.max(0, hero.x - CAMERA_WINDOW_X);
  }
  else if (viewportOffsetX < MAP.width - VIEWPORT.width && hero.x + hero.w > viewportOffsetX + CAMERA_WINDOW_WIDTH) {
    viewportOffsetX = Math.min(MAP.width - VIEWPORT.width, hero.x + hero.w - CAMERA_WINDOW_WIDTH);
  }
  // TODO build in some lerp-smoothing
};

function createEntity(type, x = 0, y = 0, loopAnimation = false) {
  // bitmap
  if (ATLAS[type]) {
    const sprite = ATLAS[type].sprites[0];
    return {
      frame: 0,
      frameTime: 0,
      h: sprite.h,
      loopAnimation,
      moveX: 0,
      moveY: 0,
      rotate: 0,      // start values for death animation
      scale: 1,       // start values for death animation
      speed: ATLAS[type].speed,
      sprites: ATLAS[type].sprites,
      type,
      w: sprite.w,
      x,
      y,
    };
  }
  // text
  else {
    return {
      h: TILE_SIZE,
      type,
      w: TILE_SIZE,
      x,
      y
    }
  }
};

function createFallingRoad(parent) {
  const entity = createEntity('fallingRoad', parent.x, parent.y - parent.h);
  entity.spawn = createFallingRoad;
  entity.spawnTime = countdown;
  return entity;
}

function addMoreFallingRoads() {
  const twoHundreds = entities.filter(entity => entity.type === '200');

  entities.forEach(entity => {
    if (entity.spawn && entity.spawnTime - countdown > SPAWN_FALLING_ROAD_DURATION) {
      const newEntity = entity.spawn(entity)
      newEntities.push(newEntity);
      entity.spawn = null;
      // check if the new falling road has reached a 200
      twoHundreds.forEach(twoHundred => {
        if (testAABBCollision(newEntity, twoHundred)) {
          // this new falling road will not spawn other and be the last of this lane
          newEntity.spawn = null;
        }
      });
    }
  });
}

function loadLevel() {
  newEntities = [];
  level.forEach(entity => {
    newEntities.push(createEntity(entity.type, entity.lane*TILE_SIZE, -entity.distance + viewportOffsetY));

    switch (entity.type) {
      case '301':
      case '302':
        newEntities[newEntities.length - 1].redirect = entity.redirect;
        break;
      case '501':
      case '503':
        for (let i = 1; i <= entity.length || 0; i++) {
          newEntities.push(createEntity('missingRoad', entity.lane*TILE_SIZE, -entity.distance -TILE_SIZE*(i+1) + viewportOffsetY));
        }
        break;
    }
  });
  entities = newEntities.concat(entities);
};

function updateEntityPosition(entity) {
  // update animation frame
  entity.frameTime += elapsedTime;
  if (entity.frameTime > FRAME_DURATION) {
    entity.frameTime -= FRAME_DURATION;
    if (entity.frame < entity.sprites.length - 1 || entity.loopAnimation) {
      entity.frame += 1;
    }
    if (entity.loopAnimation) {
      entity.frame %= entity.sprites.length;
    }
    // update death animation
    if (entity.dying) {
      entity.rotate += DYING_ROTATION_DELTA;
      entity.scale -= DYING_SCALE_DELTA;
      if (entity.scale < 0) {
        entity.scale = 0;
        entity.dying = false;
        entity.dead = true;
      }
    }
  }
  if (hero.speedTime && (hero.speedTime - countdown) > SPEED_REDUCTION_DURATION) {
    hero.speedTime = 0;
  }
  // update position
  if (entity.translateTo) {
    const t = (entity.translateTime - countdown) / entity.translateDuration;
    entity.x = lerp(entity.translateFrom, entity.translateTo, t);
    entity.scale = smoothLerpArray([1, 1.2, 1.6, 1.75, 1.6, 1.25, 1], t);
    if (t > 1) {
      entity.translateTo = entity.translateFrom = entity.translateTime = entity.translateDuration = undefined;
    }
  }
  else if (entity.speed && !entity.dying) {
    const scale = entity.moveX && entity.moveY ? Math.cos(Math.PI / 4) : 1;
    entity.x += entity.speed.x * elapsedTime * entity.moveX * scale;
    entity.y += entity.speed.y * elapsedTime * entity.moveY * scale;
  }
};

function calculateScore() {
  return 10*Math.floor(MAX_GAME_TIME - countdown) + 418*teapotsCollected;
};

function saveHighscore() {
  const oldHighscore = loadFromStorage('highscore') || DEFAULT_HIGHSCORE;   // default if never saved before
  const newHighscore = Math.max(oldHighscore, calculateScore());
  saveToStorage('highscore', newHighscore);
  saveToStorage('OS13kTrophy,🏅,Highway 404,Highscore', newHighscore, '');
};

function update() {
  switch (screen) {
    case GAME_SCREEN:
      countdown -= elapsedTime;
      if (countdown < 0) {
        win = true;
        saveHighscore();
        stopMusic();
        screen = END_SCREEN;
      }
      if (hero.dead) {
        win = false;
        saveHighscore();
        stopMusic();
        screen = END_SCREEN;
      }
      entities.forEach(updateEntityPosition);
      updateViewportVerticalScrolling();
      constrainToViewport(hero);
      updateCameraWindow();
      
      // load new entities
      newEntities = [];
      const msgs = new Set();
      addMoreFallingRoads();

      let scaleChanged = false;
      // check if hero collided with any of the special status code triggers
      // unless hero is being redirected to another lane
      if (!hero.translateTo) {
        entities.forEach(entity => {
          if (entity !== hero && !entity.triggered) {
            if (testAABBCollision(hero, entity)) {
              entity.triggered = true;
              switch(entity.type) {
                case '100':
                  // enqueue a verbal message
                  msgs.add('continue');
                  break;
                case '200':
                  // enqueue a verbal message
                  msgs.add('road OK');
                  break;
                case '301':
                case '302':
                  // enqueue a verbal message
                  msgs.add(entity.type === '301' ? 'lane moved' : 'temporary lane redirect');
                  hero.translateFrom = hero.x;
                  hero.translateTo = hero.x + entity.redirect * TILE_SIZE;
                  hero.translateTime = countdown;
                  hero.translateDuration = Math.abs(LANE_CHANGE_DURATION * entity.redirect);
                  break;
                case '404':
                  newEntities.push(createFallingRoad({ x: entity.x, y: entity.y + TILE_SIZE, h: entity.h }))
                  // enqueue a verbal message
                  msgs.add('road not found');
                  break;
                case '418':
                  teapotsCollected++;
                  // enqueue a verbal message
                  msgs.add('I am a teapot');
                  break;
                case '429':
                  // enqueue a verbal message
                  msgs.add('speed reduction');
                  hero.speedTime = countdown;
                  break;
                case '501':
                  // enqueue a verbal message
                  msgs.add('road not implemented');
                  break;
                case '503':
                  // enqueue a verbal message
                  msgs.add('road unavailable');
                  break;
                case 'fallingRoad':
                  entity.triggered = false;
                  if (!(hero.dying || hero.dead)) {
                    // scale down the car as it's falling further down
                    hero.scale = 1 - DYING_SCALE_DELTA*(entity.frame + 1);
                    scaleChanged = true;
                  }
                  if (entity.frame > entity.sprites.length / 2) {
                    entity.triggered = true;
                    // TODO duplicate with missingRoad
                    if (!hero.dying) {
                      hero.dying = true;
                      hero.dyingTime = countdown;
                    }
                  }
                  break;
                case 'missingRoad':
                  // TODO duplicate with fallingRoad
                  if (!hero.dying) {
                    hero.dying = true;
                    hero.dyingTime = countdown;
                  }
                  break;
              }
            }
          }
        });
        if (!(scaleChanged || hero.dying || hero.dead)) {
          hero.scale = 1
        }
      }
      entities = newEntities.concat(entities);
      // play all unique enqueued verbal messages
      msgs.forEach(msg => speak(msg));
      // remove entities who have fallen past the bottom of the scren, plus 1 tile (for safety)
      entities = entities.filter(entity => entity.y < viewportOffsetY + VIEWPORT.height + TILE_SIZE);
      break;
  }
};

// SOUND HANDLERS

function startMusic() {
  stopMusic();
  if (screen === GAME_SCREEN) {
    audioNode = playSong(HIGHWAY_404_SONG);
    audioNode.loop = true;
  }
}

function stopMusic() {
  if (audioNode) {
    audioNode.stop();
  }
}

// RENDER HANDLERS

function blit() {
  // copy backbuffer onto visible canvas, scaling it to screen dimensions
  CTX.drawImage(
    VIEWPORT,
    0, 0, VIEWPORT.width, VIEWPORT.height,
    0, 0, c.width, c.height
  );
};

function render() {
  renderMap();
  entities.forEach(renderEntity);
  switch (screen) {
    case TITLE_SCREEN:
      renderText('js13kgames 2020', VIEWPORT_CTX, VIEWPORT.width/2, CHARSET_SIZE, ALIGN_CENTER);
      renderText('collect teapots', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height/2 - 2*CHARSET_SIZE, ALIGN_CENTER);
      renderText('for extra points', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height/2 - 0.4*CHARSET_SIZE, ALIGN_CENTER);
      renderText(isMobile ? 'swipe to steer' : `${controlKeys}/ULDR to steer`, VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height/2 + 0.75*TILE_SIZE, ALIGN_CENTER);
      renderText('jerome lecomte', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height - 2*CHARSET_SIZE, ALIGN_CENTER);
      break;
    case GAME_SCREEN:
      renderText('score', VIEWPORT_CTX, CHARSET_SIZE, CHARSET_SIZE);
      renderText(`${calculateScore()}`, VIEWPORT_CTX, VIEWPORT.width - CHARSET_SIZE, CHARSET_SIZE, ALIGN_RIGHT);
      renderCountdown();
      renderText(`teapot ${teapotsCollected}`, VIEWPORT_CTX, VIEWPORT.width - CHARSET_SIZE, VIEWPORT.height - 2*CHARSET_SIZE, ALIGN_RIGHT);
      if (hero.speedTime) {
        renderText(`${SPEED_REDUCTION_DURATION - Math.floor(hero.speedTime - countdown)} sec`, VIEWPORT_CTX, VIEWPORT.width / 2, VIEWPORT.height / 2, ALIGN_CENTER);
      }
      // uncomment to debug mobile input handlers
      // renderDebugTouch();
      break;
    case END_SCREEN:
      renderText('score', VIEWPORT_CTX, CHARSET_SIZE, 3*CHARSET_SIZE);
      renderText(`${calculateScore()}`, VIEWPORT_CTX, VIEWPORT.width - CHARSET_SIZE, 3*CHARSET_SIZE, ALIGN_RIGHT);
      renderText('highscore', VIEWPORT_CTX, CHARSET_SIZE, CHARSET_SIZE);
      renderText(loadFromStorage('highscore'), VIEWPORT_CTX, VIEWPORT.width - CHARSET_SIZE, CHARSET_SIZE, ALIGN_RIGHT)
      renderText(win ? 'you arrived!' : 'you got lost!', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height/2 - 0.6*CHARSET_SIZE, ALIGN_CENTER);
      if (!isMobile) {
        renderText('[t]weet your score', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height - 4*CHARSET_SIZE, ALIGN_CENTER);
      }
      renderText(isMobile ? 'tap to restart' : '[space] to restart', VIEWPORT_CTX, VIEWPORT.width/2, VIEWPORT.height - 2*CHARSET_SIZE, ALIGN_CENTER);
      break;
  }

  blit();
};

function renderCountdown() {
  const minutes = Math.floor(Math.ceil(countdown) / 60);
  const seconds = Math.ceil(countdown) - minutes * 60;
  renderText(`time ${minutes}:${seconds <= 9 ? '0' : ''}${seconds}`, VIEWPORT_CTX, CHARSET_SIZE, VIEWPORT.height - 2*CHARSET_SIZE);
};

function renderEntity(entity) {
  if (entity.y < viewportOffsetY - 2*TILE_SIZE) {
    // skip any entity that is above the viewport by 2 tiles (1 extra tile for safety)
    return;
  }
  // bitmap
  if (entity.sprites) {
    const sprite = entity.sprites[entity.frame];
    VIEWPORT_CTX.save();
    VIEWPORT_CTX.translate(Math.round(entity.x - viewportOffsetX), Math.round(entity.y - viewportOffsetY));
    let x = 0;
    let y = 0;
    if (entity.dying) {
      VIEWPORT_CTX.translate(Math.round(entity.w/2), Math.round(entity.h/2))
      VIEWPORT_CTX.rotate(entity.rotate);
      x = -entity.w/2*entity.scale;
      y = -entity.h/2*entity.scale;
    }
    else if (entity.translateTo || entity.moveX ) {
      const direction = entity.translateTo ? (entity.translateTo - entity.translateFrom > 0 ? 1 : -1) : entity.moveX;
      VIEWPORT_CTX.translate(Math.round(entity.w/2), Math.round(entity.h/2))
      VIEWPORT_CTX.rotate(direction*TURNING_ROTATION_DELTA);
      x = -entity.w/2*entity.scale;
      y = -entity.h/2*entity.scale;
    }
    VIEWPORT_CTX.drawImage(
      tileset,
      sprite.x, sprite.y, sprite.w, sprite.h,
      x, y, sprite.w*entity.scale, sprite.h*entity.scale
    );
    VIEWPORT_CTX.restore();
  }
  // text
  else {
    renderText(entity.type, VIEWPORT_CTX, Math.round(entity.x + TILE_SIZE/2 - viewportOffsetX), Math.round(entity.y + entity.h/2 - CHARSET_SIZE/2 - viewportOffsetY), ALIGN_CENTER);
  }
  // uncomment to debug entity position, size & collision box
  // VIEWPORT_CTX.strokeStyle = 'purple';
  // VIEWPORT_CTX.strokeRect(Math.round(entity.x - viewportOffsetX), Math.round(entity.y - viewportOffsetY), entity.w, entity.h);
  // VIEWPORT_CTX.strokeRect(Math.round(entity.x + entity.w/4 - viewportOffsetX), Math.round(entity.y + entity.h/4 - viewportOffsetY), entity.w/2, entity.h/2);
};


function cacheMap() {
  map.forEach((lane, i) => {
    let y = MAP.height;
    while (y > 0) {
      lane.forEach(n => {
        const sprite = ATLAS.highway[n][0];
        const x = i*sprite.w;
        y -= sprite.h;
        MAP_CTX.drawImage(
          tileset,
          sprite.x, sprite.y, sprite.w, sprite.h,
          x, y, sprite.w, sprite.h
        );
      })
    }
  })
};

function renderMap() {
  VIEWPORT_CTX.drawImage(
    MAP,
    // adjust x/y offset
    viewportOffsetX, viewportOffsetY, VIEWPORT.width, VIEWPORT.height,
    0, 0, VIEWPORT.width, VIEWPORT.height
  );
}

// LOOP HANDLERS

function loop() {
  if (running) {
    requestId = requestAnimationFrame(loop);
    render();
    currentTime = Date.now();
    elapsedTime = (currentTime - lastTime) / 1000;
    update();
    lastTime = currentTime;
  }
};

function toggleLoop(value) {
  running = value;
  if (running) {
    lastTime = Date.now();
    loop();
  } else {
    cancelAnimationFrame(requestId);
  }
};

// EVENT HANDLERS

onload = async (e) => {
  // the real "main" of the game
  document.title = 'Highway 404';

  onresize();

  // load graphic assets (quick)
  await initCharset(loadImg);
  tileset = await loadImg(tileset);

  // user feedback before slow operationsz
  renderText('loading...', VIEWPORT_CTX, VIEWPORT.width / 2, VIEWPORT.height / 2, ALIGN_CENTER);
  blit();

  // load sound assets (long)
  speak = await initSpeech();
  [HIGHWAY_404_SONG] = loadSongs([HIGHWAY_404_SONG]);

  // load title screen
  setupTitleScreen();
  cacheMap();

  checkMonetization(unlockExtraContent);

  if (/^fr/i.test(navigator.language)) {
    controlKeys = 'zqsd';
  }

  toggleLoop(true);
};

onresize = onrotate = function() {
  // scale canvas to fit screen while maintaining aspect ratio
  const scaleToFit = Math.min(innerWidth / VIEWPORT.width, innerHeight / VIEWPORT.height);
  c.width = VIEWPORT.width * scaleToFit;
  c.height = VIEWPORT.height * scaleToFit;
  // disable smoothing on image scaling
  CTX.imageSmoothingEnabled = MAP_CTX.imageSmoothingEnabled = VIEWPORT_CTX.imageSmoothingEnabled = false;
};

// UTILS

document.onvisibilitychange = function(e) {
  // pause loop and game timer when switching tabs
  toggleLoop(!e.target.hidden);
  // pause/resume sound
  if (running) {
    startMusic();
  } else {
    stopMusic();
  }
};

function loadImg(dataUri) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      resolve(img);
    };
    img.src = dataUri;
  });
};

// INPUT HANDLERS

onkeydown = function(e) {
  // prevent itch.io from scrolling the page up/down
  e.preventDefault();

  if (!e.repeat) {
    switch (screen) {
      case GAME_SCREEN:
        switch (e.code) {
          case 'ArrowLeft':
          case 'KeyA':
          case 'KeyQ':  // French keyboard support
            hero.moveX = -1;
            break;
          case 'ArrowUp':
          case 'KeyW':
          case 'KeyZ':  // French keyboard support
            hero.moveY = -1;
            break;
          case 'ArrowRight':
          case 'KeyD':
            hero.moveX = 1;
            break;
          case 'ArrowDown':
          case 'KeyS':
            hero.moveY = 1;
            break;
          case 'KeyP':
            // Pause game as soon as key is pressed
            toggleLoop(!running);
            break;
        }
        break;
    }
  }
};

onkeyup = function(e) {
  switch (screen) {
    case TITLE_SCREEN:
      if (e.which !== konamiCode[konamiIndex] || konamiIndex === konamiCode.length) {
        startGame();
      } else {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          // konami code completed, unlock Coil subscribers content
          unlockExtraContent();
        }
      }
      break;
    case GAME_SCREEN:
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
        case 'KeyQ': // French keyboard support
        case 'ArrowRight':
        case 'KeyD':
          hero.moveX = 0;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyZ': // French keyboard support
        case 'ArrowDown':
        case 'KeyS':
          hero.moveY = 0;
          break;
        }
      break;
    case END_SCREEN:
      switch (e.code) {
        case 'KeyT':
          open(`https://twitter.com/intent/tweet?text=I%20survived%20${Math.floor(MAX_GAME_TIME - countdown)}%20seconds${teapotsCollected > 0 ? ' and collected ' + teapotsCollected + ' teapot' + (teapotsCollected > 1 ? 's' : '') : ''}%20in%20Highway%20404%20by%20%40herebefrogs%20for%20%23js13k%202020%0Ahttps%3A%2F%2Fbit.ly%2Fhgw-404`, '_blank');
          break;
        default:
          // reset some values for the title screen
          setupTitleScreen();
          screen = TITLE_SCREEN;
          break;
      }
      break;
  }
};

// MOBILE INPUT HANDLERS

let minX = 0;
let minY = 0;
let maxX = 0;
let maxY = 0;
let MIN_DISTANCE = 30; // in px
let touches = [];

// adding onmousedown/move/up triggers a MouseEvent and a PointerEvent
// on platform that support both (duplicate event, pointer > mouse || touch)
ontouchstart = onpointerdown = function(e) {
  e.preventDefault();
  switch (screen) {
    case GAME_SCREEN:
      [maxX, maxY] = [minX, minY] = pointerLocation(e);
      break;
  }
};

ontouchmove = onpointermove = function(e) {
  e.preventDefault();
  switch (screen) {
    case GAME_SCREEN:
      if (minX && minY) {
        setTouchPosition(pointerLocation(e));
      }
      break;
  }
}

ontouchend = onpointerup = function(e) {
  e.preventDefault();
  switch (screen) {
    case TITLE_SCREEN:
      startGame();
      break;
    case GAME_SCREEN:
      // stop hero
      hero.moveX = hero.moveY = 0;
      // end touch
      minX = minY = maxX = maxY = 0;
      break;
    case END_SCREEN:
      // reset some values for the title screen
      setupTitleScreen();
      screen = TITLE_SCREEN;
      break;
  }
};

// utilities
function pointerLocation(e) {
  return [e.pageX || e.changedTouches[0].pageX, e.pageY || e.changedTouches[0].pageY];
};

function setTouchPosition([x, y]) {
  // touch moving further right
  if (x > maxX) {
    maxX = x;
    hero.moveX = lerp(0, 1, (maxX - minX) / MIN_DISTANCE)
  }
  // touch moving further left
  else if (x < minX) {
    minX = x;
    hero.moveX = -lerp(0, 1, (maxX - minX) / MIN_DISTANCE)
  }
  // touch reversing left while hero moving right
  else if (x < maxX && hero.moveX > 0) {
    minX = x;
    hero.moveX = 0;
  }
  // touch reversing right while hero moving left
  else if (minX < x && hero.moveX < 0) {
    maxX = x;
    hero.moveX = 0;
  }

  // touch moving further down
  if (y > maxY) {
    maxY = y;
    hero.moveY = lerp(0, 1, (maxY - minY) / MIN_DISTANCE)

  }
  // touch moving further up
  else if (y < minY) {
    minY = y;
    hero.moveY = -lerp(0, 1, (maxY - minY) / MIN_DISTANCE)

  }
  // touch reversing up while hero moving down
  else if (y < maxY && hero.moveY > 0) {
    minY = y;
    hero.moveY = 0;
  }
  // touch reversing down while hero moving up
  else if (minY < y && hero.moveY < 0) {
    maxY = y;
    hero.moveY = 0;
  }

  // uncomment to debug mobile input handlers
  // addDebugTouch(x, y);
};

function addDebugTouch(x, y) {
  touches.push([x / innerWidth * VIEWPORT.width, y / innerHeight * VIEWPORT.height]);
  if (touches.length > 10) {
    touches = touches.slice(touches.length - 10);
  }
};

function renderDebugTouch() {
  let x = maxX / innerWidth * VIEWPORT.width;
  let y = maxY / innerHeight * VIEWPORT.height;
  renderDebugTouchBound(x, x, 0, VIEWPORT.height, '#f00');
  renderDebugTouchBound(0, VIEWPORT.width, y, y, '#f00');
  x = minX / innerWidth * VIEWPORT.width;
  y = minY / innerHeight * VIEWPORT.height;
  renderDebugTouchBound(x, x, 0, VIEWPORT.height, '#ff0');
  renderDebugTouchBound(0, VIEWPORT.width, y, y, '#ff0');

  if (touches.length) {
    VIEWPORT_CTX.strokeStyle = VIEWPORT_CTX.fillStyle =   '#02d';
    VIEWPORT_CTX.beginPath();
    [x, y] = touches[0];
    VIEWPORT_CTX.moveTo(x, y);
    touches.forEach(function([x, y]) {
      VIEWPORT_CTX.lineTo(x, y);
    });
    VIEWPORT_CTX.stroke();
    VIEWPORT_CTX.closePath();
    VIEWPORT_CTX.beginPath();
    [x, y] = touches[touches.length - 1];
    VIEWPORT_CTX.arc(x, y, 2, 0, 2 * Math.PI)
    VIEWPORT_CTX.fill();
    VIEWPORT_CTX.closePath();
  }
};

function renderDebugTouchBound(_minX, _maxX, _minY, _maxY, color) {
  VIEWPORT_CTX.strokeStyle = color;
  VIEWPORT_CTX.beginPath();
  VIEWPORT_CTX.moveTo(_minX, _minY);
  VIEWPORT_CTX.lineTo(_maxX, _maxY);
  VIEWPORT_CTX.stroke();
  VIEWPORT_CTX.closePath();
};
