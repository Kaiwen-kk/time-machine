let bubbles = [];
let startTime;
let CENTER;
let bgm;
let bgmStarted = false;
let started = false;
let popSound;

function preload() {
  // 加载 60 秒背景音乐（请确保音乐文件在同目录下）
  bgm = loadSound('bubble.mp3'); // ← 改为你的文件名
  popSound = loadSound('pop.mp3'); // 鼠标点击泡泡音效
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  CENTER = createVector(width / 2, height / 2);
  noStroke();
  startTime = millis();

  // 开始播放背景音乐，循环模式
  bgm.setVolume(0.4); // 可调音量
  // bgm.loop(); // Removed auto-play

  // 初始：铺满全屏气泡
  for (let i = 0; i < 800; i++) {
    let x = random(width);
    let y = random(height);
    bubbles.push(new Bubble(x, y));
  }
}

function draw() {
  background(0);

  if (!started) {
    drawIntroText();
  } else {
    drawColaBackgroundWave();

    let currentTime = millis();
    let phase = (currentTime - startTime) % 60000;

    let bubbleRate = getBubbleRate(phase);
    let [minR, maxR] = getSpawnRadiusRange(phase);

    for (let i = 0; i < bubbleRate; i++) {
      let angle = random(TWO_PI);
      let radius = random(minR, maxR);
      let x = CENTER.x + cos(angle) * radius;
      let y = CENTER.y + sin(angle) * radius;
      bubbles.push(new Bubble(x, y));
    }

    // 在 40~55s 之间额外偶发小泡泡
    if (phase >= 40000 && phase <= 55000) {
      if (random() < 0.05) { // 概率控制每帧大约5%概率冒泡
        let angle = random(TWO_PI);
        let radius = random(100, 300);
        let x = CENTER.x + cos(angle) * radius;
        let y = CENTER.y + sin(angle) * radius;
        bubbles.push(new Bubble(x, y));
      }
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      let b = bubbles[i];
      b.update();
      b.display();
      if (b.isDead()) {
        bubbles.splice(i, 1);
      }
    }

    drawMouseFollower();
    drawTimer();
  }
}

// 🎯 1分钟气泡流程，新密集期为前3秒
function getBubbleRate(phase) {
  if (phase < 1000) {
    return 1000; // 第一秒更密集
  } else if (phase < 3000) {
    return int(map(phase, 1000, 3000, 30, 10)); // 继续密集但递减
  } else if (phase < 15000) {
    return int(map(phase, 3000, 15000, 10, 2));
  } else if (phase < 60000) {
    return int(map(phase, 15000, 60000, 2, 0));
  } else {
    return 0;
  }
}

function getSpawnRadiusRange(phase) {
  const max = dist(0, 0, width / 2, height / 2);
  if (phase < 3000) {
    return [0, max];
  } else if (phase < 15000) {
    let inner = map(phase, 3000, 15000, 0, max * 0.6);
    return [inner, max];
  } else {
    let inner = max * 0.6;
    let outer = map(phase, 15000, 60000, max, max * 1.2);
    return [inner, outer];
  }
}

class Bubble {
  constructor(x, y) {
    this.x = x + random(-2, 2);
    this.y = y + random(-2, 2);
    this.baseR = random(4, 12);
    this.r = this.baseR;
    this.birth = millis();
    this.lifetime = random(3000, 7000); // 更快生命周期
    this.opacity = 255;
    this.jitterPhase = random(TWO_PI);
  }

  update() {
    let age = millis() - this.birth;
    let progress = age / this.lifetime;
    this.r = this.baseR * (1 - progress * 0.5);
    this.opacity = map(progress, 0, 1, 255, 0);
    let jitter = sin(this.jitterPhase + millis() * 0.01) * 0.5;
    this.x += jitter * 0.2;
    this.y += jitter * 0.2;
  }

  display() {
    push();
    blendMode(ADD);
    noFill();
    stroke(255, this.opacity);
    strokeWeight(1.5);
    ellipse(this.x, this.y, this.r);
    noStroke();
    fill(255, this.opacity * 0.07);
    ellipse(this.x, this.y, this.r * 0.8);
    pop();
  }

  isDead() {
    return millis() - this.birth > this.lifetime;
  }
}

// 黑色波动背景
function drawColaBackgroundWave() {
  let time = millis() * 0.001;
  let centerX = width / 2;
  let centerY = height / 2;
  let maxRadius = dist(0, 0, width / 2, height / 2);
  for (let r = 0; r < maxRadius; r += 10) {
    let wave = sin(time * 2 + r * 0.05);
    let brightness = map(wave, -1, 1, 10, 80);
    let blackWaveColor = color(0, 0, 0, brightness);
    fill(blackWaveColor);
    ellipse(centerX, centerY, r * 2);
  }
}

// ✨ 鼠标跟随的柔和气泡效果
function drawMouseFollower() {
  push();
  noFill();
  stroke(255, 150); // brighter white stroke
  strokeWeight(1.5);
  ellipse(mouseX, mouseY, 20); // smaller subtle bubble

  noStroke();
  fill(255, 20); // transparent white fill
  ellipse(mouseX, mouseY, 12); // inner faint circle
  pop();
}

function mousePressed() {
  if (!started) {
    started = true;
    startTime = millis();
    if (!bgmStarted && bgm.isLoaded()) {
      bgm.loop();
      bgm.setVolume(0.4);
      bgmStarted = true;
    }
  }

  if (started) {
    if (popSound.isLoaded()) {
      popSound.play();
    }
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      let radius = random(5, 50);
      let x = mouseX + cos(angle) * radius;
      let y = mouseY + sin(angle) * radius;
      bubbles.push(new Bubble(x, y));
    }
  }
}

function drawTimer() {
  let elapsed = floor((millis() - startTime) / 1000);
  let minutes = floor(elapsed / 60);
  let seconds = nf(elapsed % 60, 2);

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(20);
  text(` ${minutes}:${seconds}`, width - 750, height - 450);
}

function drawIntroText() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  // text("CLICK", width / 2, height / 2);
}
