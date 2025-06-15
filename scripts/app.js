const canvas = document.getElementById("signature");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;

let penColor = "#000000";
let penThickness = 2;

// ریسپانسیو کردن بوم
function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penThickness;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// شروع نقاشی
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
});

// ادامه نقاشی (در کل صفحه، حتی خارج از بوم)
document.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
});

document.addEventListener("mouseup", () => {
    drawing = false;
});

// موبایل
canvas.addEventListener("touchstart", (e) => {
    drawing = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
});

canvas.addEventListener("touchmove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
}, { passive: false });

canvas.addEventListener("touchend", () => {
    drawing = false;
});

// ابزارها
document.getElementById("colorPicker").addEventListener("change", (e) => {
    penColor = e.target.value;
    ctx.strokeStyle = penColor;
});

document.getElementById("thickness").addEventListener("input", (e) => {
    penThickness = e.target.value;
    ctx.lineWidth = penThickness;
});

document.getElementById("clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("download").addEventListener("click", () => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // پس‌زمینه سفید
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // کپی امضا
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = "signature.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
});
