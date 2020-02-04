"use strict";

(() => {
	window.__modules = {}

	window.__inherits = (a, b) => {
		const protoA = a.prototype
		const proto = Object.create(b.prototype)

		for(let key in protoA) {
			const param = Object.getOwnPropertyDescriptor(protoA, key)
			if(param.get || param.set) {
				Object.defineProperty(proto, key, param)
			}
			else {
				proto[key] = protoA[key]
			}
		}

		a.prototype = proto
		a.prototype.constructor = a
		a.__parent = b

		if(b.__inherit === undefined) {
			b.__inherit = {}
		}

		b.__inherit[a.name] = a

		const parent = b.__parent
		while(parent) {
			parent.__inherit[a.name] = a
			parent = parent.__parent
		}
	}

	window.__exportAll = (obj, exports) => {
		Object.keys(obj).forEach((key) => {
			if(key === "default" || key === "__esModule") {
				return
			}
			Object.defineProperty(exports, key, {
				enumerable: true,
				get() {
					return obj[key]
				}
			})
		})
	}
})();
