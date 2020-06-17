var canvas = document.getElementById("renderer");
var gl = canvas.getContext("webgl");

var PRESET_FUNCTIONS = [
    'sin(x) * sin(z)',
    'x * x - z * z',
    'abs(x) * z',
    'abs(x) * z / sqrt(x * x + z * z)', // avioncito de papel
    '(x * x * x * z) / (x * x * x * x * x * x + z * z)'
];

var FRAGMENT_SOURCE = ''; // loaded with XHR

var stats = null;
var quadVBO = null;
var shader_program = null;
var last_time = 0;
var frame_requested = false;

var camera = null;
var lookfrom_uniform = null;
var lookat_uniform = null;
var time_uniform = null;
var aspect_ratio_uniform = null;

var PlotConfig = function() {
    this.preset = '';
    this.function = PRESET_FUNCTIONS[0];
    this.skip_frames = true;
    this.max_iterations = 2000;
    this.fov = 90;
    this.aa = 1;
    this.reset_camera = function() {
        if(camera) camera.reset();
        frame_requested = true;
    };
};

var plot_config = new PlotConfig();

function init() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
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
    
    resize();
    window.addEventListener('resize', resize, false);
    setInterval(resize, 1000); // avoid bugs
    
    function triggerFrame() {
        frame_requested = true;
    }
    function updateShader() {
        plot_config.preset = '';
        for (var i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
        }
        build_shader();
        triggerFrame();
    }

    var gui = new dat.GUI();
    gui.add(plot_config, 'preset', PRESET_FUNCTIONS).name("Load function").onFinishChange(function(fn) { plot_config.function = fn; updateShader(); });
    gui.add(plot_config, 'function').name('f(x, z) = ').onFinishChange(updateShader);
    gui.add(plot_config, 'max_iterations').name('Max iterations').min(0).max(3000).onChange(updateShader);
    gui.add(plot_config, 'skip_frames').name('Skip frames');
    gui.add(plot_config, 'fov').name('FOV').min(5).max(175).step(1).onChange(triggerFrame);
    gui.add(plot_config, 'reset_camera').name('Reset Camera');
    gui.add(plot_config, 'aa').name('Anti Alias').min(1).max(4).step(1).onChange(updateShader);
    
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
    const fragment_code = FRAGMENT_SOURCE
        .replace("{{{FN}}}", plot_config.function)
        .replace("{{{MAX_ITS}}}", parseInt(plot_config.max_iterations))
        .replace("{{{AA}}}", parseInt(plot_config.aa));

    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert_shader, vertex_code);
    gl.compileShader(vert_shader);

    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag_shader, fragment_code);
    gl.compileShader(frag_shader);

    if(!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        var msg = gl.getShaderInfoLog(frag_shader);
        alert(msg);
        throw new Error(msg.trim());
    }

    /*if(shader_program) {
        gl.deleteShader(shader_program);
        shader_program = null;
    }*/

    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    
    gl.useProgram(shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.enableVertexAttribArray(0);

    lookat_uniform = gl.getUniformLocation(shader_program, "lookat");
    lookfrom_uniform = gl.getUniformLocation(shader_program, "lookfrom");
    time_uniform = gl.getUniformLocation(shader_program, "time");
    aspect_ratio_uniform = gl.getUniformLocation(shader_program, "aspect_ratio");
    fov_uniform = gl.getUniformLocation(shader_program, "fov");
}

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    canvas.width = w;
    canvas.height = h;
    frame_requested = true;
}

function frame(time) {
    requestAnimationFrame(frame);

    var delta = (time - last_time) / 1000;
    last_time = time;
    
    camera.update(delta);
    if(camera.hasChanged())
        frame_requested = true;

    stats.domElement.style.display = plot_config.skip_frames ? 'none' : 'block';
    
    if(!frame_requested && plot_config.skip_frames)
        return; // skip frame
    frame_requested = false;

    stats.begin();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var lookfrom = camera.getLookFrom();
    var lookat = camera.getLookAt();

    gl.uniform3f(lookfrom_uniform, lookfrom[0], lookfrom[1], lookfrom[2]);
    gl.uniform3f(lookat_uniform, lookat[0], lookat[1], lookat[2]);
    gl.uniform1f(time_uniform, time / 1000);
    gl.uniform1f(aspect_ratio_uniform, canvas.width / canvas.height);
    gl.uniform1f(fov_uniform, plot_config.fov);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
	stats.end();
}

fetch('fragment.fs')
.then(function(response) { return response.text(); })
.then(function(data) {
    FRAGMENT_SOURCE = data;
    init();
    frame_requested = true;
    frame(0);
});
