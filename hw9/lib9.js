//////////////////////////////////////////////////////////////////////////////////////////
//
// THIS IS THE SUPPORT LIBRARY.  YOU PROBABLY DON'T WANT TO CHANGE ANYTHING HERE JUST YET. 
//
//////////////////////////////////////////////////////////////////////////////////////////

let fragmentShaderHeader = ['' // WHATEVER CODE WE WANT TO PREDEFINE FOR FRAGMENT SHADERS
   , 'precision highp float;', '#define _NDEBUG\n','float noise(vec3 point) { float r = 0.; for (int i=0;i<16;i++) {', '  vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +', '       1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);', '  C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);', '  D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;', '  r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);', '} return .5 * sin(r); }'
].join('\n');
var ns = 5,
   cns = 5;
fragmentShaderHeader += 'const int ns = ' + ns + ';\n';
var fragmentShaderDefs = 'const int cns = ' + cns + ';\n';
var status = 'Move your character to start!';
let nfsh = fragmentShaderHeader.split('\n').length + 1; // NUMBER OF LINES OF CODE IN fragmentShaderHeader

let isFirefox = navigator.userAgent.indexOf('Firefox') > 0;

function getBlob(data) {
   let bytes = new Array(data.length);
   for (let i = 0; i < data.length; i++) {
      bytes[i] = data.charCodeAt(i);
   }
   return new Blob([new Uint8Array(bytes)]);
}
let stack = function (){
   this.storage = ['Ready.'];
   this.len = 1;
   this.pop = ()=>{return this.storage[--this.len-1];}
   this.push = (o)=>{this.storage[this.len++] = o;}
   this.update = (o)=>{this.storage[this.len-1] = o;}
   this.top = () => {return this.storage[this.len - 1];}
   this.clear = () => this.len = 1;
}
let status_history = new stack();
function updateStatus(val){
   status_history.update(status);
   status = val;
   errorMessage.innerHTML = val;
}
function pushStatus(val){
   status_history.push(status);
   status = val;
   errorMessage.innerHTML = val;
}
function restoreStatus(val){
   status = status_history.pop();
   errorMessage.innerHTML = status;
}
function resetStatus() {
   status_history.clear();
   updateStatus('Ready.');
}
var texture = [], 
   gl, program;
let textures = [];
let lock = false;

function loadTexture(gl, url, i) {
   const level = 0;
   const internalFormat = gl.RGBA;
   const width = 1;
   const height = 1;
   const border = 0;
   const srcFormat = gl.RGBA;
   const srcType = gl.UNSIGNED_BYTE;
   if (texture[i] == null) {
      texture[i] = gl.createTexture();
      const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture[i]);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
         width, height, border, srcFormat, srcType,
         pixel);
   }
   const image = new Image();
   image.onload = function () {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture[i]);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
         srcFormat, srcType, image);

      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         gl.generateMipmap(gl.TEXTURE_2D);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else {
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
   };
   image.src = url;
}
function initTextures(gl, program){
   for (let i = 0; i < ns; ++i) {
      loadTexture( gl, './' + (i + 1) + '.jpg', i); //Texture loading.
      textures[i] = i;
   }
   textures[ns] = ns;
   initVideoTexture(gl, ns + 0);
   textures[ns + 1] = ns + 1;
   loadTexture(gl, './RTXon.svg', ns + 1);
   textures[ns+2] = ns+2;
   loadTexture(gl, './wwe.svg', ns + 2);
   textures[ns+3] = ns+3;
   loadTexture(gl, './win.svg', ns + 3);   
   textures[ns+4] = ns+4;
   loadTexture(gl, './lose.svg', ns + 4);
   gl.uniform1iv(gl.getUniformLocation(program, 'uSampler'), textures);
}
function initVideoTexture(gl, i) {
   const level = 0;
   const internalFormat = gl.RGBA;
   const width = 1;
   const height = 1;
   const border = 0;
   const srcFormat = gl.RGBA;
   const srcType = gl.UNSIGNED_BYTE;
   if (texture[i] == null) {
      texture[i] = gl.createTexture();
      const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
      gl.activeTexture(gl.TEXTURE + i);
      gl.bindTexture(gl.TEXTURE_2D, texture[i]);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
         width, height, border, srcFormat, srcType,
         pixel);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   }
}
function updateVideoTexture(gl, v_control, i){
   //return;
   const level = 0;
   const internalFormat = gl.RGBA;
   const srcFormat = gl.RGBA;
   const srcType = gl.UNSIGNED_BYTE;
   gl.bindTexture(gl.TEXTURE_2D, texture[i]);
   gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                 srcFormat, srcType, v_control);
}
function isPowerOf2(value) {
   return (value & (value - 1)) == 0;
}
function buildShaders(vertexShader, fragmentShader){
   let curr_program = canvas1.gl.createProgram();
   let compile_shaders = (type, src) => {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      gl.attachShader(curr_program, shader);
   };
   compile_shaders(gl.VERTEX_SHADER, vertexShader);
   compile_shaders(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentShaderDefs + fragmentShader);
   gl.linkProgram(curr_program);

   return curr_program;
}
function gl_start(canvas, vertexShader, fragmentShader) { // START WEBGL RUNNING IN A CANVAS
   console.log('glstart');
   setTimeout(function () {
      try {
         canvas.gl = canvas.getContext('experimental-webgl'); // Make sure WebGl is supported. IT WOULD BE GREAT TO USE WEBGL2 INSTEAD.
      } catch (e) {
         throw 'Sorry, your browser does not support WebGL.';
      }
      

      canvas.setShaders = function (vertexShader, fragmentShader) { // Add the vertex and fragment shaders:
         gl = this.gl;
         program = gl.createProgram(); // Create the WebGL program.

         function addshader(type, src) { // Create and attach a WebGL shader.
            function spacer(color, width, height) {
               return '<table bgcolor=' + color +
                  ' width=' + width +
                  ' height=' + height + '><tr><td>&nbsp;</td></tr></table>';
            }
            errorMessage.innerHTML = status;
            //  errorMarker.innerHTML = spacer('white', 1, 1) + '<font size=1 color=white>\u25B6</font>';
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
               let msg = gl.getShaderInfoLog(shader);
               console.log('Cannot compile shader:\n\n' + msg);

               let a = msg.substring(6, msg.length);
               let line = 0;
               if (a.substring(0, 3) == ' 0:') {
                  a = a.substring(3, a.length);
                  line = parseInt(a) - nfsh;

                  editor.session.setAnnotations([{
                     row: line,
                     column: 0,
                     text: msg,
                     type: "error"
                  }]);
               }
               let j = a.indexOf(':');
               a = 'line ' + (line + 1) + a.substring(j, a.length);
               if ((j = a.indexOf('\n')) > 0)
                  a = a.substring(0, j);
               errorMessage.innerHTML = a;
            } else
               editor.session.clearAnnotations();
            gl.attachShader(program, shader);
         };

         addshader(gl.VERTEX_SHADER, vertexShader); // Add the vertex and fragment shaders.
         addshader(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentShaderDefs + fragmentShader);

         gl.linkProgram(program); // Link the program, report any errors.
         if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(program);
         gl.program = program;
         if(!gl.shaders)
            gl.shaders = [program];
         else gl.shaders[0] = program;
         initTextures(gl, program);
         positionsupdated = true;
         let attribs = [
            .05, .05, .1, .5, .5, 1., 1., .5, .5, 20., 0., .0, 1.3,
            .1, .05, .05, 1., .5, .5, 1., .5, .5, 10., .3, 1., 1.3,
            .1, .05, .05, .71, .71, .71, .71, .71, .71, 10., 0.3, .0, 1.5,
            .1, .1, .1, .71, .71, .71, .71, .71, .71, 10., 0.05, 0., 1.,
            .0, .0, .0, .0, .0, .0, .0, .0, .0, 40., 0., .85, 1.5
         ]
         var offset = 0;
         for (let i = 0; i < ns; i++) {
            setUniform('3fv', 'Ambient[' + i + ']', attribs.slice(offset, offset += 3));
            setUniform('3fv', 'Diffuse[' + i + ']', attribs.slice(offset, offset += 3));
            setUniform('4fv', 'Specular[' + i + ']', attribs.slice(offset, offset += 4));
            setUniform('1fv', 'ks[' + i + ']', attribs.slice(offset, offset += 1));
            setUniform('1fv', 'kr[' + i + ']', attribs.slice(offset, offset += 1));
            setUniform('1fv', 'kf[' + i + ']', attribs.slice(offset, offset += 1));
         }
         offset = 0;
         for (let i = 0; i < n_shapes; i++) {
            setUniform('3fv', 'starColors[' + i + ']', starColors.slice(offset, offset += 3));
         }
         
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); // Create a square as a triangle strip
         // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(                       //    consisting of two triangles.
         //    [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]), gl.STATIC_DRAW);
         gl.enable(gl.DEPTH_TEST);
         gl.depthFunc(gl.LEQUAL);
         gl.clearDepth(-1);
         gl.enable(gl.BLEND);  
         gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
         let oid = gl.getAttribLocation(program, 'oid'); // Set aPos attribute for each vertex.
         gl.enableVertexAttribArray(oid);
         gl.vertexAttribPointer(oid, 1, gl.FLOAT, false, 4 * 7, 0);

         let aPos = gl.getAttribLocation(program, 'aPos'); // Set aPos attribute for each vertex.
         gl.enableVertexAttribArray(aPos);
         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 4 * 7, 4);

         let normal = gl.getAttribLocation(program, 'normal'); // Set aPos attribute for each vertex.
         gl.enableVertexAttribArray(normal);
         gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 4 * 7, 4 * 4);
      }

      canvas.setShaders(vertexShader, fragmentShader); // Initialize everything,
      setInterval(function () { // Start the animation loop.
         gl = canvas.gl;
         if (gl.startTime === undefined) // First time through,
            gl.startTime = Date.now(); //    record the start time.
         animate(gl);
         //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);                                    // Render the square.
      }, 30);

   }, 100); // Wait 100 milliseconds after page has loaded before starting WebGL.
}

// THE animate() CALLBACK FUNCTION CAN BE REDEFINED IN index.html.

function animate() {}

function setUniform(type, name, a, b, c, d, e, f) {
   if (gl) {
      let loc = gl.getUniformLocation(gl.program, name);
      (gl['uniform' + type])(loc, a, b, c, d, e, f);
   }
}

//let VERTEX_SIZE = 3;


let VERTEX_SIZE = 7;


var drawMesh = (mesh, func = gl.TRIANGLE_STRIP) => {
   gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
   gl.drawArrays(func, 0, mesh.length / VERTEX_SIZE);
}