
// proxies for named-listeners as property
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/EventTarget

export let EventTargetProxy = class {
    #fId = 0
    #lmap = {}

    #listen(name, fn) {
        let names = name.split('.')
        let ename = names[0]
        let fname = names[1] || fn.name || `listener-${(++(this.#fId))}`
        let lname = `${ename}.${fname}`

        this.#remove(lname)

        let lfn = this.#lmap[lname] = (e) => {
            fn(e.detail)
        }
        this.et_.addEventListener(ename, lfn)
        return lname
    }

    #dispatch (name, data, config={}) {
        let ce = new CustomEvent(name, { ...config, detail:data })
        this.et_.dispatchEvent(ce)
    }

    #remove(lname) {
        let lfn = this.#lmap[lname]
        if (!lfn) return false

        delete this.#lmap[lname]

        let names = lname.split('.')
        let ename = names[0]
        this.et_.removeEventListener(ename, lfn)
        return true
    }

    constructor(el) {
        this.et_ = el instanceof EventTarget
            ? el
            : (new EventTarget())

        return new Proxy(this, {
            set(me, name, fn) {
                // subscribe if a function
                if (typeof(fn)==='function') {
                    return me.#listen.apply(me, [name, fn])
                }
                // publish otherwise
                else {
                    me.#dispatch.apply(me, [name, fn])
                    return fn
                }
            },
            has(me, name) {
                return me.#lmap[name]
            },
            get(me, name) {
                return me.#lmap[name]
            },
            deleteProperty(me, regExp) {
                let names
                try {
                    let re = new RegExp(regExp)
                    names = Object.keys(me.#lmap).filter((n) => re.test(n))
                } catch(_) {
                    names = [regExp]
                }
                names.forEach(n => me.#remove(n))
                return true
            },
            // for Object.getOwnPropertyNames
            ownKeys(me) {
                return Object.keys(me.#lmap)
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