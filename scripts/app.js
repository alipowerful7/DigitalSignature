const canvas = document.getElementById("signature");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;
let penColor = "#000000";
let penThickness = 2;

let svgPaths = [];
let currentPath = "";

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penThickness;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function startDraw(x, y) {
    drawing = true;
    lastX = x;
    lastY = y;
    currentPath = `M ${x} ${y}`;
}

function draw(x, y) {
    if (!drawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
    currentPath += ` L ${x} ${y}`;
}

function endDraw() {
    if (currentPath) {
        svgPaths.push({
            d: currentPath,
            color: penColor,
            width: penThickness,
        });
    }
    drawing = false;
    currentPath = "";
}

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    startDraw(e.clientX - rect.left, e.clientY - rect.top);
});
document.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
});
document.addEventListener("mouseup", endDraw);

canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDraw(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener("touchmove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: false });
canvas.addEventListener("touchend", endDraw);

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
    svgPaths = [];
});

document.getElementById("download").addEventListener("click", () => {
    const format = document.getElementById("format").value;

    if (format === "svg") {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${svgPaths.map(path =>
            `<path d="${path.d}" stroke="${path.color}" stroke-width="${path.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        ).join("\n")}
</svg>`;

        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "signature.svg";
        link.click();
        URL.revokeObjectURL(url);
    } else {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        tempCtx.fillStyle = "#ffffff";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const link = document.createElement("a");
        link.download = `signature.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`);
        link.click();
    }
});
