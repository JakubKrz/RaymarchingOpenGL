#version 330 core
out vec4 FragColor;
 
uniform float time;
uniform int width;
uniform int height;


//TODO raymarching
//TODO pozycja kamery
//TODO obliczanie normlanych za pomoca symetrycznego gradientu
//TODO dodanie cieni
//TODO ³¹czenie kolorów
//TODO kopioawnie obektów w nieskoñczonoœæ

float sdSphere(vec3 p, float r)
{
	return length(p) - r;
}

void main()
{
	float var = sin(time);
	vec2 uv = (2.0 * gl_FragCoord.xy - vec2(width, height)) / float(height);
	vec3 camPos = vec3(0.0, 0.0, 5.0);
	vec3 rayDir = normalize(vec3(uv, -1.0));
	float rayDistance = 0.0f;
	vec3 color = vec3(0.0f);
	for(int i=0; i<50; ++i)
	{
		vec3 p = camPos + rayDistance * rayDir;
		float dist = sdSphere(p, 2.0f);

		if(dist < 0.01)
		{
			float depth = 1.0 - smoothstep(1.0f, 5.0f, rayDistance);
			color = vec3(1.0f, 0.0f, 1.0f) * depth; 
			//color = vec3(1.0f, 0.0f, 1.0f);	
		}

		if(rayDistance > 100.0f)
		{
			break;
		}

		rayDistance += dist;
	}
	FragColor = vec4(color, 1.0);
}