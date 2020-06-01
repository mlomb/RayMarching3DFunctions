const MOUSE_SPEED = 0.005;
const MOVEMENT_SPEED = 20;

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] - b[1],
        a[2] * b[0] - a[0] - b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}
function addVector(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ];
}
function multVecScalar(a, t) {
    return [
        a[0] * t,
        a[1] * t,
        a[2] * t
    ];
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function Camera(domElement) {
    this.position = [ 5, 5, 5 ];
    this.rotation = [ 0, 0, 0 ];

    // input
    var is_locked = false;
    var keys = { };

    domElement.addEventListener("mousemove", function(e) {
        if(is_locked) {
            this.rotation[0] -= e.movementX * MOUSE_SPEED;
            this.rotation[1] -= e.movementY * MOUSE_SPEED;
            this.rotation[1] = clamp(this.rotation[1], -1.55334, 1.55334);
        }
    }.bind(this));
    
    document.addEventListener("keydown", function(e) {
        keys[e.code] = true;
    }.bind(this));
    document.addEventListener("keyup", function(e) {
        keys[e.code] = false;
    }.bind(this));
    domElement.addEventListener("click", function(e) {
		domElement.requestPointerLock();
    }.bind(this));
    document.addEventListener("pointerlockchange", function(e) {
		is_locked = document.pointerLockElement === domElement;
    }.bind(this));

    this.update = function(delta) {
        var direction = this.getDirection();
        var right = [
            Math.sin(this.rotation[0] - Math.PI / 2),
            0,
            Math.cos(this.rotation[0] - Math.PI / 2)
        ];
        var up = cross(right, direction);

        if(is_locked) {
            if (keys.KeyW)
                this.position = addVector(this.position, multVecScalar(direction, delta * MOVEMENT_SPEED));
            if (keys.KeyS)
                this.position = addVector(this.position, multVecScalar(direction, -delta * MOVEMENT_SPEED));
            if (keys.KeyA)
                this.position = addVector(this.position, multVecScalar(right, -delta * MOVEMENT_SPEED));
            if (keys.KeyD)
                this.position = addVector(this.position, multVecScalar(right, delta * MOVEMENT_SPEED));
        }

    }.bind(this);
    this.getDirection = function() {
        return [
            Math.cos(this.rotation[1]) * Math.sin(this.rotation[0]),
            Math.sin(this.rotation[1]),
            Math.cos(this.rotation[1]) * Math.cos(this.rotation[0])
        ];
    }.bind(this);
    this.getLookFrom = function() {
        return this.position;
    }.bind(this);
    this.getLookAt = function() {
        return addVector(this.position, this.getDirection());
    }.bind(this);
};