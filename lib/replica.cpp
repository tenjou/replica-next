#define _USE_MATH_DEFINES
#define NOMINMAX

#include <iostream>
#include <string>
#include <cmath>
#include <algorithm>
#include <vector>
#include <windows.h>
#include <gl/gl.h>
#include <gl/glu.h>

struct console {
	static auto log(std::string text) {
		std::cout << text << std::endl;
	}

	static auto error(std::string error) {
		std::cout << "Error: " << error << std::endl;
	}
};

struct Math {
	static double min(double a, double b) {
		return std::min(a, b);
	}

	static double max(double a, double b) {
		return std::max(a, b);
	}

	static const double PI;
};

const double Math::PI = M_PI;

template<class T>
struct Array {
	T* buffer;
	unsigned int length;

	Array(std::initializer_list<T> list) {
		this->length = list.size();
		this->buffer = new T[this->length];
		int count = 0;
		for(auto &element : list) {
			this->buffer[count] = element;
			++count;
		}
	}

	T operator[](unsigned int index) {
		return (index > length) ? 0 : this->buffer[index];
	}
};

struct Float32Array {
	float* buffer;
	int length;

	Float32Array() {
		this->buffer = nullptr;
		this->length = 0;
	}

	Float32Array(unsigned int size) {
		this->buffer = new float[size];
		this->length = size;
	}

	Float32Array(Array<double> src) {
		this->buffer = new float[src.length];
		for(unsigned int n = 0; n < src.length; n++) {
			this->buffer[n] = static_cast<float>(src.buffer[n]);
		}
	}

	float& $subscript(unsigned int index) {
		return this->buffer[index];
	}
};

struct WebGLProgram {

};

struct WebGLBuffer {

};

struct WebGLShader {

};

struct WebGLRenderingContext {
	auto clearColor(float red, float green, float blue, float alpha) {

	}

	auto clearDepth(float depth) {

	}

	auto enable(int cap) {

	}

	auto depthFunc(int func) {

	}

	auto clear(int mask) {

	}

	auto viewport(int x, int y, int width, int height) {

	}

	auto createProgram() {
		return new WebGLProgram();
	}

	auto attachShader(WebGLProgram* program, WebGLShader* shader) {

	}

	auto linkProgram(WebGLProgram* program) {

	}

	auto useProgram(WebGLProgram* program) {

	}

	double getAttribLocation(WebGLProgram* program, std::string name) {
		return 0;
	}

	double getUniformLocation(WebGLProgram* program, std::string name) {
		return 0;
	}

	auto createShader(double type) {
		return new WebGLShader();
	}

	auto deleteShader(WebGLShader* shader) {

	}

	auto shaderSource(WebGLShader* shader, std::string source) {

	}

	auto compileShader(WebGLShader* shader) {

	}

	auto getShaderParameter(WebGLShader* shader, int pname) {
		return nullptr;
	}

	auto getShaderInfoLog(WebGLShader* shader) {
		return std::string("");
	}

	auto createBuffer() {
		return new WebGLBuffer();
	}

	auto bindBuffer(int target, WebGLBuffer* buffer) {

	}

	auto bufferData(int target, Float32Array* srcData, int usage) {

	}

	auto vertexAttribPointer(double index, double size, int type, bool normalized, double stride, double offset) {

	}

	auto enableVertexAttribArray(double index) {

	}

	auto uniformMatrix4fv(double location, bool transpose, Float32Array *buffer) {

	}

	auto drawArrays(int mode, int first, int count) {

	}

	static const int TRIANGLE_STRIP;
	static const int FLOAT;
	static const int DEPTH_TEST;
	static const int LEQUAL;
	static const int COLOR_BUFFER_BIT;
	static const int DEPTH_BUFFER_BIT;
	static const int VERTEX_SHADER;
	static const int FRAGMENT_SHADER;
	static const int COMPILE_STATUS;
	static const int ARRAY_BUFFER;
	static const int STATIC_DRAW;
};

const int WebGLRenderingContext::TRIANGLE_STRIP = GL_TRIANGLE_STRIP;
const int WebGLRenderingContext::FLOAT = GL_FLOAT;
const int WebGLRenderingContext::DEPTH_TEST = GL_DEPTH_TEST;
const int WebGLRenderingContext::LEQUAL = GL_LEQUAL;
const int WebGLRenderingContext::COLOR_BUFFER_BIT = GL_COLOR_BUFFER_BIT;
const int WebGLRenderingContext::DEPTH_BUFFER_BIT = GL_DEPTH_BUFFER_BIT;
const int WebGLRenderingContext::VERTEX_SHADER = 0;
const int WebGLRenderingContext::FRAGMENT_SHADER = 0;
const int WebGLRenderingContext::COMPILE_STATUS = 0;
const int WebGLRenderingContext::ARRAY_BUFFER = 0;
const int WebGLRenderingContext::STATIC_DRAW = 0;

struct HTMLCanvasElement {
	int clientWidth = 0;
	int clientHeight = 0;

	auto getContext(std::string contextType) {
		return new WebGLRenderingContext();
	}
};

struct Document {
	auto createElement(std::string elementType) {
		return new HTMLCanvasElement();
	}
};

const auto document = new Document();

static void requestAnimationFrame(void (*func)()) {

}
