* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #090d12;
  color: #edf4ff;
  font-family: Inter, Arial, sans-serif;
}

canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}

#hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.hud-panel {
  position: absolute;
  padding: 12px 16px;
  color: #edf5ff;
  background: rgba(8, 14, 18, 0.32);
  border: 1px solid rgba(180, 205, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  font-size: 12px;
}

.hud-panel-top-left {
  top: 18px;
  left: 18px;
}

.hud-panel-top-right {
  top: 18px;
  right: 18px;
}

.hud-panel-bottom-left {
  bottom: 18px;
  left: 18px;
}

.hud-panel-bottom-right {
  bottom: 18px;
  right: 18px;
  min-width: 170px;
}

.hud-label {
  display: block;
  white-space: pre-line;
  font-weight: 700;
  line-height: 1.3;
}

.crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  transform: translate(-50%, -50%);
  opacity: 0.9;
}

.crosshair span {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
}

.crosshair span:first-child {
  left: 50%;
  top: 0;
  width: 2px;
  height: 18px;
  transform: translateX(-50%);
}

.crosshair span:last-child {
  left: 0;
  top: 50%;
  width: 18px;
  height: 2px;
  transform: translateY(-50%);
}

.status-banner {
  position: absolute;
  left: 50%;
  bottom: 90px;
  transform: translateX(-50%);
  min-width: 220px;
  text-align: center;
  color: #dfefff;
  font-size: 11px;
  letter-spacing: 0.16rem;
  text-transform: uppercase;
}
