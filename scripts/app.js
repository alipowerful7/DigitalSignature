const canvas = document.getElementById("signature");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;
let penColor = "#000000";
let penThickness = 4;

let svgPaths = [];
let currentPath = "";

// تصویر پس‌زمینه بارگذاری شده
let bgImage = null;

// عناصر جدید برای تاریخ و زمان
const showDateTimeCheckbox = document.getElementById("showDateTime");
const positionLabel = document.getElementById("positionLabel");
const dateTimePositionSelect = document.getElementById("dateTimePosition");
const dateColorLabel = document.getElementById("dateColorLabel");
const dateColorPicker = document.getElementById("dateColorPicker");

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

    redrawAll();
}

function redrawAll() {
    // ابتدا پس‌زمینه سفید یا تصویر را رسم می‌کنیم
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // سپس خطوط امضا را دوباره می‌کشیم
    svgPaths.forEach(path => {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.beginPath();
        const commands = path.d.match(/[ML][^ML]*/g);
        commands.forEach(command => {
            const type = command[0];
            const coords = command.slice(2).split(" ").map(Number);
            if (type === "M") {
                ctx.moveTo(coords[0], coords[1]);
            } else if (type === "L") {
                ctx.lineTo(coords[0], coords[1]);
            }
        });
        ctx.stroke();
    });
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
    svgPaths = [];
    bgImage = null;
    drawing = false;
    currentPath = "";
    document.getElementById("bgUpload").value = "";
    redrawAll();
});

document.getElementById("bgUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            bgImage = img;
            redrawAll();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// کنترل نمایش select موقعیت و انتخاب رنگ تاریخ با تغییر چک‌باکس
showDateTimeCheckbox.addEventListener("change", () => {
    const checked = showDateTimeCheckbox.checked;
    positionLabel.style.display = checked ? "inline-block" : "none";
    dateColorLabel.style.display = checked ? "inline-block" : "none";
});

// دانلود
document.getElementById("download").addEventListener("click", () => {
    const format = document.getElementById("format").value;

    if (format === "svg") {
        // دانلود SVG (بدون پس‌زمینه و تاریخ)
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
        // دانلود به صورت PNG/JPEG/WebP همراه پس‌زمینه و تاریخ و ساعت (در صورت فعال بودن)
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        // رسم پس‌زمینه
        if (bgImage) {
            tempCtx.drawImage(bgImage, 0, 0, tempCanvas.width, tempCanvas.height);
        } else {
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // رسم امضا
        svgPaths.forEach(path => {
            tempCtx.strokeStyle = path.color;
            tempCtx.lineWidth = path.width;
            tempCtx.beginPath();
            const commands = path.d.match(/[ML][^ML]*/g);
            commands.forEach(command => {
                const type = command[0];
                const coords = command.slice(2).split(" ").map(Number);
                if (type === "M") {
                    tempCtx.moveTo(coords[0], coords[1]);
                } else if (type === "L") {
                    tempCtx.lineTo(coords[0], coords[1]);
                }
            });
            tempCtx.stroke();
        });

        // درج تاریخ و ساعت امضا به صورت فارسی اگر فعال باشد
        if (showDateTimeCheckbox.checked) {
            tempCtx.fillStyle = dateColorPicker.value || "black";
            tempCtx.font = "16px Vazirmatn, sans-serif";
            tempCtx.textBaseline = "top";

            const now = new Date();
            const dateStr = now.toLocaleDateString('fa-IR');
            const timeStr = now.toLocaleTimeString('fa-IR');
            const text = `امضا شده در: ${dateStr} ساعت: ${timeStr}`;

            const padding = 10;
            let x = padding;
            let y = padding;

            // موقعیت متن بر اساس انتخاب کاربر
            switch (dateTimePositionSelect.value) {
                case "top-right":
                    x = tempCanvas.width - tempCtx.measureText(text).width - padding;
                    y = padding;
                    break;
                case "top-left":
                    x = padding;
                    y = padding;
                    break;
                case "bottom-right":
                    x = tempCanvas.width - tempCtx.measureText(text).width - padding;
                    y = tempCanvas.height - 20 - padding;
                    break;
                case "bottom-left":
                    x = padding;
                    y = tempCanvas.height - 20 - padding;
                    break;
            }

            tempCtx.fillText(text, x, y);
        }

        // ایجاد لینک دانلود و کلیک خودکار
        const link = document.createElement("a");
        link.download = `signature.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`);
        link.click();
    }
});
