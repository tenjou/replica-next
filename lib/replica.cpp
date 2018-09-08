#define _USE_MATH_DEFINES

#include <iostream>
#include <string>
#include <cmath>
#include <algorithm>

struct console {
	static void log(std::string text) {
		std::cout << text << std::endl;
	}
};

struct Math {
	static const double PI;

	static double min(double a, double b) {
		return std::min(a, b);
	}

	static double max(double a, double b) {
		return std::max(a, b);
	}
};

template<class T>
struct Array {
	T *buffer;
	int length;

	T &operator[](unsigned int index) {
		return (index > length) ? 0 : this->buffer[index];
	}
};

struct Float32Array {
	float *buffer;
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
		for (int n = 0; n < src.length; n++) {
			this->buffer[n] = static_cast<float>(src.buffer[n]);
		}
	}
};

const double Math::PI = M_PI;