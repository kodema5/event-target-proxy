
// proxies for named-listeners as property
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/EventTarget

export let EventTargetProxy = class {
    _fId = 0
    _lmap = {}

    _listen(name, fn) {
        let names = name.split('.')
        let ename = names[0]
        let fname = names[1] || fn.name || `listener-${(++(this._fId))}`
        let lname = `${ename}.${fname}`

        this._remove(lname)

        let lfn = this._lmap[lname] = (e) => {
            fn(e.detail)
        }
        this._el.addEventListener(ename, lfn)
        return lname
    }

    _dispatch (name, data) {
        let ce = new CustomEvent(name, { detail:data })
        this._el.dispatchEvent(ce)
    }

    _remove(lname) {
        let lfn = this._lmap[lname]
        if (!lfn) return false

        delete this._lmap[lname]

        let names = lname.split('.')
        let ename = names[0]
        this._el.removeEventListener(ename, lfn)
        return true
    }

    constructor(el) {
        this._el = el instanceof EventTarget
            ? el
            : (new EventTarget())

        return new Proxy(this, {
            set(me, name, fn) {
                // subscribe if a function
                if (typeof(fn)==='function') {
                    return me._listen.apply(me, [name, fn])
                }
                // publish otherwise
                else {
                    me._dispatch.apply(me, [name, fn])
                    return fn
                }
            },
            has(me, name) {
                return me._lmap[name]
            },
            get(me, name) {
                return me._lmap[name]
            },
            deleteProperty(me, lname) {
                me._remove(lname)
                return true
            },
            // for Object.getOwnPropertyNames
            ownKeys(me) {
                return Object.keys(me._lmap)
            },
            // for Object.keys
            getOwnPropertyDescriptor(target, prop) {
                return {
                    enumerable: true,
                    configurable: true
                };
              }
        })
    }
}