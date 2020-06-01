var canvas = document.getElementById("renderer");
var gl = canvas.getContext("webgl");

var FRAGMENT_SOURCE = ''; // loaded with XHR

var stats = null;
var quadVBO = null;
var shader_program = null;
var last_time = 0;

var camera = null;
var lookfrom_uniform = null;
var lookat_uniform = null;

function init() {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.domElement);

    camera = new Camera(canvas);

    gl.clearColor(1, 0, 1, 1);
    gl.disable(gl.DEPTH_TEST);
    
    // create VBO
    var verts = [
        1.0,  1.0,
       -1.0,  1.0,
       -1.0, -1.0,
       -1.0, -1.0,
        1.0, -1.0,
        1.0,  1.0
    ];
    quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    
    build_shader();
}

function build_shader() {
    const vertex_code = `
        attribute vec2 v_pos;
        varying vec2 f_uv;

        void main() {
            f_uv = (v_pos + vec2(1.0)) / 2.0;
            gl_Position = vec4(v_pos, 0.0, 1.0);
        }
    `;
    const fragment_code = FRAGMENT_SOURCE;

    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert_shader, vertex_code);
    gl.compileShader(vert_shader);

    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag_shader, fragment_code);
    gl.compileShader(frag_shader);

    if(!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(frag_shader));
    }

    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    
    gl.useProgram(shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);

    var v_pos = gl.getAttribLocation(shader_program, "v_pos");

    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.enableVertexAttribArray(v_pos);

    lookat_uniform = gl.getUniformLocation(shader_program, "lookat");
    lookfrom_uniform = gl.getUniformLocation(shader_program, "lookfrom");
}

function frame(time) {
    requestAnimationFrame(frame);

    var delta = (time - last_time) / 1000;
    last_time = time;

	stats.begin();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    camera.update(delta);
    var lookfrom = camera.getLookFrom();
    var lookat = camera.getLookAt();

    gl.uniform3f(lookfrom_uniform, lookfrom[0], lookfrom[1], lookfrom[2]);
    gl.uniform3f(lookat_uniform, lookat[0], lookat[1], lookat[2]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
	stats.end();
}

fetch('fragment.fs')
.then(function(response) { return response.text(); })
.then(function(data) {
    FRAGMENT_SOURCE = data;
    init();
    frame(0);
});
