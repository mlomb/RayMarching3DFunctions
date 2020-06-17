precision highp float;

#define AA {{{AA}}}

varying vec2 f_uv;

uniform vec3 lookfrom;
uniform vec3 lookat;
uniform float time;
uniform float fov;
uniform float aspect_ratio;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 ray_at(Ray ray, float t) {
    return ray.origin + t * ray.direction;
}

Ray camera_get_ray(vec2 uv) {
    vec3 vup = vec3(0, 1, 0);

    float theta = fov * 3.1415926535897932385 / 180.0;
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

const float EPS = 0.01;

float f(float x, float z) {
    return {{{FN}}};
}

bool castRay(Ray ray, inout float t_hit) {
    float t = 0.001;
    float dt = 0.01;

    float last_f = 0.0;
    float last_ray_y = 0.0;

    float inv = ray.origin.y > f(ray.origin.x, ray.origin.z) ? 1.0 : -1.0;

    for(int k = 0; k < {{{MAX_ITS}}}; k++) {
        vec3 p = ray_at(ray, t);
        float y = f(p.x, p.z);
        if(p.y * inv < y * inv) {
            t_hit = t - dt + dt * (last_f-last_ray_y) / ((last_f + p.y) - (y + last_ray_y));
            return true;
        }
        
        dt = 0.01 * t;
        t += dt;

        last_f = y;
        last_ray_y = p.y;
    }
    
    return false;
}

vec3 calcNormal(vec3 p) {
    return normalize(vec3(
        f(p.x - EPS, p.z) - f(p.x + EPS, p.z),
        2.0 * EPS,
        f(p.x, p.z - EPS) - f(p.x, p.z + EPS)
    ));
}

vec3 color(Ray ray) {
    vec3 unit_direction = normalize(ray.direction);
    float t = 0.5 * (unit_direction.y + 1.0);
    vec3 out_color = (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);

    float t_hit;
    if(castRay(ray, t_hit)) {
        vec3 hit_point = ray_at(ray, t_hit);
        vec3 normal = calcNormal(hit_point);
        return 0.5 * (normal + vec3(1.0));
    }

    return out_color;
}

void main() {

    vec3 total_color = vec3(0.0);
    
    #if AA > 1
    vec2 resolution = 1.0 / vec2(1280, 720) / float(AA);
    for( int m = 0; m < AA; m++ )
    for( int n = 0; n < AA; n++ )
    {
        vec2 uv_aa = f_uv + resolution * vec2(m, n);
    #else
        vec2 uv_aa = f_uv;
    #endif

        Ray ray = camera_get_ray(uv_aa);
        vec3 col = color(ray);
        // col = pow(col, vec3(0.4545)); // gamma correct

        total_color += col;
    #if AA > 1
    }
    total_color /= float(AA*AA);
    #endif

    gl_FragColor = vec4(total_color, 1.0);
}