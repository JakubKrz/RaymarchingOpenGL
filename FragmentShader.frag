#version 330 core
out vec4 FragColor;
 
uniform float time;
uniform int width;
uniform int height;
uniform mat4 invView;
uniform mat4 invProjection;

#define MAX_STEP 300
#define MAX_DISTANCE 200.0f
#define INF 999999999

//kolory obiektów wymagaj¹ id?

//TODO poprawne dodanie oœwietlenia (ambient+specular)
//TODO ³¹czenie kolorów
//TODO antialiasing
//TODO noise
//TODO shell texturing?
//TODO add rotatationX/Y/Z chceck for better way to rotate quaternions?
//TODO add physical representation of ligth source
//TODO add ImGUI to change scene?
//TODO modify softShodow, add more input params
//TODO softshadows https://iquilezles.org/articles/rmshadows/	


struct Result {
	float distance;
	vec3 color;
};

Result unionResult(Result a, Result b) {
    return (a.distance < b.distance) ? a : b;
}

Result smoothUnionResult(Result resA, Result resB, float k)
{
    float a = resA.distance;
    float b = resB.distance;

    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    float dist = mix(b, a, h) - k * h * (1.0 - h);
    vec3 color = mix(resB.color, resA.color, h);

    return Result(dist, color);
}

float smoothmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float r){
	return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCross( in vec3 p ) {
  float da = sdBox(p.xyz,vec3(INF,1.0,1.0));
  float db = sdBox(p.yzx,vec3(1.0,INF,1.0));
  float dc = sdBox(p.zxy,vec3(1.0,1.0,INF));
  return min(da,min(db,dc));
}

float sdLink( vec3 p, float le, float r1, float r2 ){
  p = vec3(-p.y, p.x, p.z); //rotation
  p = vec3(p.x, p.z, -p.y); //rotation
  vec3 q = vec3( p.x, max(abs(p.y)-le,0.0), p.z );
  return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

float sdSine(vec3 p) {
	return 1.0f - (sin(p.x) + sin(p.y) + sin(p.z))/3.0f;
}

mat3 rotationMatrix(vec3 axis, float angle){
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

vec3 rotate(vec3 p, vec3 axis, float angle) {
    return rotationMatrix(axis, angle) * p;
}

vec3 repeat(vec3 p, float c) {
    return mod(p,c) - 0.5 * c;
}

Result scene(vec3 p)
{
	//vec3 p1 = repeat(p, 10.0f);
	float plane = p.y + 1.0f;
	Result planeRes = Result(plane, vec3(0.0f, 0.4f, 0.0f));

	float link = sdLink(p + vec3(-cos(time*0.1)*2.0f, -1.0f, 0.0f), 1.0f, 1.0f, 0.5f);
	Result linkRes = Result(link, vec3(0.8f, 0.0f, 0.0f));

	float sphere = sdSphere(p - vec3(cos(time*0.3)*2.0f + 1.0f, 1.0f, 0.0f), 1.5f);
	Result sphereRes = Result(sphere, vec3(0.3f, 0.2f, 0.7f));

	Result currentRes = smoothUnionResult(sphereRes, linkRes, 2.0f);
	return unionResult(currentRes, planeRes);
}

vec3 getColor(float amount) {
  vec3 color = vec3(0.3, 0.5, 0.9) +vec3(0.9, 0.4, 0.2) * cos(6.2831 * (vec3(0.30, 0.20, 0.20) + amount * vec3(1.0)));
  return color * amount;
}

float softShadows(vec3 p, vec3 ligthDir)
{
	float res = 1.0f;
	float curStep = 0.1;
	for(int i=0; i<200; i++)
	{
		Result closestObj = scene(p + ligthDir * curStep);
		float h = closestObj.distance;
		if(h<0.01)
		{
			return 0.0;
		}
		res = min(res, 32.0f * h/curStep);
		curStep+=h;
	}
	return res;
}

vec3 calculateNormal(vec3 p)
{
	vec2 epsilon = vec2(0.01, 0.0);

	vec3 normal = vec3(
        scene(p + epsilon.xyy).distance - scene(p - epsilon.xyy).distance,
        scene(p + epsilon.yxy).distance - scene(p - epsilon.yxy).distance,
        scene(p + epsilon.yyx).distance - scene(p - epsilon.yyx).distance
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

	ligthDir.x *= cos(time*0.1f);
	//ligthDir.y *=  sin(time);
	ligthDir.z *= sin(time * 0.1);
	ligthDir = normalize(ligthDir);

	for(int i=0; i<MAX_STEP; ++i)
	{
		vec3 p = camPos + rayDistance * rayDir;
		Result closestObj = scene(p);
		float distToSphere = closestObj.distance;

		if(distToSphere < 0.0001)
		{
			float depth = rayDistance - 3.5f;
			vec3 normal = calculateNormal(p);
			float ligthIntensity = max(dot(normal, (-ligthDir)), 0.0f);
			//color = getColor(ligthIntensity);
			color = closestObj.color * ligthIntensity + closestObj.color*0.1f;
			//color = vec3(1.0f, 0.0f, 1.0f) * float(i)/MAX_STEP;  //outlines cool efect
			float shadowMult = softShadows(p, -ligthDir);
			color = mix(vec3(0.0f, 0.0f, 0.0f), color, shadowMult);
			break;
		}
		if(rayDistance > MAX_DISTANCE)
		{
			break;
		}
		
		rayDistance += distToSphere;
	}
	float fogFactor = rayDistance/50.0f;
	fogFactor = log(fogFactor);
	fogFactor = clamp(fogFactor, 0.0f, 1.0f);
	//vec3 fogColor = vec3(0.6f, 0.5f, 0.8f);
	vec3 fogColor = vec3(0.3f, 0.3f, 0.5f);
	vec3 finalColor = mix(color, fogColor, fogFactor);
	FragColor = vec4(finalColor, 1.0);
}