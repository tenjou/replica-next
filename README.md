# Replica 0.1v
Replica is in early stages for being both JavaScript static analsyer and native compiler. Any code that is statically written (no eval, no dynamic code loading) is not supported and will net compilation errors. Currently code is compiled to C++ and piggybacks on C++ compiler work.

# Why
- Smaller executables and not reliant on WebView packages
- More granular control for memory and performance
- Ability to compile back to WASM and potentially better minifying & uglifying options when recompiling back to JavaScript.

# Usage
```
npm install
npm run dev
```
Open http://localhost:8090 and in console compiled code(located in `data/index.js`) will be outputed out. Runtime library (replica.cpp) is located in `libs/replica.cpp`.

# Next Milestone
- Texture loading & support
- Input loading & support
- CLI tools
- Online sandbox

# License

[MIT License](LICENSE.md)
