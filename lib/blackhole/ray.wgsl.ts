// Generated from src/ray.wgsl — black hole raymarcher WGSL shader.
export const rayShader = String.raw`const PI: f32 = 3.141592653589793;
const SPEED_OF_LIGHT: f32 = 1.0;
const GRAVITATIONAL_CONSTANT: f32 = 1.0;
const UNIVERSE_RADIUS: f32 = 60.0;
const BLACK_HOLE_MASS: f32 = 1.0;
const SCHWARZSCHILD_RADIUS: f32 = 2.0 * GRAVITATIONAL_CONSTANT * BLACK_HOLE_MASS / (SPEED_OF_LIGHT * SPEED_OF_LIGHT);
const ACCRETION_DISK_INNER_RADIUS: f32 = SCHWARZSCHILD_RADIUS * 3.0;
const ACCRETION_DISK_OUTER_RADIUS: f32 = SCHWARZSCHILD_RADIUS * 8.0;
const ACCRETION_DISK_INNER_THICKNESS: f32 = ACCRETION_DISK_INNER_RADIUS * 0.05;
const ACCRETION_DISK_OUTER_THICKNESS: f32 = ACCRETION_DISK_OUTER_RADIUS * 0.05;
const OMEGA_CONSTANT: f32 = 2.0 * 2.0 * PI * sqrt(ACCRETION_DISK_INNER_RADIUS * ACCRETION_DISK_INNER_RADIUS * ACCRETION_DISK_INNER_RADIUS);

// Color constants
// const INNER_COLOR: vec3f = vec3f(1.0, 0.8, 0.5) * 3.0;
const INNER_COLOR: vec3f = vec3f(1.0, 0.75, 0.35) * 5.0;
const OUTER_COLOR: vec3f = vec3f(0.3, 0.1, 0.0);
const BACKGROUND_COLOR: vec3f = vec3f(0.0, 0.0, 0.0);

// physic funtions
// Derivative for the geodesic ODE: d/dphi [u, du/dphi, phi]
// phi is the angle of the light. 
fn derivative(state: vec3f) -> vec3f {
    let y1 = state.x;  // u = 1/distance
    let y2 = state.y;  // du/dphi
    
    return vec3f(
        y2,
        // einstein formula: d2u/dphi = rs* u^2 - u
        SCHWARZSCHILD_RADIUS * 3.0 / 2.0 * y1 * y1 - y1,
        1.0
    );
}

// RK4 integrator
fn next_state_calc(state: vec3f, step_size: f32) -> vec3f {
    let k1 = derivative(state);
    let k2 = derivative(state + step_size / 2.0 * k1);
    let k3 = derivative(state + step_size / 2.0 * k2);
    let k4 = derivative(state + step_size * k3);
    return state + step_size / 6.0 * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

// RK2 integrator
// fn next_state_calc_fast(state: vec3f, step_size: f32) -> vec3f {
//     let k1 = derivative(state);
//     let k2 = derivative(state + step_size * 0.5 * k1);
//     return state + step_size * k2;
// }


// Initial conditions calculation - convert 3D ray to 2D orbital plane
struct InitialConditions {
    x: vec3f,
    y: vec3f,
    z: vec3f,
    initial_state: vec3f,
}

fn initial_conditions_calc(origin: vec3f, direction: vec3f) -> InitialConditions {
    let x_axis = normalize(direction);
    var z_axis = cross(direction, origin);
    let z_len = length(z_axis);
    
    // Handle edge case where direction is parallel to origin
    if (z_len < 1e-10) {
        // Pick an arbitrary perpendicular vector
        if (abs(direction.x) < 0.9) {
            z_axis = normalize(cross(direction, vec3f(1.0, 0.0, 0.0)));
        } else {
            z_axis = normalize(cross(direction, vec3f(0.0, 1.0, 0.0)));
        }
    } else {
        z_axis = z_axis / z_len;
    }
    
    let y_axis = cross(z_axis, x_axis);
    
    let _x = dot(x_axis, origin);
    let _y = dot(y_axis, origin);
    let phi_0 = atan2(_y, _x);
    let r_0 = length(origin);
    let u_0 = 1.0 / r_0;
    
    // p: ray's velocity along the x axis, q: ray's velocity along the y axis
    let p = dot(x_axis, direction);
    let q = dot(y_axis, direction);
    // r: radial velocity, t: tangential velocity
    // R: how fast the ray is moving toward blackhole
    // T: how fast the ray is moving sideway
    let R = (p * _x + q * _y) / r_0;
    let T = (q * _x - p * _y) / r_0;
    
    let initial_state = vec3f(
        u_0,
        -R / r_0 / T,
        phi_0
    );
    
    var ic: InitialConditions;
    ic.x = x_axis;
    ic.y = y_axis;
    ic.z = z_axis;
    ic.initial_state = initial_state;
    return ic;
}

// Get 3D position from state
fn get_position(state: vec3f, ic: InitialConditions) -> vec3f {
    let r = 1.0 / state.x;
    let angle = state.z;
    return r * cos(angle) * ic.x + r * sin(angle) * ic.y;
}

// Get hit point on universe boundary
fn get_hitpoint_on_universe_boundary(p: vec3f, next_p: vec3f) -> vec3f {
    let d = next_p - p;
    let d_l_sq = dot(d, d);
    let b = dot(p, d) / d_l_sq;
    let c = (dot(p, p) - UNIVERSE_RADIUS * UNIVERSE_RADIUS) / d_l_sq;
    let disc = b * b - c;
    let t = sqrt(max(0.0, disc)) - b;
    return p + t * d;
}

// Convert position to lat/long for star map sampling
fn get_lat_long_from_xyz(p: vec3f) -> vec2f {
    let r = length(p);
    let latitude = asin(p.z / r);
    let longitude = atan2(p.y, p.x);
    return vec2f(latitude, longitude);
}

// Disk info structure
struct DiskInfo {
    inside: bool,
    thickness: f32,
    l: f32,
}

fn cal_t(l: f32) -> f32 {
    return (l - ACCRETION_DISK_INNER_RADIUS) / (ACCRETION_DISK_OUTER_RADIUS - ACCRETION_DISK_INNER_RADIUS);
}

// Check if point is inside accretion disk
fn check_inside_disk(p: vec3f) -> DiskInfo {
    var info: DiskInfo;
    let x = p.x;
    let y = p.y;
    let z = p.z;
    let l = sqrt(x * x + z * z);
    info.l = l;
    
    if (ACCRETION_DISK_INNER_RADIUS < l && l < ACCRETION_DISK_OUTER_RADIUS) {
        let t = cal_t(l);
        let thickness = mix(ACCRETION_DISK_INNER_THICKNESS, ACCRETION_DISK_OUTER_THICKNESS, t);
        info.thickness = thickness;
        info.inside = (-thickness / 2.0 < y && y < thickness / 2.0);
        return info;
    }
    
    info.inside = false;
    return info;
}


// Vertical density dependence (Gaussian)
fn vertical_dependance(y: f32, thickness: f32) -> f32 {
    return exp(-y * y / thickness / thickness / 2.0);
}

// Radial density dependence
fn radial_dependance(l: f32) -> f32 {
    let t = cal_t(l);
    return (1.0 / l / sqrt(l)) * (1.0 - sqrt(ACCRETION_DISK_INNER_RADIUS / l)) * (1.0 - t);
}

// Sample procedural noise for disk
fn sample_disk_noise(p: vec3f, disk_info: DiskInfo, time: f32) -> f32 {
    let angle = atan2(p.z, p.x);
    let omega = OMEGA_CONSTANT / sqrt(disk_info.l * disk_info.l * disk_info.l);
    
    // Create tileable noise coordinates
    let noise_angle = angle + time * omega;
    let radial_t = cal_t(disk_info.l);
    let vertical_t = (p.y + disk_info.thickness / 2.0) / disk_info.thickness;
    
    // Map angular position -> U,  radial position -> V
    let u = fract(noise_angle / (2.0 * PI));
    let v = clamp(radial_t, 0.0, 1.0);

    var noise_val = textureSampleLevel(noise_texture, noise_sampler, vec2f(u, v), 0.0).r;
    noise_val = noise_val * noise_val; // keep the same contrast boost
    return noise_val;
}

fn crosses_disk_plane(p: vec3f, next_p: vec3f) -> bool {
    // Check if the segment crosses y=0
    if (p.y * next_p.y > 0.0) {
        return false; // same side — no crossing
    }
    // Interpolate to find crossing point's radial distance
    let t = p.y / (p.y - next_p.y);
    let cross_point = p + t * (next_p - p);
    let l = sqrt(cross_point.x * cross_point.x + cross_point.z * cross_point.z);
    return ACCRETION_DISK_INNER_RADIUS < l && l < ACCRETION_DISK_OUTER_RADIUS;
}

// // Main Ray Trajectory Function
fn ray_trajectory(origin: vec3f, direction: vec3f, time: f32, disk_density_modulator: f32) -> vec3f {
    let ic = initial_conditions_calc(origin, direction);
    
    var step_size: f32 = 1.0 / 20.0;
    let march_step_size: f32 = 1e-2;
    // state: {u, du/dphi, phi} - think of it as {distance, how fast distance change with angle, angle}
    var state = ic.initial_state;
    var position = get_position(state, ic);
    
    var color = vec3f(0.0, 0.0, 0.0);
    var transmission = vec3f(1.0, 1.0, 1.0);
    
    let NUMBER_OF_STEPS = 300;
    let CONST_STEP_SIZE = 0.025;

    for (var i = 0; i < NUMBER_OF_STEPS; i++) {
        // Adaptive step size
        step_size = min(max(CONST_STEP_SIZE / (0.2 * abs(state.z - PI)), CONST_STEP_SIZE), 1.0 / 20.0);
        
        let next_state = next_state_calc(state, -step_size);
        let next_position = get_position(next_state, ic);
        
        // Determine number of substeps for volumetric rendering
        var num_steps: i32 = 1;
        let pos_in_disk = check_inside_disk(position);
        let next_pos_in_disk = check_inside_disk(next_position);

        if (pos_in_disk.inside || next_pos_in_disk.inside || crosses_disk_plane(position, next_position)) {
            let step_len = length(next_position - position);
            num_steps = clamp(i32(step_len / march_step_size), 1, 8); 
        }
        
        let increment = (next_position - position) / f32(num_steps);
        let increment_length = length(increment);
        var _p = position;
        
        for (var j = 1; j <= num_steps; j++) {
            let _next_p = position + f32(j) * increment;
            
            // Check event horizon
            if (length(_next_p) < SCHWARZSCHILD_RADIUS) {
                return color + BACKGROUND_COLOR * transmission;
            }
            
            // Check universe boundary - sample star map
            if (length(_p) < UNIVERSE_RADIUS && length(_next_p) > UNIVERSE_RADIUS) {
                let pos_on_universe = get_hitpoint_on_universe_boundary(_p, _next_p);
                let latlong = get_lat_long_from_xyz(pos_on_universe);
                
                var star_color = BACKGROUND_COLOR;
                if (uniforms.has_stars_texture == 1u) {
                    let u = (latlong.y + PI) / (2.0 * PI);
                    let v = (latlong.x + PI / 2.0) / PI;
                    star_color = textureSampleLevel(stars_texture, stars_sampler, vec2f(u, 1.0 - v), 0.0).rgb;
                }
                
                return color + star_color * transmission;
            }
            
            // Volumetric disk rendering
            let disk_info = check_inside_disk(_next_p);
            if (disk_info.inside) {
                let noise_val = sample_disk_noise(_next_p, disk_info, time);
                
                let density = noise_val 
                    * vertical_dependance(_next_p.y, disk_info.thickness / 10.0) 
                    * radial_dependance(disk_info.l) 
                    * 5000.0 
                    * disk_density_modulator;
                
                let color_t = clamp(
                    cal_t(disk_info.l),
                    0.0,
                    1.0
                );

                // Keep the hot color concentrated near the inside
                let inner_t = 1.0 - color_t;
                let inner_glow = 1.0 + 8.0 * pow(inner_t, 3.0);

                // Brighter emission near the black hole
                let luminosity = 1.0 / disk_info.l * 5.0 * inner_glow;

                // Bias color interpolation so the warm inner color lasts longer
                let disk_color = mix(INNER_COLOR, OUTER_COLOR, pow(color_t, 1.8));

                color += transmission * density * luminosity * disk_color * increment_length;
                transmission *= exp(-vec3f(density * increment_length));
            }
            
            _p = _next_p;
        }
        
        state = next_state;
        position = next_position;
    }
    
    return color + BACKGROUND_COLOR * transmission;
}

// Uniforms
struct Uniforms {
    camera_position: vec3f,
    time: f32,
    pixel00_position: vec3f,
    has_stars_texture: u32,
    delta_w: vec3f,
    image_width: u32,
    delta_h: vec3f,
    image_height: u32,
    disk_density_modulator: f32,
    _padding: vec4f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var stars_texture: texture_2d<f32>;
@group(0) @binding(2) var stars_sampler: sampler;
@group(0) @binding(3) var noise_texture: texture_2d<f32>;
@group(0) @binding(4) var noise_sampler: sampler;

struct VertexOutput {
    @builtin(position) pos:  vec4f,
    @location(0)       uv:   vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOutput {
    // Triangle that covers the entire clip space
    var positions = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f( 3.0, -1.0),
        vec2f(-1.0,  3.0),
    );
    let p = positions[vi];
    var out: VertexOutput;
    out.pos = vec4f(p, 0.0, 1.0);
    out.uv  = p * 0.5 + 0.5;   // [0,1] range, y is flipped vs texture coords
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {

    let frag = in.pos.xy;                 // gl_FragCoord equivalent
    let px   = frag.x;
    let py   = frag.y;

    let pixel_pos = uniforms.pixel00_position
        + px * uniforms.delta_w
        + py * uniforms.delta_h;
    
    let ray_direction = normalize(pixel_pos - uniforms.camera_position);
    
    // Trace ray
    let color = ray_trajectory(
        pixel_pos, 
        ray_direction, 
        uniforms.time, 
        uniforms.disk_density_modulator
    );
    
    // Tone mapping and gamma correction
    let mapped = color / (color + vec3f(1.0));
    let gamma_corrected = pow(mapped, vec3f(1.0 / 2.2));
    
    return vec4f(gamma_corrected, 1.0);
}`;
