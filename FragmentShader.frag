#version 330 core
out vec4 FragColor;
 
uniform float time;
uniform int width;
uniform int height;


//TODO raymarching
//TODO pozycja kamery
void main()
{
	float var = sin(time);
	FragColor = vec4(0.0 * var, width/800.f, height/600.f, 1.0);
}