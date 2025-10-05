#version 330 core
out vec4 FragColor;
 
uniform float time;
uniform int width;
uniform int height;

#define MAX_STEP 100
#define MAX_DISTANCE 100.0f

//kolory obiektów wymagaj¹ id?

//TODO pozycja kamery
//TODO dodanie cieni
//TODO ³¹czenie kolorów
//TODO kopioawnie obektów w nieskoñczonoœæ
//TODO softshadows https://iquilezles.org/articles/rmshadows/	

float smoothmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float r)
{
	return length(p) - r;
}


float sdLink( vec3 p, float le, float r1, float r2 )
{
  p = vec3(-p.y, p.x, p.z); //rotation
  vec3 q = vec3( p.x, max(abs(p.y)-le,0.0), p.z );
  return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

float scene(vec3 p)
{
	vec3 n = vec3(0, 1, 0);
	float plane = dot(p, n) + 1.0f; //to samo jak p.y z obecnym n (0,1,0)
	//float plane = p.y + 2.0f;
	float sphere1 = sdLink(p + vec3(-cos(time*0.3)*2.0f, -1.0f, 0.0f), 1.0f, 1.0f, 0.5f);
	float sphere2 = sdSphere(p - vec3(cos(time*0.3)*2.0f + 1.0f, 1.0f, 0.0f), 1.5f);
	return min(smoothmin(sphere1, sphere2, 1.0f), plane);
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
	vec3 ligthDir = vec3(2.0f, -2.0f, -2.0f);
	vec2 uv = (2.0 * gl_FragCoord.xy - vec2(width, height)) / height;
	vec3 camPos = vec3(0.0, 0.0, 5.0);
	vec3 rayDir = normalize(vec3(uv, -1.0));
	float rayDistance = 0.0f;
	float radius = 2.0f;
	vec3 color = vec3(0.0f);

	//ligthDir.x *= cos(time);
	//ligthDir.y *= sin(time);
	//ligthDir.z *= sin(time * 0.5);
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
			color = vec3(1.0f, 0.0f, 1.0f) * ligthIntensity;
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