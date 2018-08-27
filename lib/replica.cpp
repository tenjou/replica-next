#include <iostream>
#include <cmath>

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

const double Math::PI = M_PI;