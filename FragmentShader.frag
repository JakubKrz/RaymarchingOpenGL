#version 330 core
out vec4 FragColor;
 
uniform float time;
uniform int width;
uniform int height;
uniform mat4 invView;
uniform mat4 invProjection;

#define MAX_STEP 200
#define MAX_DISTANCE 300.0f

//kolory obiektów wymagaj¹ id?

//TODO dodanie cieni
//TODO ³¹czenie kolorów
//TODO kopioawnie obektów w nieskoñczonoœæ
//TODO softshadows https://iquilezles.org/articles/rmshadows/	
//TODO noise
//TODO add rotatationX/Y/Z chceck for better way to rotate quaternions?

float smoothmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float r)
{
	return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}


float sdLink( vec3 p, float le, float r1, float r2 )
{
  p = vec3(-p.y, p.x, p.z); //rotation
  p = vec3(p.x, p.z, -p.y); //rotation
  vec3 q = vec3( p.x, max(abs(p.y)-le,0.0), p.z );
  return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}

vec3 rotate(vec3 p, vec3 axis, float angle)
{
    return rotationMatrix(axis, angle) * p;
}

vec3 repeat(vec3 p, float c) {
    return mod(p,c) - 0.5 * c;
}

float scene(vec3 p)
{
	vec3 n = vec3(0, 1, 0);
	float plane = dot(p, n) + 1.0f; //to samo jak p.y z obecnym n (0,1,0)
	
	//vec3 p1 = rotate(p, vec3(0.0f, 1.0f, 0.0f), 3.141 * time);
	//p1 *= 0.5f; //scaling
	//float link = sdLink(p1 - vec3(0.0f, 1.0f, 0.0f), 1.5f, 1.5f, 0.5f) * 2.0f;// *2 - scaling
	vec3 inf = repeat(p, 8.0f);
	float sphere2 = sdSphere(inf, 1.0f);
	float box = sdBox(inf, vec3(0.8f, 0.8f, 0.8f));
	return min(max(box, sphere2), plane);
}

vec3 calculateNormal(vec3 p)
{
	vec2 epsilon = vec2(0.01, 0.0);

	vec3 normal = vec3(
        scene(p + epsilon.xyy) - scene(p - epsilon.xyy),
        scene(p + epsilon.yxy) - scene(p - epsilon.yxy),
        scene(p + epsilon.yyx) - scene(p - epsilon.yyx)
    );
	return normalize(normal);
}

void main()
{
	vec3 ligthDir = vec3(5.0f, -2.0f, -2.0f);
	vec2 uv = (2.0 * gl_FragCoord.xy - vec2(width, height)) / height;
	vec3 camPos = vec3(invView[3]);
	vec4 target = invProjection * vec4(uv, -1.0, 1.0);
    target /= target.w;
	vec3 rayDir = normalize(mat3(invView) * target.xyz);
	float rayDistance = 0.0f;
	float radius = 2.0f;
	vec3 color = vec3(0.0f);

	ligthDir.x *= cos(time*0.5f);
	//ligthDir.y *=  sin(time);
	//ligthDir.z *= 0.5f*sin(time);
	ligthDir = normalize(ligthDir);

	for(int i=0; i<MAX_STEP; ++i)
	{
		vec3 p = camPos + rayDistance * rayDir;
		float distToSphere = scene(p);
		if(distToSphere < 0.01)
		{
			float depth = rayDistance - 3.5f;
			vec3 normal = calculateNormal(p);
			float ligthIntensity = max(dot(normal, (-ligthDir)), 0.0f);
			color = vec3(1.0f, 0.0f, 1.0f) * ligthIntensity + vec3(1.0f, 0.0f, 1.0f)*0.2;
			//color = vec3(1.0f, 0.0f, 1.0f) * float(i)/MAX_STEP;
			break;
		}
		if(rayDistance > MAX_DISTANCE)
		{
			break;
		}
		
		rayDistance += distToSphere;
	}

	FragColor = vec4(color, 1.0);
}