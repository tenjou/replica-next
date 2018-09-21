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
#include <stdio.h>

#pragma comment (lib, "opengl32.lib")
#pragma warning(push) 
#pragma warning(disable:4244)

typedef ptrdiff_t GLsizeiptr;
typedef ptrdiff_t GLintptr;
typedef char GLchar;

#ifndef APIENTRYP
#define APIENTRYP APIENTRY *
#endif

#define GL_TEXTURE_CUBE_MAP               0x8513
#define GL_TEXTURE_CUBE_MAP_POSITIVE_X    0x8515
#define GL_TEXTURE_CUBE_MAP_NEGATIVE_X    0x8516
#define GL_TEXTURE_CUBE_MAP_POSITIVE_Y    0x8517
#define GL_TEXTURE_CUBE_MAP_NEGATIVE_Y    0x8518
#define GL_TEXTURE_CUBE_MAP_POSITIVE_Z    0x8519
#define GL_TEXTURE_CUBE_MAP_NEGATIVE_Z    0x851A
#define GL_ARRAY_BUFFER                   0x8892
#define GL_STATIC_DRAW                    0x88E4
#define GL_DYNAMIC_DRAW                   0x88E8
#define GL_UNIFORM_BUFFER                 0x8A11
#define GL_FRAGMENT_SHADER                0x8B30
#define GL_VERTEX_SHADER                  0x8B31
#define GL_COMPILE_STATUS                 0x8B81
#define GL_LINK_STATUS                    0x8B82
#define GL_VALIDATE_STATUS                0x8B83
#define GL_INFO_LOG_LENGTH                0x8B84
#define GL_INVALID_INDEX                  0xFFFFFFFFu

void _GLCheck_Succeeded(const char* code, int line) {
	auto err = glGetError();
	if(err != GL_NO_ERROR) {
		fprintf(stderr, "GL call failed (error=%X, line %d): %s\n", err, line, code);
		exit(1);
	}
}
#define GLCHK(x) x;_GLCheck_Succeeded(#x, __LINE__)

typedef void (APIENTRYP PFNGLVERTEXATTRIBPOINTERPROC) (GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer);
typedef void (APIENTRYP PFNGLENABLEVERTEXATTRIBARRAYPROC) (GLuint index);
typedef void (APIENTRYP PFNGLBINDBUFFERPROC) (GLenum target, GLuint buffer);
typedef void (APIENTRYP PFNGLDELETEBUFFERSPROC) (GLsizei n, const GLuint *buffers);
typedef void (APIENTRYP PFNGLGENBUFFERSPROC) (GLsizei n, GLuint *buffers);
typedef void (APIENTRYP PFNGLBUFFERDATAPROC) (GLenum target, GLsizeiptr size, const void *data, GLenum usage);
typedef void (APIENTRYP PFNGLBUFFERSUBDATAPROC) (GLenum target, GLintptr offset, GLsizeiptr size, const void *data);
typedef void (APIENTRYP PFNGLATTACHSHADERPROC) (GLuint program, GLuint shader);
typedef void (APIENTRYP PFNGLCOMPILESHADERPROC) (GLuint shader);
typedef GLuint (APIENTRYP PFNGLCREATEPROGRAMPROC) (void);
typedef GLuint (APIENTRYP PFNGLCREATESHADERPROC) (GLenum type);
typedef void (APIENTRYP PFNGLDELETEPROGRAMPROC) (GLuint program);
typedef void (APIENTRYP PFNGLDELETESHADERPROC) (GLuint shader);
typedef void (APIENTRYP PFNGLDETACHSHADERPROC) (GLuint program, GLuint shader);
typedef void (APIENTRYP PFNGLGETPROGRAMIVPROC) (GLuint program, GLenum pname, GLint *params);
typedef void (APIENTRYP PFNGLGETPROGRAMINFOLOGPROC) (GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
typedef void (APIENTRYP PFNGLGETSHADERIVPROC) (GLuint shader, GLenum pname, GLint *params);
typedef void (APIENTRYP PFNGLGETSHADERINFOLOGPROC) (GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
typedef GLint (APIENTRYP PFNGLGETUNIFORMLOCATIONPROC) (GLuint program, const GLchar *name);
typedef void (APIENTRYP PFNGLLINKPROGRAMPROC) (GLuint program);
typedef void (APIENTRYP PFNGLSHADERSOURCEPROC) (GLuint shader, GLsizei count, const GLchar *const*string, const GLint *length);
typedef void (APIENTRYP PFNGLUSEPROGRAMPROC) (GLuint program);
typedef void (APIENTRYP PFNGLUNIFORM2FPROC) (GLint location, GLfloat v0, GLfloat v1);
typedef void (APIENTRYP PFNGLUNIFORM1IPROC) (GLint location, GLint v0);
typedef void (APIENTRYP PFNGLUNIFORMMATRIX2FVPROC) (GLint location, GLsizei count, GLboolean transpose, const GLfloat *value);
typedef void (APIENTRYP PFNGLUNIFORMMATRIX4FVPROC) (GLint location, GLsizei count, GLboolean transpose, const GLfloat *value);
typedef void (APIENTRYP PFNGLVALIDATEPROGRAMPROC) (GLuint program);
typedef GLint (APIENTRYP PFNGLGETATTRIBLOCATIONPROC) (GLuint program, const GLchar* name);
typedef void (APIENTRYP PFNGLBINDFRAGDATALOCATIONPROC) (GLuint program, GLuint color, const GLchar *name);
typedef void (APIENTRYP PFNGLBINDVERTEXARRAYPROC) (GLuint array);
typedef void (APIENTRYP PFNGLDELETEVERTEXARRAYSPROC) (GLsizei n, const GLuint *arrays);
typedef void (APIENTRYP PFNGLGENVERTEXARRAYSPROC) (GLsizei n, GLuint *arrays);
typedef GLuint (APIENTRYP PFNGLGETUNIFORMBLOCKINDEXPROC) (GLuint program, const GLchar *uniformBlockName);
typedef void (APIENTRYP PFNGLUNIFORMBLOCKBINDINGPROC) (GLuint program, GLuint uniformBlockIndex, GLuint uniformBlockBinding);
typedef void (APIENTRYP PFNGLBINDBUFFERBASEPROC) (GLenum target, GLuint index, GLuint buffer);

PFNGLVERTEXATTRIBPOINTERPROC glVertexAttribPointer;
PFNGLENABLEVERTEXATTRIBARRAYPROC glEnableVertexAttribArray;
PFNGLBINDBUFFERPROC glBindBuffer;
PFNGLDELETEBUFFERSPROC glDeleteBuffers;
PFNGLGENBUFFERSPROC glGenBuffers;
PFNGLBUFFERDATAPROC glBufferData;
PFNGLBUFFERSUBDATAPROC glBufferSubData;
PFNGLATTACHSHADERPROC glAttachShader;
PFNGLCOMPILESHADERPROC glCompileShader;
PFNGLCREATEPROGRAMPROC glCreateProgram;
PFNGLCREATESHADERPROC glCreateShader;
PFNGLDELETEPROGRAMPROC glDeleteProgram;
PFNGLDELETESHADERPROC glDeleteShader;
PFNGLDETACHSHADERPROC glDetachShader;
PFNGLGETPROGRAMIVPROC glGetProgramiv;
PFNGLGETPROGRAMINFOLOGPROC glGetProgramInfoLog;
PFNGLGETSHADERIVPROC glGetShaderiv;
PFNGLGETSHADERINFOLOGPROC glGetShaderInfoLog;
PFNGLGETUNIFORMLOCATIONPROC glGetUniformLocation;
PFNGLLINKPROGRAMPROC glLinkProgram;
PFNGLSHADERSOURCEPROC glShaderSource;
PFNGLUSEPROGRAMPROC glUseProgram;
PFNGLUNIFORM2FPROC glUniform2f;
PFNGLUNIFORM1IPROC glUniform1i;
PFNGLUNIFORMMATRIX2FVPROC glUniformMatrix2fv;
PFNGLUNIFORMMATRIX4FVPROC glUniformMatrix4fv;
PFNGLVALIDATEPROGRAMPROC glValidateProgram;
PFNGLGETATTRIBLOCATIONPROC glGetAttribLocation;

static HWND hWnd = nullptr;
static HDC hDC = nullptr;
static HGLRC hRC = nullptr;
static void(*requestAnimationFrameFunc)() = nullptr;
static bool started = false;

static void findAndReplace(std::string& source, std::string const& find, std::string const& replace) {
	for(std::string::size_type n = 0; (n = source.find(find, n)) != std::string::npos;) {
		source.replace(n, find.length(), replace);
		n += replace.length();
	}
}

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
	GLfloat* buffer;
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
		this->length = src.length;
		this->buffer = new GLfloat[src.length];
		for(unsigned int n = 0; n < src.length; n++) {
			this->buffer[n] = static_cast<GLfloat>(src.buffer[n]);
		}
	}

	float& $subscript(unsigned int index) {
		return this->buffer[index];
	}
};

struct WebGLProgram {
	GLuint handle = 0;
};

struct WebGLBuffer {
	GLuint handle = 0;
};

struct WebGLShader {
	GLuint handle = 0;
};

struct WebGLRenderingContext {
	WebGLRenderingContext() {
	}

	~WebGLRenderingContext() {
		wglMakeCurrent(NULL, NULL);
		ReleaseDC(hWnd, hDC);
		wglDeleteContext(hRC);
	}

	auto clearColor(float red, float green, float blue, float alpha) {
		GLCHK(glClearColor(red, green, blue, alpha));
	}

	auto clearDepth(float depth) {
		GLCHK(glClearDepth(depth));
	}

	auto enable(int cap) {
		GLCHK(glEnable(cap));
	}

	auto depthFunc(int func) {
		GLCHK(glDepthFunc(func));
	}

	auto clear(int mask) {
		GLCHK(glClear(mask));
	}

	auto viewport(int x, int y, int width, int height) {
		GLCHK(glViewport(x, y, width, height));
	}

	auto createProgram() {
		auto webglProgram = new WebGLProgram();
		webglProgram->handle = glCreateProgram();
		return webglProgram;
	}

	auto attachShader(WebGLProgram* program, WebGLShader* shader) {
		GLCHK(glAttachShader(program->handle, shader->handle));
	}

	auto linkProgram(WebGLProgram* program) {
		GLCHK(glLinkProgram(program->handle));
	}

	auto useProgram(WebGLProgram* program) {
		if(!program) {
			glUseProgram(0);
		}
		else {
			GLCHK(glUseProgram(program->handle));
		}
	}

	double getAttribLocation(WebGLProgram* program, std::string name) {
		auto id = glGetAttribLocation(program->handle, name.c_str());
		return glGetAttribLocation(program->handle, name.c_str());
	}

	double getUniformLocation(WebGLProgram* program, std::string name) {
		return glGetUniformLocation(program->handle, name.c_str());
	}

	auto createShader(double type) {
		auto webglShader = new WebGLShader();
		webglShader->handle = glCreateShader(type);
		return webglShader;
	}

	auto deleteShader(WebGLShader* shader) {
		GLCHK(glDeleteShader(shader->handle));
		shader->handle = 0;
	}

	auto shaderSource(WebGLShader* shader, std::string source) {
		findAndReplace(source, "precision highp float;", "");
		findAndReplace(source, "highp", "");
		const char* shaderSources[] = { source.c_str() };
		GLCHK(glShaderSource(shader->handle, 1, shaderSources, nullptr));
	}

	auto compileShader(WebGLShader* shader) {
		GLCHK(glCompileShader(shader->handle));
	}

	auto getShaderParameter(WebGLShader* shader, int pname) {
		GLint infoLogLength;
		glGetShaderiv(shader->handle, GL_INFO_LOG_LENGTH, &infoLogLength);
		return !(infoLogLength > 0);
	}

	auto getShaderInfoLog(WebGLShader* shader) {
		GLint infoLogLength;
		glGetShaderiv(shader->handle, GL_INFO_LOG_LENGTH, &infoLogLength);
		std::vector<char> v(infoLogLength);
		glGetShaderInfoLog(shader->handle, infoLogLength, nullptr, v.data());
		std::string str(begin(v), end(v));
		return str;
	}

	auto createBuffer() {
		auto webglBuffer = new WebGLBuffer();
		GLCHK(glGenBuffers(1, &webglBuffer->handle));
		return webglBuffer;
	}

	auto bindBuffer(int target, WebGLBuffer* buffer) {
		GLCHK(glBindBuffer(target, buffer->handle));
	}

	auto bufferData(int target, Float32Array* srcData, int usage) {
		GLCHK(glBufferData(target, srcData->length * sizeof(float), srcData->buffer, usage));
	}

	auto vertexAttribPointer(double index, double size, int type, bool normalized, double stride, double offset) {
		GLCHK(glVertexAttribPointer(index, size, type, normalized, size * sizeof(GLfloat), (void*)0));
	}

	auto enableVertexAttribArray(double index) {
		GLCHK(glEnableVertexAttribArray(index));
	}

	auto uniformMatrix4fv(double location, bool transpose, Float32Array *buffer) {
		GLCHK(glUniformMatrix4fv(location, 1, GL_FALSE, buffer->buffer));
	}

	auto drawArrays(int mode, int first, int count) {
		GLCHK(glDrawArrays(mode, first, count));
	}

	static const int TRIANGLES;
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

	private:
};

const int WebGLRenderingContext::TRIANGLES = GL_TRIANGLES;
const int WebGLRenderingContext::TRIANGLE_STRIP = GL_TRIANGLE_STRIP;
const int WebGLRenderingContext::FLOAT = GL_FLOAT;
const int WebGLRenderingContext::DEPTH_TEST = GL_DEPTH_TEST;
const int WebGLRenderingContext::LEQUAL = GL_LEQUAL;
const int WebGLRenderingContext::COLOR_BUFFER_BIT = GL_COLOR_BUFFER_BIT;
const int WebGLRenderingContext::DEPTH_BUFFER_BIT = GL_DEPTH_BUFFER_BIT;
const int WebGLRenderingContext::VERTEX_SHADER = GL_VERTEX_SHADER;
const int WebGLRenderingContext::FRAGMENT_SHADER = GL_FRAGMENT_SHADER;
const int WebGLRenderingContext::COMPILE_STATUS = GL_COMPILE_STATUS;
const int WebGLRenderingContext::ARRAY_BUFFER = GL_ARRAY_BUFFER;
const int WebGLRenderingContext::STATIC_DRAW = GL_STATIC_DRAW;

LONG WINAPI WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
	switch(uMsg) {
		case WM_CLOSE:
			PostQuitMessage(0);
			return 0;
	}

	return DefWindowProc(hWnd, uMsg, wParam, lParam);
}

struct HTMLCanvasElement {
	int clientWidth = 800;
	int clientHeight = 600;

	HTMLCanvasElement() {}

	~HTMLCanvasElement() {
		DestroyWindow(hWnd);
	}

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

static void startMainLoop() {
	started = true;
}

void requestAnimationFrame(void (*func)()) {
	requestAnimationFrameFunc = func;
}

void loadExtensions() {
	*(void**)&glVertexAttribPointer = wglGetProcAddress("glVertexAttribPointer");
	*(void**)&glEnableVertexAttribArray = wglGetProcAddress("glEnableVertexAttribArray");
	*(void**)&glBindBuffer = wglGetProcAddress("glBindBuffer");
	*(void**)&glDeleteBuffers = wglGetProcAddress("glDeleteBuffers");
	*(void**)&glGenBuffers = wglGetProcAddress("glGenBuffers");
	*(void**)&glBufferData = wglGetProcAddress("glBufferData");
	*(void**)&glBufferSubData = wglGetProcAddress("glBufferSubData");
	*(void**)&glAttachShader = wglGetProcAddress("glAttachShader");
	*(void**)&glCompileShader = wglGetProcAddress("glCompileShader");
	*(void**)&glCreateProgram = wglGetProcAddress("glCreateProgram");
	*(void**)&glCreateShader = wglGetProcAddress("glCreateShader");
	*(void**)&glDeleteProgram = wglGetProcAddress("glDeleteProgram");
	*(void**)&glDeleteShader = wglGetProcAddress("glDeleteShader");
	*(void**)&glDetachShader = wglGetProcAddress("glDetachShader");
	*(void**)&glGetProgramiv = wglGetProcAddress("glGetProgramiv");
	*(void**)&glGetProgramInfoLog = wglGetProcAddress("glGetProgramInfoLog");
	*(void**)&glGetShaderiv = wglGetProcAddress("glGetShaderiv");
	*(void**)&glGetShaderInfoLog = wglGetProcAddress("glGetShaderInfoLog");
	*(void**)&glGetUniformLocation = wglGetProcAddress("glGetUniformLocation");
	*(void**)&glLinkProgram = wglGetProcAddress("glLinkProgram");
	*(void**)&glShaderSource = wglGetProcAddress("glShaderSource");
	*(void**)&glUseProgram = wglGetProcAddress("glUseProgram");
	*(void**)&glUniform2f = wglGetProcAddress("glUniform2f");
	*(void**)&glUniform1i = wglGetProcAddress("glUniform1i");
	*(void**)&glUniformMatrix2fv = wglGetProcAddress("glUniformMatrix2fv");
	*(void**)&glUniformMatrix4fv = wglGetProcAddress("glUniformMatrix4fv");
	*(void**)&glValidateProgram = wglGetProcAddress("glValidateProgram");
	*(void**)&glGetAttribLocation = wglGetProcAddress("glGetAttribLocation");
}

void replica_init() {
	HINSTANCE hInstance = GetModuleHandle(nullptr);

	WNDCLASSA wc;
	memset(&wc, 0, sizeof(wc));
	wc.style = CS_OWNDC;
	wc.lpfnWndProc = (WNDPROC)WndProc;
	wc.cbClsExtra = 0;
	wc.cbWndExtra = 0;
	wc.hInstance = hInstance;
	wc.hIcon = LoadIcon(NULL, IDI_WINLOGO);
	wc.hCursor = LoadCursor(NULL, IDC_ARROW);
	wc.hbrBackground = NULL;
	wc.lpszMenuName = NULL;
	wc.lpszClassName = "replica";
	if(!RegisterClass(&wc)) {
		fprintf(stderr, "Failed to register window class");
		exit(1);
	}

	RECT winRect = { 0, 0, 800, 600 };
	AdjustWindowRect(&winRect, WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX | WS_VISIBLE, FALSE);
	hWnd = CreateWindowA("replica", "replica",
		WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX | WS_VISIBLE,
		CW_USEDEFAULT, CW_USEDEFAULT,
		800, 600,
		nullptr, nullptr, hInstance, nullptr);
	if(!hWnd) {
		fprintf(stderr, "Failed to create window");
		exit(1);
	}

	hDC = GetDC(hWnd);

	PIXELFORMATDESCRIPTOR pfd;
	memset(&pfd, 0, sizeof(pfd));
	pfd.nSize = sizeof(pfd);
	pfd.nVersion = 1;
	pfd.dwFlags = PFD_DOUBLEBUFFER | PFD_SUPPORT_OPENGL | PFD_DRAW_TO_WINDOW;
	pfd.iPixelType = PFD_TYPE_RGBA;
	pfd.cColorBits = 32;
	pfd.cDepthBits = 32;
	pfd.iLayerType = PFD_MAIN_PLANE;

	int pf = ChoosePixelFormat(hDC, &pfd);
	if(pf == 0) {
		fprintf(stderr, "Failed to find suitable pixel format.");
		exit(1);
	}

	if(SetPixelFormat(hDC, pf, &pfd) == FALSE) {
		fprintf(stderr, "Failed to set specified pixel format.");
		exit(1);
	}

	DescribePixelFormat(hDC, pf, sizeof(PIXELFORMATDESCRIPTOR), &pfd);

	hRC = wglCreateContext(hDC);
	wglMakeCurrent(hDC, hRC);

	loadExtensions();
}

void replica_start() {
	MSG msg;
	for(;;) {
		while(PeekMessageA(&msg, nullptr, 0, 0, PM_REMOVE)) {
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}
		if(msg.message == WM_QUIT) {
			break;
		}
		if(requestAnimationFrameFunc != nullptr) {
			requestAnimationFrameFunc();
		}
		SwapBuffers(hDC);
	}
}