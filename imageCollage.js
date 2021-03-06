var CropBox = (function () {
    // image null raise
    function CropBox(x, y, width, height) {
        if (x === void 0) x = 0;
        if (y === void 0) y = 0;
        if (width === void 0) width = 100;
        if (height === void 0) height = 100;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ar = this.width / this.height;
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;
    }

    CropBox.prototype.setCropBox = function (x, y, width, height) {
        if (!target.isImageSet()) {
            throw "Image is null";
        }
        // 크롭영역 업데이트
        if (x === void 0) x = target.cx - this.offsetX;
        if (y === void 0) y = target.cy - this.offsetY;
        if (width === void 0) width = this.width;
        if (height === void 0) height = this.height;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;
    };
    CropBox.prototype.overCheck = function (mx, my) {
        return (mx >= this.x) && (mx <= (this.x + this.width)) && (my >= this.y) && (my <= (this.y +
            this.height));
    };
    CropBox.prototype.moveIt = function (evt) {
        var mx;
        var my;
        if (evt.layerX || evt.layerX === 0) { // 파이어폭스, ???
            mx = evt.layerX;
            my = evt.layerY;
        } else if (evt.offsetX || evt.offsetX === 0) { // 오페라, ???
            mx = evt.offsetX;
            my = evt.offsetY;
        }
        this.x = mx - this.offsetX;
        this.y = my - this.offsetY;
        target.draw(target.ctx);
    };
    CropBox.prototype.dropIt = function () {
        target.canvas.removeEventListener('mousemove', target.moveHandler, false);
        target.canvas.removeEventListener('mouseup', target.upHandler, false);
        target.canvas.style.cursor = "default"; // 커서를 십자 모양으로 되돌림
        // target.clickHandler = null;
        preview();
    };
    return CropBox;
})();
var TargetImage = (function () {
    function TargetImage(canvas, x, y, width, height) {
        this.imageSet = false;
        // 캔버스
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        this.cx = this.canvasWidth / 2;
        this.cy = this.canvasHeight / 2;
        // 리사이즈 이미지
        if (x === void 0) x = 0;
        if (y === void 0) y = 0;
        if (width === void 0) width = 100;
        if (height === void 0) height = 100;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ar = this.width / this.height;

        this.draw(this.ctx);

        // 크롭영역
        this.cropBox = new CropBox();

        // 마우스 컨트롤
        this.stuff = [];
        this.stuff.push(this.cropBox);

        // 프리뷰
        this.cropCanvas = document.createElement('canvas');
        this.croppedImage = new Image();

        // 이벤트 처리
        this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
    }

    TargetImage.prototype.mouseDown = function (evt) {
        var mx;
        var my;
        if (evt.layerX || evt.layerX === 0) { // 파이어폭스, ???
            mx = evt.layerX;
            my = evt.layerY;
        } else if (evt.offsetX || evt.offsetX === 0) { // 오페라, ???
            mx = evt.offsetX;
            my = evt.offsetY;
        }
        var endpt = this.stuff.length - 1;
        for (var i = endpt; i >= 0; i--) { // 역 순서
            // 객체 선택 여부 확인
            if (this.stuff[i].overCheck(mx, my)) {
                var selectedStuff = this.stuff[i];
                selectedStuff.offsetX = mx - selectedStuff.x;
                selectedStuff.offsetY = my - selectedStuff.y;
                this.canvas.style.cursor = "pointer"; // 커서를 드래그 중에 손가락 모양으로 바꿈
                // 바인딩하는 경우 두 번째 매개변수는 다른 객체를 반환한다. 삭제를 위해 접근 가능한 대상 객체가 필요
                this.moveHandler = selectedStuff.moveIt.bind(selectedStuff);
                this.upHandler = selectedStuff.dropIt.bind(selectedStuff);
                this.canvas.addEventListener('mousemove', this.moveHandler, false);
                this.canvas.addEventListener('mouseup', this.upHandler, false);
                break;
            }
        }
    };
    TargetImage.prototype.draw = function (ctx) {
        if (this.sourceImage) {
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            ctx.drawImage(this.sourceImage, this.x, this.y, this.width, this.height);
            // 크롭박스 그리기
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255,228,0,1)';
            ctx.strokeRect(this.cropBox.x, this.cropBox.y, this.cropBox.width, this.cropBox.height);
        } else {
            ctx.fillStyle = 'rgba(192,192,192,1)';
            // 이미지를 가져오기 전에는
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    };
    TargetImage.prototype.isImageSet = function () {
        return this.imageSet;
    };
    TargetImage.prototype.setImage = function (img) {
        this.sourceImage = img;
        this.imageSet = true;
        this.ar = this.sourceImage.width / this.sourceImage.height;
        // 이미지 정보 업데이트
        if (this.ar >= 1) {
            this.width = (this.sourceImage.width > this.canvasWidth) ? this.canvasWidth : this.sourceImage
                .width;
            this.height = Math.round(this.width / this.ar);
        } else {
            this.height = (this.sourceImage.height > this.canvasHeight) ? this.canvasHeight : this.sourceImage
                .height;
            this.width = Math.round(this.height * this.ar);
        }
        this.x = Math.round(this.canvasWidth / 2 - this.width / 2);
        this.y = Math.round(this.canvasHeight / 2 - this.height / 2);
        // 원보관의 비율
        this.ratio = this.sourceImage.width / this.width;

        // 크롭영역 업데이트
        this.cropBox.setCropBox();

        this.draw(this.ctx);
    };
    TargetImage.prototype.getCroppedImage = function () {
        this.cropCanvas.width = 300;
        this.cropCanvas.height = Math.round(this.cropCanvas.width / this.cropBox.ar);
        var sx, sy, sw, sh;
        sx = (this.cropBox.x - this.x) * this.ratio;
        sy = (this.cropBox.y - this.y) * this.ratio;
        sw = this.cropBox.width * this.ratio;
        sh = this.cropBox.height * this.ratio;
        this.cropCanvas.getContext('2d').drawImage(this.sourceImage, sx, sy, sw, sh, 0, 0, this.cropCanvas
            .width, this.cropCanvas.height);
        this.croppedImage.width = this.cropCanvas.width;
        this.croppedImage.height = this.cropCanvas.height;
        this.croppedImage.src = this.cropCanvas.toDataURL("image/" + this.fileType);
        return this.croppedImage;
    };
    return TargetImage
})();

var target;

window.onload = function () {
    var canvas = document.getElementById("imageCanvas");
    var width = canvas.widows;
    var height = canvas.height;
    // var width = 500;
    // var height = 500;

    target = new TargetImage(canvas, 0, 0, width, height);

    document.getElementById('fileInput').addEventListener('change', handleFileInput);
};

function preview() {
    if (target.isImageSet()) {
        var img = target.getCroppedImage();
        img.onload = (function () {
            return previewLoaded(img);
        });
    }
}

function previewLoaded(img) {
    if (img) {
        document.getElementById("preview").appendChild(img);
    }
}

function handleFileInput(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    var img = new Image();
    img.addEventListener("load", function () {
        target.setImage(img);
        preview();
    }, false);
    reader.addEventListener("load", function () {
        img.src = reader.result;
    }, false);
    if (file) {
        reader.readAsDataURL(file);
    }
}

