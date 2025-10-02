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

float sdSphere(vec3 p, float r)
{
	return length(p) - r;
}

float scene(vec3 p)
{
	float sphere1 = sdSphere(p, 1.0f);
	float sphere2 = sdSphere(p - vec3(cos(time*0.3)*2.0f, 0.0f, -2.0f), 1.5f);
	return min(sphere1, sphere2);
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
	vec3 ligthDir = vec3(1.0f, 1.0f, 1.0f);
	vec2 uv = (2.0 * gl_FragCoord.xy - vec2(width, height)) / height;
	vec3 camPos = vec3(0.0, 0.0, 5.0);
	vec3 rayDir = normalize(vec3(uv, -1.0));
	float rayDistance = 0.0f;
	float radius = 2.0f;
	vec3 color = vec3(0.0f);

	ligthDir.x *= cos(time);
	ligthDir.y *= sin(time);
	ligthDir.z *= sin(time * 0.5);
	normalize(ligthDir);

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