precision highp float;

varying vec2 f_uv;

uniform vec3 lookfrom;
uniform vec3 lookat;

const float C = 0.00001;

// TODO
// - Transparente

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 ray_at(Ray ray, float t) {
    return ray.origin + t * ray.direction;
}

Ray camera_get_ray(vec2 uv) {
	// vec3 lookfrom = vec3(0.0, 5.0, 5.01);
	// vec3 lookat = vec3(0, 3, 0);
	vec3 vup = vec3(0, 1, 0);
	float vfov = 45.0;
	float aspect_ratio = 1.0;

	float theta = vfov * 3.1415926535897932385 / 180.0;
	float h = tan(theta / 2.0);
	float viewport_height = 2.0 * h;
	float viewport_width = aspect_ratio * viewport_height;

	vec3 w = normalize(lookfrom - lookat);
	vec3 u = normalize(cross(vup, w));
	vec3 v = cross(w, u);

	vec3 origin = lookfrom;
	vec3 horizontal = viewport_width * u;
	vec3 vertical = viewport_height * v;
	vec3 lower_left_corner = origin - horizontal / 2.0 - vertical / 2.0 - w;

    Ray ray;
    ray.origin = origin;
    ray.direction = lower_left_corner + uv.x * horizontal + uv.y * vertical - origin;
    return ray;
}

float original(float x, float z) {
    // return sin(x) + sin(z);
    // return (x * x * x * z) / (x * x * x * x * x * x + z * z);
    // return x * x - z * z;
    // return sin(x);
    // return x;
    // return abs(x) * z / sqrt(x * x + z * z); // avioncito de papel
    // return abs(x) * z;
    return x * x * x + z * z * 3.0 + x * 5.0  + z * 4.0;
}

vec3 derivOriginal(vec3 location) {
    float o = original(location.x, location.z);
    return vec3(
        (original(location.x + C, location.z) - o) / C,
        -1,
        (original(location.x, location.z + C) - o) / C
    );
}

float func(float x, Ray r) {
    return
        original(r.origin.x + x * r.direction.x, r.origin.z + x * r.direction.z) +
        (-r.origin.y) +
        (-x * r.direction.y)
        ;
}

float derivFunc(float x, Ray r) {
    return (func(x + C, r) - func(x, r)) / C;
}

bool newtonRaphson(out float t, const float t_max, const Ray r) {
    #define EPSILON 0.00001

    float h = func(t, r) / derivFunc(t, r);
    for (int i = 0; i < 100; ++i) {
        h = func(t, r) / derivFunc(t, r);

        // x(i+1) = x(i) - f(x) / f'(x)
        t = t - h;
        if(t > 0.0 && t < t_max && abs(h) <= EPSILON) {
            const float BOX_SIZE = 30.0;
            vec3 hit_point = ray_at(r, t);
            return BOX_SIZE - abs(hit_point.x) > 0.0 &&
                   BOX_SIZE - abs(hit_point.y) > 0.0 &&
                   BOX_SIZE - abs(hit_point.z) > 0.0;
        }
    }
    return false;
}

bool hit_sinwave(out float t_hit, const Ray ray) {
    t_hit = 1.0 / 0.0; // "infinity"
    float t;
    bool hit = false;
    for (int k = 0; k < 50; ++k) {
        t = pow(1.09, float(k)) - 1.0;
        if(newtonRaphson(t, t_hit, ray)) {
            if(t < t_hit) {
                t_hit = t;
                hit = true;
            }
        }
    }
    return hit;
}

vec3 color(Ray ray) {
    vec3 unit_direction = normalize(ray.direction);
    float t = 0.5 * (unit_direction.y + 1.0);
    vec3 out_color = (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);

    // hit function

    float t_hit;
    if(hit_sinwave(t_hit, ray)) {
        vec3 hit_point = ray_at(ray, t_hit);
        vec3 normal = derivOriginal(hit_point);
        return 0.5 * (normal + vec3(1.0));
    }
    return out_color;
}

void main() {
    Ray ray = camera_get_ray(f_uv);
    gl_FragColor = vec4(color(ray), 1);
}