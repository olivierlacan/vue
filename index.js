document.addEventListener("DOMContentLoaded", function(){
  var orientations = [
    { scale: {x: 1, y: 1}, rotate: 0 },
    { scale: {x: 1, y: 1}, rotate: 0 },
    { scale: {x: -1, y: 1}, rotate: 0 },
    { scale: {x: 1, y: 1}, rotate: 180 },
    { scale: {x: 1, y: -1}, rotate: 0 },
    { scale: {x: -1, y: 1}, rotate: 90 },
    { scale: {x: 1, y: 1}, rotate: 90 },
    { scale: {x: -1, y: 1}, rotate: -90 },
    { scale: {x: 1, y: 1}, rotate: -90 }
  ];

  function base64ToArrayBuffer (base64) {
    base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function translate(image, orientation, opts) {
    orientation = orientation || {};
    opts = opts || {};
    var c = document.createElement('img');
    c.width = opts.width || image.naturalWidth;
    c.height = opts.height || image.naturalHeight;
    if (orientation.scale.x === -1 && orientation.scale.y === -1) {
      // ctx.translate(c.width,c.height);
      // ctx.scale(orientation.scale.x,orientation.scale.y);
    } else if (orientation.scale.x!==1) {
      // ctx.translate(c.width,0);
      // ctx.scale(orientation.scale.x,1);
    } else if (orientation.scale.y!==1) {
      // ctx.translate(0,c.height);
      // ctx.scale(1,orientation.scale.y);
    }
    if (orientation.rotate) {
      // ctx.translate(c.width*0.5,c.height*0.5);
      ctx.rotate(orientation.rotate*(Math.PI / 180));
      // ctx.translate(-c.width*0.5,-c.height*0.5);
    }
    return c;
  };


  function findOrientation(binaryFile, callback) {
    var exif = EXIF.readFromBinaryFile(binaryFile);
    var val = exif.Orientation || 0;
    var orientation = orientations[val];
    if (orientation) {
      orientation.exif = val;
      callback(undefined, orientation);
    } else {
      callback(new Error('Could not find EXIF Orientation.'));
    }
  };

  fileSelector = document.querySelector("input");
  previews = document.querySelector(".previews");
  overlay = document.querySelector(".overlay");
  var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  var isMaximized = function(){
    !overlay.classList.contains("hidden");
  }

  /**
    * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
    * images to fit into a certain area.
    *
    * @param {Number} srcWidth Source area width
    * @param {Number} srcHeight Source area height
    * @param {Number} maxWidth Fittable area maximum available width
    * @param {Number} maxHeight Fittable area maximum available height
    * @return {Object} { width, heigth }
    */
  function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth * ratio, height: srcHeight * ratio };
  }

  var maximize = function(event) {
    image = event.currentTarget || event;
    image.classList.toggle("maximized");
    imageSource = image.src;
    fullWidthImage = new Image();

    if(image.classList.contains("rotate90")){
      fullWidthImage.classList.add("rotate90");
    } else if(image.classList.contains("rotate180")) {
      fullWidthImage.classList.add("rotate180");
    } else if(image.classList.contains("rotate270")) {
      fullWidthImage.classList.add("rotate270");
    } else if(image.classList.contains("rotate360")) {
      fullWidthImage.classList.add("rotate360");
    } else if(image.classList.contains("rotate-90")) {
      fullWidthImage.classList.add("rotate-90");
    } else if(image.classList.contains("rotate-180")) {
      fullWidthImage.classList.add("rotate-180");
    }

    fullWidthImage.src = imageSource;
    aspectRatio = calculateAspectRatioFit(fullWidthImage.width, fullWidthImage.height, viewportWidth, viewportHeight)
    fullWidthImage.width = aspectRatio.width;
    fullWidthImage.height = aspectRatio.height;
    overlay.appendChild(fullWidthImage);

    overlay.classList.toggle("hidden");
    previews.classList.toggle("hidden");
    overlay.classList.toggle("visible");
  };

  var select = function(direction = "left"){
    if(isMaximized){
      maximizedImage = document.querySelector(".maximized");

      if(direction == "left") {
        imageToMaximize = maximizedImage.previousElementSibling;
      } else {
        imageToMaximize = maximizedImage.nextElementSibling;
      }

      if(imageToMaximize) {
        imageToMaximize.classList.toggle("selected");
        unmaximize();
        maximize(imageToMaximize);
      } else {
        console.log("No more images to the " + direction + ".")
      }
    } else {
      selectedElement = document.querySelector(".selected");

      if(selectedElement) {
        selectedElement.classList.toggle("selected");

        if(direction == "left") {
          selectedElement.previousElementSibling.classList.toggle("selected");
        } else {
          selectedElement.nextElementSibling.classList.toggle("selected");
        }
      } else {
        previews.children[0].classList.toggle("selected");
      }
    }
  }

  var unmaximize = function(image = overlay.children[0]) {
    maximizedImagePreview = document.querySelector(".maximized");
    maximizedImagePreview.classList.toggle("maximized");
    overlay.removeChild(image);
    previews.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
    overlay.classList.toggle("visible");
  };

  document.onkeydown = function(event) {
    event = event || window.event;
    var isEscape, isLeft, isRight, isUp, isDown = false;

    if ("key" in event) {
      isEscape = (event.key == "Escape" || event.key == "Esc");
      isLeft = (event.key == "ArrowLeft");
      isRight = (event.key == "ArrowRight");
      isUp = (event.key == "ArrowUp");
      isDown = (event.key == "ArrowDown");
      isEnter = (event.key == "Enter");
    } else {
      isEscape = (event.keyCode == 27);
      isLeft = (event.keyCode == 37);
      isRight = (event.keyCode == 39);
      isUp = (event.keyCode == 38);
      isDown = (event.keyCode == 40);
    }

    if (isEscape) { unmaximize(); }
    if (isLeft) { select("left"); }
    if (isRight) { select("right"); }
    if (isUp) { selectUp(); }
    if (isDown) { selectDown(); }
  };

  function filesSelected(event) {
    files = event.currentTarget.files;
    console.log(files.length + " files were selected");

    function readAndPreview(file){
      // Make sure `file.name` matches our extensions criteria
      if ( /\.(jpe?g|png|gif)$/i.test(file.name) ) {

        var reader = new FileReader();

        reader.addEventListener("load", function () {
          var image = new Image();
          image.title = file.name;
          imageData = this.result;

          var arrayBuffer = base64ToArrayBuffer(imageData);
          var exif = EXIF.readFromBinaryFile(arrayBuffer);
          var val = exif.Orientation || 0;
          var orientation = orientations[val];
          if (orientation) {
            orientation.exif = val;
          } else {
            console.log('Could not find EXIF Orientation.');
          }

          image.addEventListener("load", function(img){
            aspectRatio = calculateAspectRatioFit(this.width, this.height, 150, 150)
            image.width = aspectRatio.width;
            image.height = aspectRatio.height;
            if(orientation.rotate != 0){
              image.classList.add("rotate" + orientation.rotate);
            }

            previews.appendChild( this );

            this.onclick("click", maximize);
          })

          image.src = imageData;
        }, false);

        if (file) {
          reader.readAsDataURL(file);
        }
      }
    }

    if (files) {
      [].forEach.call(files, readAndPreview);
    }
  }

  fileSelector.addEventListener("change", filesSelected);
});
